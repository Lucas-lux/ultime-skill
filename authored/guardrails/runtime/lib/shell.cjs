'use strict';
// Shell command parsing for the rules: heredocs, command segments, words, git calls.
// Good enough for the commands an agent writes (bash and PowerShell); not a full shell parser.

const os = require('node:os');
const path = require('node:path');

// `<<` starts a heredoc, `<<<` is a bash here-string and is not one.
const HEREDOC_START = /(?<!<)<<(?!<)(-?)[ \t]*(['"]?)([A-Za-z_][\w-]*)\2/g;
// A PowerShell here-string opens with @' or @" at the end of a line and closes with '@ or "@ at the start of one.
const HERE_STRING_START = /@(['"])[ \t]*$/;
// Redirection operator at the start of a word: [n|&|*] then > >> >| >& < << <<< <> <&.
const REDIRECTION = /^(?:\d+|&|\*)?(?:>>|>\||>&|>|<<<|<<-?|<>|<&|<)/;
const ASSIGNMENT = /^[A-Za-z_][A-Za-z0-9_]*=/;
// Wrappers that run the command given after their own options. `values` take a separate value,
// `positional` is the number of operands before the command (the timeout duration), `lookup`
// options mean the wrapper only looks the command up and runs nothing.
const WRAPPERS = {
  sudo: { values: ['-u', '-g', '-h', '-p', '-C', '-D', '-r', '-t', '-U', '-T', '--user', '--group', '--host', '--prompt', '--chdir', '--role', '--type', '--other-user', '--command-timeout', '--close-from'] },
  env: { values: ['-u', '-C', '-S', '--unset', '--chdir', '--split-string'] },
  timeout: { values: ['-s', '-k', '--signal', '--kill-after'], positional: 1 },
  nice: { values: ['-n', '--adjustment'] },
  stdbuf: { values: ['-i', '-o', '-e', '--input', '--output', '--error'] },
  ionice: { values: ['-c', '-n', '-p', '-P', '-u', '--class', '--classdata', '--pid', '--pgid', '--uid'] },
  nohup: { values: [] },
  time: { values: ['-f', '-o', '--format', '--output'] },
  command: { values: [], lookup: ['-v', '-V'] },
  builtin: { values: [] },
  exec: { values: ['-a'] },
};
// git global options that take a separate value.
const GIT_VALUE_OPTIONS = new Set(['-C', '-c', '--git-dir', '--work-tree', '--namespace', '--exec-path']);

/**
 * Split heredoc bodies out of a command. For PowerShell, a here-string is folded back into the
 * command as one single-quoted word, so it reads as the value it is.
 *
 * @param {string} command Full command text.
 * @param {{powershell?: boolean}} [options] Shell dialect.
 * @returns {{text: string, heredocs: {delimiter: string, body: string}[]}} The command without the
 *   heredoc bodies, and the bodies in order of appearance.
 */
function extractHeredocs(command, options = {}) {
  const lines = command.split('\n');
  const kept = [];
  const heredocs = [];
  for (let index = 0; index < lines.length; index++) {
    let line = lines[index];
    const hereString = options.powershell ? HERE_STRING_START.exec(line) : null;
    if (hereString) {
      const closing = `${hereString[1]}@`;
      const body = [];
      let rest = '';
      while (++index < lines.length) {
        if (lines[index].startsWith(closing)) {
          rest = lines[index].slice(closing.length);
          break;
        }
        body.push(lines[index]);
      }
      line = `${line.slice(0, hereString.index)}'${body.join('\n').replace(/'/g, "''")}'${rest}`;
    }
    kept.push(line);
    for (const start of line.matchAll(HEREDOC_START)) {
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
 * @param {{powershell?: boolean}} [options] Shell dialect: PowerShell escapes with a backtick and
 *   keeps the backslash literal.
 * @returns {string[]} The simple commands, trimmed, empty ones dropped.
 */
function splitSegments(text, options = {}) {
  const escape = options.powershell ? '`' : '\\';
  const segments = [];
  let current = '';
  let quote = null;
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (quote) {
      if (char === escape && quote === '"' && index + 1 < text.length) {
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
    if (char === escape && index + 1 < text.length) {
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
 * Split a simple command into tokens: each word with quotes removed, its raw text and its span.
 *
 * @param {string} segment One simple command.
 * @param {{powershell?: boolean}} [options] Shell dialect.
 * @returns {{value: string, raw: string, start: number, end: number}[]} Its tokens.
 */
function tokens(segment, options = {}) {
  const powershell = Boolean(options.powershell);
  const result = [];
  let current = '';
  let start = -1;
  let quote = null;
  const close = (end) => {
    if (start >= 0) result.push({ value: current, raw: segment.slice(start, end), start, end });
    current = '';
    start = -1;
  };
  for (let index = 0; index < segment.length; index++) {
    const char = segment[index];
    const next = segment[index + 1] || '';
    if (quote) {
      if (powershell && char === quote && next === quote) {
        current += segment[++index];
      } else if (powershell && char === '`' && quote === '"' && next) {
        current += segment[++index];
      } else if (!powershell && char === '\\' && quote === '"' && /["\\$`]/.test(next)) {
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
      if (start < 0) start = index;
    } else if (char === (powershell ? '`' : '\\') && index + 1 < segment.length) {
      if (start < 0) start = index;
      current += segment[++index];
    } else if (/\s/.test(char)) {
      close(index);
    } else {
      if (start < 0) start = index;
      current += char;
    }
  }
  close(segment.length);
  return result;
}

/**
 * Split a simple command into words, quotes removed.
 *
 * @param {string} segment One simple command.
 * @param {{powershell?: boolean}} [options] Shell dialect.
 * @returns {string[]} Its words.
 */
function words(segment, options = {}) {
  return tokens(segment, options).map((token) => token.value);
}

/** @param {string} word A command word. @returns {string} Its program name, lower case, without directory or .exe. */
function programName(word) {
  return (word || '').replace(/\\/g, '/').split('/').pop().toLowerCase().replace(/\.exe$/, '');
}

/**
 * Find where the command starts after the leading variable assignments and wrappers (sudo, env,
 * timeout...), skipping the wrappers' own options and operands.
 *
 * @param {string[]} list Words of a simple command.
 * @returns {{assignments: string[], start: number}} Assignments found, and the index of the command word.
 */
function stripPrefixes(list) {
  const assignments = [];
  let index = 0;
  while (index < list.length) {
    const word = list[index];
    if (ASSIGNMENT.test(word)) {
      assignments.push(word);
      index++;
      continue;
    }
    const wrapper = WRAPPERS[programName(word)];
    if (!wrapper) break;
    const wrapperIndex = index++;
    let lookup = false;
    while (index < list.length && list[index].startsWith('-') && list[index] !== '-') {
      const option = list[index++];
      if (option === '--') break;
      if ((wrapper.lookup || []).includes(option)) lookup = true;
      const [name, inlineValue] = option.split(/=(.*)/s);
      if (inlineValue === undefined && wrapper.values.includes(name)) index++;
    }
    // `command -v git` only prints where git is: the command word stays `command`.
    if (lookup) return { assignments, start: wrapperIndex };
    index += wrapper.positional || 0;
  }
  return { assignments, start: index };
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
  return programName(word) === name;
}

/**
 * Expand a leading home reference (~, $HOME, ${HOME}, $env:USERPROFILE, $env:HOME) of a path.
 *
 * @param {string} target Path as written in the command.
 * @returns {string} The path with the home directory spelled out.
 */
function expandHome(target) {
  return (target || '').replace(/^(?:~|\$\{HOME\}|\$HOME|\$env:(?:USERPROFILE|HOME))(?=$|[\\/])/i, () => os.homedir());
}

/**
 * Resolve a path written in a command: home expanded, Git Bash drive paths (/c/Users) read as
 * Windows drives on win32.
 *
 * @param {string} base Directory the command runs in.
 * @param {string} target Path as written.
 * @returns {string} Absolute path.
 */
function resolvePath(base, target) {
  let expanded = expandHome(target);
  if (process.platform === 'win32') expanded = expanded.replace(/^\/([a-zA-Z])(?:\/|$)/, (match, drive) => `${drive.toUpperCase()}:/`);
  return path.resolve(base, expanded);
}

/**
 * Take the redirections out of a token list: the operator word and, when separate, its target.
 *
 * @param {{value: string, raw: string, start: number, end: number}[]} list Tokens of a segment.
 * @param {{body: string, offset: number}[]} heredocs Heredocs that start in the segment.
 * @returns {{kept: object[], redirections: {op: string, target: string}[], stdin: object | null}}
 *   The other tokens, each redirection, and the heredoc fed to the command's standard input.
 */
function splitRedirections(list, heredocs) {
  const kept = [];
  const redirections = [];
  let stdin = null;
  for (let index = 0; index < list.length; index++) {
    const token = list[index];
    const match = REDIRECTION.exec(token.raw);
    if (!match) {
      kept.push(token);
      continue;
    }
    const op = match[0];
    let target = token.value.slice(op.length);
    let end = token.end;
    // `2>&1`, `>&2` and `>/dev/null` carry their target; `> file` and `<< EOF` take the next word.
    if (!target && index + 1 < list.length) {
      target = list[++index].value;
      end = list[index].end;
    }
    if (/^\d*<<-?$/.test(op)) {
      stdin = heredocs.find((heredoc) => heredoc.offset >= token.start && heredoc.offset < end) || stdin;
    }
    redirections.push({ op, target });
  }
  return { kept, redirections, stdin };
}

/**
 * Parse every simple command of a full command, following `cd` for the working directory.
 *
 * Each segment carries its words without redirections, the tokens behind those words, its
 * redirections, the heredocs that start in it (`heredocs`, each with `offset` in `text`), the one
 * fed to its standard input (`stdin`) and the last heredoc of the previous segment (`previous`,
 * for `cat <<EOF | git commit -F -`).
 *
 * @param {string} command Full command text.
 * @param {string} cwd Directory the command starts in.
 * @param {{powershell?: boolean}} [options] Shell dialect.
 * @returns {{segments: object[], heredocs: {delimiter: string, body: string}[]}}
 */
function parseCommand(command, cwd, options = {}) {
  const { text, heredocs } = extractHeredocs(command || '', options);
  let directory = cwd;
  let used = 0;
  let previous = null;
  const segments = [];
  for (const segmentText of splitSegments(text, options)) {
    const starts = [...segmentText.matchAll(HEREDOC_START)].map((match) => match.index);
    const own = heredocs.slice(used, used + starts.length).map((heredoc, index) => ({ ...heredoc, offset: starts[index] }));
    used += starts.length;
    const { kept, redirections, stdin } = splitRedirections(tokens(segmentText, options), own);
    const stripped = stripPrefixes(kept.map((token) => token.value));
    const commandTokens = kept.slice(stripped.start);
    const list = commandTokens.map((token) => token.value);
    if ((isProgram(list[0], 'cd') || /^(set-location|sl|pushd|chdir)$/i.test(list[0] || '')) && list[1]) {
      directory = resolvePath(directory, list[list.length - 1]);
    }
    segments.push({
      text: segmentText,
      words: list,
      tokens: commandTokens,
      assignments: stripped.assignments,
      cwd: directory,
      redirections,
      heredocs: own,
      stdin,
      previous,
    });
    if (own.length) previous = own[own.length - 1];
  }
  return { segments, heredocs };
}

/**
 * Read a git call from a parsed segment.
 *
 * @param {{words: string[], cwd: string}} segment Parsed simple command.
 * @returns {{subcommand: string, args: string[], argsStart: number, cwd: string, config: string[], segment: object} | null}
 *   The git subcommand and its arguments (from word `argsStart`), the directory it runs in (after
 *   -C), its -c settings and the segment.
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
      if (name === '-C' && value) directory = resolvePath(directory, value);
      if (name === '-c' && value) config.push(value);
    }
    index++;
  }
  if (index >= list.length) return null;
  return { subcommand: list[index], args: list.slice(index + 1), argsStart: index + 1, cwd: directory, config, segment };
}

module.exports = {
  extractHeredocs, splitSegments, tokens, words, parseCommand, gitCall, isProgram, programName, expandHome, resolvePath,
};
