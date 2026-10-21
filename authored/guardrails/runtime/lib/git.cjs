'use strict';
// Read-only git queries used by the rules. Every call is bounded in time and never throws.

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const TIMEOUT_MS = 4000;
// A staged diff may be large (lockfiles, generated files): read it whole.
const MAX_BUFFER = 256 * 1024 * 1024;
// Untracked files about to be added are read whole, within these bounds.
const MAX_UNTRACKED_BYTES = 1024 * 1024;
const MAX_UNTRACKED_FILES = 300;

/**
 * Run a git command and return its trimmed output, or null when it fails.
 *
 * @param {string} cwd Directory to run in.
 * @param {string[]} args Arguments after `git`.
 * @returns {string | null} Standard output, or null on any error.
 */
function git(cwd, args) {
  try {
    return execFileSync('git', args, {
      cwd,
      encoding: 'utf8',
      timeout: TIMEOUT_MS,
      maxBuffer: MAX_BUFFER,
      stdio: ['ignore', 'pipe', 'ignore'],
    }).replace(/\s+$/, '');
  } catch {
    return null;
  }
}

/** @param {string} cwd Any directory inside a work tree. @returns {string | null} Its root. */
function root(cwd) {
  return git(cwd, ['rev-parse', '--show-toplevel']);
}

/** @param {string} cwd Directory in the repository. @returns {string | null} Current branch, null when detached. */
function currentBranch(cwd) {
  const branch = git(cwd, ['symbolic-ref', '--quiet', '--short', 'HEAD']);
  return branch || null;
}

/**
 * Name of the remote branch a plain `git push` updates from the current branch.
 *
 * @param {string} cwd Directory in the repository.
 * @returns {string | null} Upstream branch name without the remote, else the current branch.
 */
function pushTarget(cwd) {
  const upstream = git(cwd, ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}']);
  if (upstream && upstream.includes('/')) return upstream.slice(upstream.indexOf('/') + 1);
  return currentBranch(cwd);
}

/** @param {string} cwd Directory in the repository. @returns {string[]} Staged file paths (added, copied, modified, renamed). */
function stagedFiles(cwd) {
  const output = git(cwd, ['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z']);
  return output ? output.split('\0').filter(Boolean) : [];
}

/**
 * Lines added by a diff printed with `--output-indicator-new=>`, with their file.
 *
 * @param {string | null} output Diff text.
 * @returns {{file: string, line: string}[]} Each added line with its file.
 */
function addedLines(output) {
  if (!output) return [];
  const result = [];
  let file = null;
  for (const line of output.split('\n')) {
    if (line.startsWith('+++ ')) {
      file = line.slice(4).replace(/^b\//, '');
    } else if (line.startsWith('>') && file) {
      result.push({ file, line: line.slice(1) });
    }
  }
  return result;
}

/**
 * Lines added by the staged changes.
 *
 * @param {string} cwd Directory in the repository.
 * @returns {{file: string, line: string}[]} Each added line with its file.
 */
function stagedAddedLines(cwd) {
  // A distinct indicator for added lines, so a line starting with "++" is never read as a file header.
  return addedLines(git(cwd, ['diff', '--cached', '--no-color', '--no-ext-diff', '-U0', '--output-indicator-new=>', '--diff-filter=ACMR']));
}

/**
 * Changes a `git add` or `git commit -a` would stage, read before it runs: tracked modifications
 * (added lines against HEAD) and, when asked, untracked files that are not ignored (whole content,
 * at most MAX_UNTRACKED_FILES files of MAX_UNTRACKED_BYTES each).
 *
 * @param {string} cwd Directory the staging command runs in (pathspecs are relative to it).
 * @param {string[]} pathspecs Paths given to git add, or [':/'] for the whole tree.
 * @param {boolean} untracked Whether untracked files are staged too.
 * @returns {{files: string[], added: {file: string, line: string}[]}} Files (from the repository
 *   root) and their added lines.
 */
function pendingChanges(cwd, pathspecs, untracked) {
  const top = root(cwd);
  if (!top) return { files: [], added: [] };
  const diffArgs = ['--no-color', '--no-ext-diff', '-U0', '--output-indicator-new=>', '--diff-filter=ACMR', '--', ...pathspecs];
  // Without a first commit there is no HEAD: compare with the index instead.
  const diff = git(cwd, ['diff', 'HEAD', ...diffArgs]) ?? git(cwd, ['diff', ...diffArgs]);
  const added = addedLines(diff);
  const files = new Set();
  for (const line of (diff || '').split('\n')) if (line.startsWith('+++ b/')) files.add(line.slice(6));
  if (untracked) {
    const listing = git(cwd, ['ls-files', '--others', '--exclude-standard', '--full-name', '-z', '--', ...pathspecs]);
    for (const file of (listing || '').split('\0').filter(Boolean).slice(0, MAX_UNTRACKED_FILES)) {
      files.add(file);
      let content;
      try {
        const absolute = path.join(top, file);
        if (fs.statSync(absolute).size > MAX_UNTRACKED_BYTES) continue;
        content = fs.readFileSync(absolute, 'utf8');
      } catch {
        continue;
      }
      if (content.includes('\0')) continue;
      for (const line of content.split('\n')) added.push({ file, line });
    }
  }
  return { files: [...files], added };
}

/**
 * @param {string} cwd Directory in the repository.
 * @param {string} name Candidate branch name.
 * @returns {boolean} True when a local branch of that name exists.
 */
function branchExists(cwd, name) {
  if (!name || name.startsWith('-')) return false;
  return git(cwd, ['show-ref', '--verify', '--quiet', `refs/heads/${name}`]) !== null;
}

module.exports = { git, root, currentBranch, pushTarget, stagedFiles, stagedAddedLines, pendingChanges, branchExists };
