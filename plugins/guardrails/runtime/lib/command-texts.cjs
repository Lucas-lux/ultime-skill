'use strict';
// What a shell command writes for humans: commit messages, PR and issue titles and bodies, and
// whether it writes files. The rules check these texts rather than the raw command.

const fs = require('node:fs');
const path = require('node:path');

const { parseCommand, gitCall, isProgram } = require('./shell.cjs');

const REDIRECT = /(?:^|[^<>&\d])>>?(?!&)\s*(?!\/dev\/null\b)\S/;
const FILE_WRITERS = /^(tee|set-content|add-content|out-file|sc|ac)$/i;
const IN_PLACE = /^(sed|perl|ruby)$/;
const GH_TEXT_COMMANDS = {
  pr: new Set(['create', 'edit', 'comment', 'review']),
  issue: new Set(['create', 'edit', 'comment']),
  release: new Set(['create', 'edit']),
};

/**
 * Read a message file named by an option: `-` is the first heredoc, other paths are read from disk.
 *
 * @param {string} file Option value.
 * @param {string} cwd Directory of the command.
 * @param {{body: string}[]} heredocs Heredoc bodies of the command.
 * @returns {string | null} The text, or null when it cannot be read.
 */
function readMessageFile(file, cwd, heredocs) {
  if (file === '-') return heredocs.length ? heredocs[0].body : null;
  try {
    return fs.readFileSync(path.resolve(cwd, file), 'utf8');
  } catch {
    return null;
  }
}

/**
 * Value of a message option that may wrap a heredoc, as in -m "$(cat <<'EOF' ... EOF)".
 *
 * @param {string} value Option value as parsed.
 * @param {{body: string}[]} heredocs Heredoc bodies of the command.
 * @returns {string} The text the shell would pass.
 */
function resolveValue(value, heredocs) {
  return value.includes('<<') && heredocs.length ? heredocs[0].body : value;
}

/**
 * Collect the values of options from a word list.
 *
 * @param {string[]} args Words after the subcommand.
 * @param {string[]} longNames Long option names, e.g. ['--message'].
 * @param {string[]} shortNames Short option letters, e.g. ['m'].
 * @returns {string[]} Every value given, in order.
 */
function optionValues(args, longNames, shortNames) {
  const values = [];
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    const long = longNames.find((name) => arg === name || arg.startsWith(`${name}=`));
    if (long) {
      values.push(arg === long ? args[++index] ?? '' : arg.slice(long.length + 1));
      continue;
    }
    const short = /^-([A-Za-z]+)$/.exec(arg) || /^-([A-Za-z])(.+)$/.exec(arg);
    if (!short) continue;
    if (short[2] !== undefined && shortNames.includes(short[1])) {
      values.push(short[2]);
    } else if (short[2] === undefined && shortNames.includes(short[1].slice(-1))) {
      values.push(args[++index] ?? '');
    }
  }
  return values;
}

/**
 * Message of a git commit call.
 *
 * @param {{args: string[], cwd: string}} call Parsed git commit.
 * @param {{body: string}[]} heredocs Heredoc bodies of the command.
 * @returns {string | null} The message, or null when the commit reuses one or opens an editor.
 */
function commitMessage(call, heredocs) {
  const messages = optionValues(call.args, ['--message'], ['m']).map((value) => resolveValue(value, heredocs));
  if (messages.length) return messages.join('\n\n');
  const file = optionValues(call.args, ['--file'], ['F'])[0];
  if (file !== undefined) return readMessageFile(file, call.cwd, heredocs);
  // No message given: the commit reuses one (--no-edit, -C, --fixup) or opens an editor.
  return null;
}

/**
 * Title and body written by a gh call, if it writes any.
 *
 * @param {string[]} list Words of the segment, starting with gh.
 * @param {string} cwd Directory of the command.
 * @param {{body: string}[]} heredocs Heredoc bodies of the command.
 * @returns {{kind: string, action: string, title: string | null, body: string | null, endpoint?: string} | null}
 */
function ghText(list, cwd, heredocs) {
  const [, group, action] = list;
  const args = list.slice(3);
  if (GH_TEXT_COMMANDS[group] && GH_TEXT_COMMANDS[group].has(action)) {
    const title = optionValues(args, ['--title'], ['t'])[0];
    let body = optionValues(args, ['--body', '--notes'], ['b', 'n'])[0];
    const bodyFile = optionValues(args, ['--body-file', '--notes-file'], ['F'])[0];
    if (body === undefined && bodyFile !== undefined) body = readMessageFile(bodyFile, cwd, heredocs);
    return { kind: group, action, title: title === undefined ? null : resolveValue(title, heredocs), body: body == null ? null : resolveValue(body, heredocs) };
  }
  if (group === 'api') {
    const endpoint = list.slice(2).find((word) => !word.startsWith('-') && /\//.test(word)) || '';
    const fields = {};
    for (const value of optionValues(list.slice(2), ['--field', '--raw-field'], ['f', 'F'])) {
      const separator = value.indexOf('=');
      if (separator < 0) continue;
      const key = value.slice(0, separator);
      let content = value.slice(separator + 1);
      if (content.startsWith('@')) content = readMessageFile(content.slice(1), cwd, heredocs) ?? '';
      fields[key] = resolveValue(content, heredocs);
    }
    if (fields.title === undefined && fields.body === undefined) return null;
    const method = (optionValues(list.slice(2), ['--method'], ['X'])[0] || 'POST').toUpperCase();
    return { kind: 'api', action: method, endpoint, title: fields.title ?? null, body: fields.body ?? null };
  }
  return null;
}

/**
 * Tell whether a simple command writes files.
 *
 * @param {{text: string, words: string[]}} segment Parsed simple command.
 * @returns {boolean} True for a redirection, tee, in-place edit or PowerShell file writer.
 */
function writesFiles(segment) {
  const unquoted = segment.text.replace(/'[^']*'|"(?:\\.|[^"\\])*"/g, '""');
  if (REDIRECT.test(unquoted)) return true;
  const program = (segment.words[0] || '').replace(/\\/g, '/').split('/').pop();
  if (FILE_WRITERS.test(program)) return true;
  return IN_PLACE.test(program) && segment.words.some((word) => /^-[A-Za-z]*i/.test(word));
}

/**
 * Everything the rules need to know about a shell command.
 *
 * @param {string} command Full command.
 * @param {string} cwd Directory it starts in.
 * @returns {{text: string, segments: object[], heredocs: object[], gitCalls: object[], commits: object[], ghTexts: object[], writes: boolean}}
 */
function analyzeCommand(command, cwd) {
  const { segments, heredocs } = parseCommand(command, cwd);
  const gitCalls = [];
  const commits = [];
  const ghTexts = [];
  let writes = false;
  for (const segment of segments) {
    const call = gitCall(segment);
    if (call) {
      call.assignments = segment.assignments;
      gitCalls.push(call);
      if (call.subcommand === 'commit') commits.push({ call, message: commitMessage(call, heredocs) });
    }
    if (isProgram(segment.words[0], 'gh')) {
      const text = ghText(segment.words, segment.cwd, heredocs);
      if (text) ghTexts.push(text);
    }
    if (writesFiles(segment)) writes = true;
  }
  return { text: command || '', segments, heredocs, gitCalls, commits, ghTexts, writes };
}

module.exports = { analyzeCommand, optionValues, writesFiles, commitMessage };
