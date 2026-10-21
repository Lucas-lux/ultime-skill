'use strict';
// Shell command parsing for the rules: heredocs, command segments, words, git calls.
// Good enough for the commands an agent writes (bash and PowerShell); not a full shell parser.

const path = require('node:path');

const HEREDOC_START = /<<(-?)[ \t]*(['"]?)([A-Za-z_][\w-]*)\2/g;
const ASSIGNMENT = /^[A-Za-z_][A-Za-z0-9_]*=/;
const PREFIX_COMMANDS = new Set(['sudo', 'command', 'env', 'time', 'nohup', 'exec']);
// git global options that take a separate value.
const GIT_VALUE_OPTIONS = new Set(['-C', '-c', '--git-dir', '--work-tree', '--namespace', '--exec-path']);

/**
 * Split heredoc bodies out of a command.
 *
 * @param {string} command Full command text.
 * @returns {{text: string, heredocs: {delimiter: string, body: string}[]}} The command without the
 *   heredoc bodies, and the bodies in order of appearance.
 */
function extractHeredocs(command) {
  const lines = command.split('\n');
  const kept = [];
  const heredocs = [];
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    kept.push(line);
    const starts = [...line.matchAll(HEREDOC_START)];
    for (const start of starts) {
      const stripTabs = start[1] === '-';
      const delimiter = start[3];
      const body = [];
      while (++index < lines.length) {
        const candidate = stripTabs ? lines[index].replace(/^\t+/, '') : lines[index];
        // The closing delimiter may be followed by the rest of a command, e.g. `EOF` then `)"`.
        if (candidate === delimiter || candidate.startsWith(`${delimiter})`)) {
          if (candidate !== delimiter) kept.push(candidate.slice(delimiter.length));
          break;
        }
        body.push(lines[index]);
      }
      heredocs.push({ delimiter, body: body.join('\n') });
    }
  }
  return { text: kept.join('\n'), heredocs };
}

/**
 * Cut a command into simple commands at ; && || | & and newlines outside quotes.
 *
 * @param {string} text Command without heredoc bodies.
 * @returns {string[]} The simple commands, trimmed, empty ones dropped.
 */
function splitSegments(text) {
  const segments = [];
  let current = '';
  let quote = null;
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (quote) {
      if (char === '\\' && quote === '"' && index + 1 < text.length) {
        current += char + text[++index];
        continue;
      }
      if (char === quote) quote = null;
      current += char;
      continue;
    }
    if (char === "'" || char === '"') {
      quote = char;
      current += char;
      continue;
    }
    if (char === '\\' && index + 1 < text.length) {
      current += char + text[++index];
      continue;
    }
    const redirectAmpersand = char === '&' && (/[<>]$/.test(current) || text[index + 1] === '>');
    if ((char === ';' || char === '\n' || char === '|' || char === '&') && !redirectAmpersand) {
      segments.push(current);
      current = '';
      if ((char === '|' || char === '&') && text[index + 1] === char) index++;
      continue;
    }
    current += char;
  }
  segments.push(current);
  return segments.map((segment) => segment.trim().replace(/^[({]\s*/, '').replace(/\s*[)}]$/, '')).filter(Boolean);
}

/**
 * Split a simple command into words, quotes removed.
 *
 * @param {string} segment One simple command.
 * @returns {string[]} Its words.
 */
function words(segment) {
  const result = [];
  let current = '';
  let started = false;
  let quote = null;
  for (let index = 0; index < segment.length; index++) {
    const char = segment[index];
    if (quote) {
      if (char === '\\' && quote === '"' && /["\\$`]/.test(segment[index + 1] || '')) {
        current += segment[++index];
      } else if (char === quote) {
        quote = null;
      } else {
        current += char;
      }
      continue;
    }
    if (char === "'" || char === '"') {
      quote = char;
      started = true;
    } else if (char === '\\' && index + 1 < segment.length) {
      current += segment[++index];
      started = true;
    } else if (/\s/.test(char)) {
      if (started) result.push(current);
      current = '';
      started = false;
    } else {
      current += char;
      started = true;
    }
  }
  if (started) result.push(current);
  return result;
}

/**
 * Drop the leading variable assignments and wrappers (sudo, env...) of a word list.
 *
 * @param {string[]} list Words of a simple command.
 * @returns {{assignments: string[], words: string[]}} Assignments found, and the command words.
 */
function stripPrefixes(list) {
  const assignments = [];
  let index = 0;
  while (index < list.length && (ASSIGNMENT.test(list[index]) || PREFIX_COMMANDS.has(list[index]))) {
    if (ASSIGNMENT.test(list[index])) assignments.push(list[index]);
    index++;
  }
  return { assignments, words: list.slice(index) };
}

/**
 * Tell whether a word names a program, ignoring its directory and a Windows extension.
 *
 * @param {string} word First word of a command.
 * @param {string} name Program name.
 * @returns {boolean} True when the word runs that program.
 */
function isProgram(word, name) {
  if (!word) return false;
  const base = word.replace(/\\/g, '/').split('/').pop().toLowerCase();
  return base === name || base === `${name}.exe`;
}

/**
 * Parse every simple command of a full command, following `cd` for the working directory.
 *
 * @param {string} command Full command text.
 * @param {string} cwd Directory the command starts in.
 * @returns {{segments: {text: string, words: string[], assignments: string[], cwd: string}[], heredocs: {delimiter: string, body: string}[]}}
 */
function parseCommand(command, cwd) {
  const { text, heredocs } = extractHeredocs(command || '');
  let directory = cwd;
  const segments = [];
  for (const segmentText of splitSegments(text)) {
    const stripped = stripPrefixes(words(segmentText));
    const list = stripped.words;
    if ((isProgram(list[0], 'cd') || /^(set-location|sl|pushd)$/i.test(list[0] || '')) && list[1]) {
      const target = list[list.length - 1].replace(/^~(?=$|[\\/])/, process.env.HOME || process.env.USERPROFILE || '~');
      directory = path.resolve(directory, target);
    }
    segments.push({ text: segmentText, words: list, assignments: stripped.assignments, cwd: directory });
  }
  return { segments, heredocs };
}

/**
 * Read a git call from a parsed segment.
 *
 * @param {{words: string[], cwd: string}} segment Parsed simple command.
 * @returns {{subcommand: string, args: string[], cwd: string, config: string[]} | null} The git
 *   subcommand and its arguments, the directory it runs in (after -C) and its -c settings.
 */
function gitCall(segment) {
  const list = segment.words;
  if (!isProgram(list[0], 'git')) return null;
  let directory = segment.cwd;
  const config = [];
  let index = 1;
  while (index < list.length && list[index].startsWith('-')) {
    const option = list[index];
    const [name, inlineValue] = option.split(/=(.*)/s);
    if (GIT_VALUE_OPTIONS.has(name)) {
      const value = inlineValue !== undefined ? inlineValue : list[++index];
      if (name === '-C' && value) directory = path.resolve(directory, value);
      if (name === '-c' && value) config.push(value);
    }
    index++;
  }
  if (index >= list.length) return null;
  return { subcommand: list[index], args: list.slice(index + 1), cwd: directory, config };
}

module.exports = { extractHeredocs, splitSegments, words, parseCommand, gitCall, isProgram };
