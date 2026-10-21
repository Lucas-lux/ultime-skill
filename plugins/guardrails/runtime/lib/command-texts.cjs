'use strict';
// What a shell command writes for humans: commit messages, PR and issue titles and bodies, and
// whether it writes files. The rules check these texts rather than the raw command.

const fs = require('node:fs');
const path = require('node:path');

const { parseCommand, gitCall, isProgram, programName } = require('./shell.cjs');

const REDIRECT = /(?:^|[^<>&\d])>>?(?!&)\s*(?!\/dev\/null\b)\S/;
const FILE_WRITERS = /^(tee|set-content|add-content|out-file|sc|ac)$/i;
const IN_PLACE = /^(sed|perl|ruby)$/;
const GH_TEXT_COMMANDS = {
  pr: new Set(['create', 'edit', 'comment', 'review']),
  issue: new Set(['create', 'edit', 'comment']),
  release: new Set(['create', 'edit']),
};
// git commit options that take a separate value.
const COMMIT_VALUE_OPTIONS = /^(-m|-F|-C|-c|-t|--message|--file|--author|--date|--trailer|--fixup|--squash|--reuse-message|--reedit-message|--template|--cleanup)$/;

/**
 * Heredoc fed to a command's standard input: its own, else the last one of the previous segment
 * (`cat <<EOF | git commit -F -`).
 *
 * @param {object} segment Parsed simple command.
 * @returns {string | null} The body, or null.
 */
function stdinText(segment) {
  const heredoc = segment.stdin || segment.previous;
  return heredoc ? heredoc.body : null;
}

/**
 * Read a message file named by an option: `-` is the standard input heredoc, other paths are read from disk.
 *
 * @param {string} file Option value.
 * @param {object} segment Parsed simple command.
 * @returns {string | null} The text, or null when it cannot be read.
 */
function readMessageFile(file, segment) {
  if (file === '-') return stdinText(segment);
  try {
    return fs.readFileSync(path.resolve(segment.cwd, file), 'utf8');
  } catch {
    return null;
  }
}

/**
 * Value of a message option that may wrap a heredoc, as in -m "$(cat <<'EOF' ... EOF)": the heredoc
 * is the one that starts in the option's own word.
 *
 * @param {{value: string, index: number}} entry Option value and the index of its word in the segment.
 * @param {object} segment Parsed simple command.
 * @returns {string} The text the shell would pass.
 */
function resolveValue(entry, segment) {
  if (!entry.value.includes('<<')) return entry.value;
  const token = segment.tokens[entry.index];
  const own = token ? segment.heredocs.find((heredoc) => heredoc.offset >= token.start && heredoc.offset < token.end) : null;
  if (own) return own.body;
  return segment.heredocs.length ? segment.heredocs[0].body : entry.value;
}

/**
 * Collect the values of options from a word list, with the index of the word holding each value.
 *
 * @param {string[]} args Words after the subcommand.
 * @param {string[]} longNames Long option names, e.g. ['--message'].
 * @param {string[]} shortNames Short option letters, e.g. ['m'].
 * @param {number} [offset] Index of args[0] in the segment words.
 * @returns {{value: string, index: number}[]} Every value given, in order.
 */
function optionEntries(args, longNames, shortNames, offset = 0) {
  const entries = [];
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    const long = longNames.find((name) => arg === name || arg.startsWith(`${name}=`));
    if (long) {
      if (arg === long) {
        index++;
        entries.push({ value: args[index] ?? '', index: offset + index });
      } else {
        entries.push({ value: arg.slice(long.length + 1), index: offset + index });
      }
      continue;
    }
    const short = /^-([A-Za-z]+)$/.exec(arg) || /^-([A-Za-z])(.+)$/.exec(arg);
    if (!short) continue;
    if (short[2] !== undefined && shortNames.includes(short[1])) {
      entries.push({ value: short[2], index: offset + index });
    } else if (short[2] === undefined && shortNames.includes(short[1].slice(-1))) {
      index++;
      entries.push({ value: args[index] ?? '', index: offset + index });
    }
  }
  return entries;
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
  return optionEntries(args, longNames, shortNames).map((entry) => entry.value);
}

