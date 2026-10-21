'use strict';
// Read-only git queries used by the rules. Every call is bounded in time and never throws.

const { execFileSync } = require('node:child_process');

const TIMEOUT_MS = 4000;
// A staged diff may be large (lockfiles, generated files): read it whole.
const MAX_BUFFER = 256 * 1024 * 1024;

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
 * Lines added by the staged changes.
 *
 * @param {string} cwd Directory in the repository.
 * @returns {{file: string, line: string}[]} Each added line with its file.
 */
function stagedAddedLines(cwd) {
  // A distinct indicator for added lines, so a line starting with "++" is never read as a file header.
  const output = git(cwd, ['diff', '--cached', '--no-color', '--no-ext-diff', '-U0', '--output-indicator-new=>', '--diff-filter=ACMR']);
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

module.exports = { git, root, currentBranch, pushTarget, stagedFiles, stagedAddedLines };