/**
 * Message of a git commit call.
 *
 * @param {{args: string[], argsStart: number, segment: object}} call Parsed git commit.
 * @returns {string | null} The message, or null when the commit reuses one or opens an editor.
 */
function commitMessage(call) {
  const messages = optionEntries(call.args, ['--message'], ['m'], call.argsStart).map((entry) => resolveValue(entry, call.segment));
  if (messages.length) return messages.join('\n\n');
  const file = optionValues(call.args, ['--file'], ['F'])[0];
  if (file !== undefined) return readMessageFile(file, { ...call.segment, cwd: call.cwd });
  // No message given: the commit reuses one (--no-edit, -C, --fixup) or opens an editor.
  return null;
}

/**
 * Title and body written by a gh call, if it writes any.
 *
 * @param {object} segment Parsed simple command whose words start with gh.
 * @returns {{kind: string, action: string, title: string | null, body: string | null, endpoint?: string} | null}
 */
function ghText(segment) {
  const list = segment.words;
  const [, group, action] = list;
  if (GH_TEXT_COMMANDS[group] && GH_TEXT_COMMANDS[group].has(action)) {
    const args = list.slice(3);
    const title = optionEntries(args, ['--title'], ['t'], 3)[0];
    const bodyEntry = optionEntries(args, ['--body', '--notes'], ['b', 'n'], 3)[0];
    let body = bodyEntry === undefined ? undefined : resolveValue(bodyEntry, segment);
    const bodyFile = optionValues(args, ['--body-file', '--notes-file'], ['F'])[0];
    if (body === undefined && bodyFile !== undefined) body = readMessageFile(bodyFile, segment);
    return { kind: group, action, title: title === undefined ? null : resolveValue(title, segment), body: body ?? null };
  }
  if (group === 'api') {
    const args = list.slice(2);
    const endpoint = apiEndpoint(args);
    const fields = apiFields(segment);
    if (fields.title === undefined && fields.body === undefined) return null;
    const method = (optionValues(args, ['--method'], ['X'])[0] || 'POST').toUpperCase();
    return { kind: 'api', action: method, endpoint, title: fields.title ?? null, body: fields.body ?? null };
  }
  return null;
}

/**
 * Endpoint of a gh api call: its first operand, option values skipped.
 *
 * @param {string[]} args Words after `gh api`.
 * @returns {string} The endpoint without its query string, or an empty string.
 */
function apiEndpoint(args) {
  const valueOptions = /^(-X|--method|-f|-F|--field|--raw-field|-H|--header|--input|-q|--jq|-t|--template|--hostname|--cache|-p|--preview)$/;
  for (let index = 0; index < args.length; index++) {
    if (valueOptions.test(args[index])) {
      index++;
    } else if (!args[index].startsWith('-')) {
      return args[index].split('?')[0];
    }
  }
  return '';
}

/**
 * Fields of a gh api call (-f, -F, --field, --raw-field), `@file` values read.
 *
 * @param {object} segment Parsed simple command whose words start with `gh api`.
 * @returns {Object<string, string>} Field values by key.
 */
function apiFields(segment) {
  const fields = {};
  for (const entry of optionEntries(segment.words.slice(2), ['--field', '--raw-field'], ['f', 'F'], 2)) {
    const separator = entry.value.indexOf('=');
    if (separator < 0) continue;
    const key = entry.value.slice(0, separator);
    let content = entry.value.slice(separator + 1);
    if (content.startsWith('@')) content = readMessageFile(content.slice(1), segment) ?? '';
    fields[key] = resolveValue({ value: content, index: entry.index }, segment);
  }
  return fields;
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
 * What a git call before a commit would add to it: `git add` with paths, -A, --all or -u, and
 * `git commit -a`. The rules read these changes as well as the staged ones.
 *
 * @param {{subcommand: string, args: string[], cwd: string}} call Parsed git call.
 * @returns {{cwd: string, pathspecs: string[], untracked: boolean} | null} Paths to read, whether
 *   untracked files count, or null when the call stages nothing.
 */
function stagingOf(call) {
  if (call.subcommand === 'add') {
    const paths = [];
    let all = false;
    let update = false;
    let dashes = false;
    for (const arg of call.args) {
      if (dashes || !arg.startsWith('-') || arg === '-') paths.push(arg);
      else if (arg === '--') dashes = true;
      else if (arg === '-A' || arg === '--all' || (/^-[A-Za-z]+$/.test(arg) && arg.includes('A'))) all = true;
      else if (arg === '-u' || arg === '--update' || (/^-[A-Za-z]+$/.test(arg) && arg.includes('u'))) update = true;
    }
    if (paths.length) return { cwd: call.cwd, pathspecs: paths, untracked: !update };
    if (all || update) return { cwd: call.cwd, pathspecs: [':/'], untracked: all };
    return null;
  }
  if (call.subcommand === 'commit') {
    for (let index = 0; index < call.args.length; index++) {
      const arg = call.args[index];
      if (COMMIT_VALUE_OPTIONS.test(arg)) index++;
      else if (arg === '--all' || (/^-[A-Za-z]+$/.test(arg) && arg.slice(1).split('m')[0].includes('a'))) {
        return { cwd: call.cwd, pathspecs: [':/'], untracked: false };
      }
    }
  }
  return null;
}

/**
 * Text written into files by a command, for the character rules. Text transformers (sed, perl,
 * awk, tr) are left out: the character they hold is the pattern they remove, not text they add.
 *
 * @param {object[]} segments Parsed simple commands.
 * @param {{body: string}[]} heredocs Heredoc bodies of the command.
 * @returns {string} Segments and heredoc bodies, joined.
 */
function writtenText(segments, heredocs) {
  const kept = segments.filter((segment) => !/^(sed|perl|awk|gawk|tr)$/.test(programName(segment.words[0])));
  return [...kept.map((segment) => segment.text), ...heredocs.map((heredoc) => heredoc.body)].join('\n');
}

/**
 * Everything the rules need to know about a shell command.
 *
 * @param {string} command Full command.
 * @param {string} cwd Directory it starts in.
 * @param {{powershell?: boolean}} [options] Shell dialect (PowerShell tool or bash).
 * @returns {{text: string, segments: object[], heredocs: object[], gitCalls: object[], commits: object[], ghTexts: object[], staging: object[], writes: boolean, written: string}}
 */
function analyzeCommand(command, cwd, options = {}) {
  const { segments, heredocs } = parseCommand(command, cwd, options);
  const gitCalls = [];
  const commits = [];
  const ghTexts = [];
  const adds = [];
  const staging = [];
  let writes = false;
  for (const segment of segments) {
    const call = gitCall(segment);
    if (call) {
      call.assignments = segment.assignments;
      gitCalls.push(call);
      if (call.subcommand === 'add') {
        const pending = stagingOf(call);
        if (pending) adds.push(pending);
      }
      if (call.subcommand === 'commit') {
        commits.push({ call, message: commitMessage(call) });
        // Files added earlier in the same command are not staged yet when this hook runs.
        staging.push(...adds.splice(0));
        const pending = stagingOf(call);
        if (pending) staging.push(pending);
      }
    }
    if (isProgram(segment.words[0], 'gh')) {
      const text = ghText(segment);
      if (text) ghTexts.push(text);
    }
    if (writesFiles(segment)) writes = true;
  }
  return { text: command || '', segments, heredocs, gitCalls, commits, ghTexts, staging, writes, written: writtenText(segments, heredocs) };
}

module.exports = { analyzeCommand, optionValues, optionEntries, apiEndpoint, apiFields, writesFiles, commitMessage };
