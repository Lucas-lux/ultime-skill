'use strict';
// Adapters for coding agents other than Claude Code. The rules only know Claude Code's tool calls
// (Bash, PowerShell, Write, Edit, MultiEdit, NotebookEdit, Read): each foreign call is translated into
// one or more of those, and the decision is written back in the protocol of the calling harness.
// Claude Code itself never goes through this module (guard.cjs runs without --harness for it).

const SHELL = new Set([
  'bash', 'shell', 'exec', 'execute', 'run_shell_command', 'run_command', 'execute_command', 'execute_bash',
  'local_shell', 'terminal', 'run_terminal_cmd', 'run_in_terminal', 'powershell', 'beforeshellexecution', 'pre_run_command',
]);
const WRITE = new Set(['write', 'write_file', 'create', 'create_file', 'write_to_file', 'fs_write']);
const EDIT = new Set([
  'edit', 'multiedit', 'replace', 'str_replace', 'str_replace_editor', 'str_replace_based_edit_tool', 'edit_file',
  'replace_file_content', 'multi_replace_file_content', 'search_replace', 'pre_write_code',
]);
const PATCH = new Set(['apply_patch', 'applypatch', 'patch']);
const READ = new Set(['read', 'read_file', 'view_file', 'view']);
const PRE_EVENTS = new Set(['pretooluse', 'beforetool', 'beforeshellexecution', 'pre_run_command', 'pre_write_code', 'preinvocation', 'tool.execute.before']);
const START_EVENTS = new Set(['sessionstart', 'session_start']);
const SUBAGENT_EVENTS = new Set(['subagentstart', 'subagent_start']);

/** Harnesses whose pre-tool hook can ask the user instead of only allowing or denying. */
const CAN_ASK = new Set(['cursor']);
const HARNESSES = ['codex', 'gemini', 'qwen', 'cursor', 'copilot', 'droid', 'junie', 'kiro', 'goose', 'devin', 'antigravity', 'opencode', 'kilo', 'amp', 'cline'];

/** First defined string among several candidate fields. */
function pick(object, ...keys) {
  for (const key of keys) {
    const value = object && object[key];
    if (typeof value === 'string') return value;
  }
  return undefined;
}

/** Tool arguments, wherever the harness puts them (some send them as a JSON string). */
function toolArgs(payload) {
  let args = payload.tool_input ?? payload.toolInput ?? payload.toolArgs ?? payload.args ?? (payload.toolCall && payload.toolCall.args)
    ?? payload.tool_info ?? payload;
  if (typeof args === 'string') {
    try {
      args = JSON.parse(args);
    } catch {
      args = { input: args };
    }
  }
  return args && typeof args === 'object' ? args : {};
}

/** Shell command text: a string, or an argv array such as ["bash", "-lc", "git push"]. */
function commandText(args) {
  const raw = args.command ?? args.cmd ?? args.CommandLine ?? args.commandLine ?? args.command_line;
  if (Array.isArray(raw)) {
    const flag = raw.findIndex((part) => /^-\w*c$/.test(part) || /^-(Command|c)$/i.test(part));
    return flag >= 0 && raw[flag + 1] !== undefined ? String(raw[flag + 1]) : raw.join(' ');
  }
  return typeof raw === 'string' ? raw : '';
}

function filePath(args) {
  return pick(args, 'file_path', 'filePath', 'path', 'target_file', 'targetFile', 'TargetFile', 'file', 'AbsolutePath');
}

/**
 * Split an apply_patch envelope (Codex format) or a unified diff into per-file changes.
 *
 * @param {string} text Patch text.
 * @returns {{tool: string, input: object}[]} Equivalent Write (added file) and Edit (updated file) calls.
 */
function patchCalls(text) {
  const calls = [];
  let current = null;
  const flush = () => {
    if (!current) return;
    if (current.kind === 'add') calls.push({ tool: 'Write', input: { file_path: current.path, content: current.after.join('\n') } });
    else if (current.kind === 'update') calls.push({ tool: 'Edit', input: { file_path: current.path, old_string: current.before.join('\n'), new_string: current.after.join('\n') } });
    current = null;
  };
  for (const line of String(text).split(/\r?\n/)) {
    const header = line.match(/^\*\*\* (Add|Update|Delete) File: (.+)$/) || line.match(/^\+\+\+ (?:b\/)?(.+)$/);
    if (header) {
      flush();
      if (header.length === 3) current = { kind: header[1].toLowerCase(), path: header[2].trim(), before: [], after: [] };
      else if (header[1].trim() !== '/dev/null') current = { kind: 'update', path: header[1].trim(), before: [], after: [] };
      continue;
    }
    if (!current || /^(\*\*\* |--- |diff --git |index |@@)/.test(line)) continue;
    if (line.startsWith('+')) current.after.push(line.slice(1));
    else if (line.startsWith('-')) current.before.push(line.slice(1));
    else if (line.startsWith(' ')) {
      current.before.push(line.slice(1));
      current.after.push(line.slice(1));
    }
  }
  flush();
  return calls;
}

/**
 * Translate one foreign tool call into Claude Code tool calls the rules understand.
 *
 * @param {string} name Tool name as the harness reports it.
 * @param {object} args Tool arguments.
 * @returns {{tool: string, input: object}[]} Zero or more equivalent calls.
 */
function toClaudeCalls(name, args) {
  const key = String(name || '').toLowerCase();
  if (key.startsWith('mcp')) return [];
  if (SHELL.has(key)) {
    const command = commandText(args);
    return command ? [{ tool: key.includes('powershell') ? 'PowerShell' : 'Bash', input: { command } }] : [];
  }
  const patchText = pick(args, 'input', 'patch', 'patchText', 'diff') || (/^\*\*\* Begin Patch/.test(args.command || '') ? args.command : undefined);
  if (PATCH.has(key) || (key === 'edit' && patchText && /^\*\*\* Begin Patch/m.test(patchText))) return patchCalls(patchText || '');
  const file = filePath(args);
  if (READ.has(key)) return file ? [{ tool: 'Read', input: { file_path: file } }] : [];
  if (!file) return [];
  const content = pick(args, 'content', 'contents', 'file_text', 'CodeContent', 'text', 'new_source');
  // Kiro's fs_write and the str_replace editors pick create or replace through a `command` argument.
  const sub = String(args.command || '').toLowerCase();
  if ((WRITE.has(key) && sub !== 'str_replace') || (EDIT.has(key) && sub === 'create')) {
    return [{ tool: 'Write', input: { file_path: file, content: content || '' } }];
  }
  if (EDIT.has(key) || WRITE.has(key)) {
    const chunks = args.edits || args.ReplacementChunks || args.replacements || args.chunks;
    if (Array.isArray(chunks)) {
      return [{ tool: 'MultiEdit', input: { file_path: file, edits: chunks.map((chunk) => ({
        old_string: pick(chunk, 'old_string', 'oldString', 'old_str', 'TargetContent', 'oldText') || '',
        new_string: pick(chunk, 'new_string', 'newString', 'new_str', 'ReplacementContent', 'newText') || '',
      })) } }];
    }
    const before = pick(args, 'old_string', 'oldString', 'old_str', 'TargetContent', 'oldText');
    const after = pick(args, 'new_string', 'newString', 'new_str', 'ReplacementContent', 'newText', 'CodeEdit', 'code_edit');
    if (after === undefined && content !== undefined) return [{ tool: 'Write', input: { file_path: file, content } }];
    return [{ tool: 'Edit', input: { file_path: file, old_string: before || '', new_string: after || '' } }];
  }
  return [];
}

/**
 * Read a foreign hook payload.
 *
 * @param {object} payload Parsed stdin.
 * @returns {{event: string, cwd: string, calls: {tool: string, input: object}[]}} Normalized call.
 */
function normalize(payload) {
  const rawEvent = String(payload.hook_event_name ?? payload.hookEventName ?? payload.event ?? payload.agent_action_name ?? '').toLowerCase();
  const cwd = payload.cwd || (Array.isArray(payload.workspace_roots) && payload.workspace_roots[0]) || process.cwd();
  let event = 'PreToolUse';
  if (START_EVENTS.has(rawEvent)) event = 'SessionStart';
  else if (SUBAGENT_EVENTS.has(rawEvent)) event = 'SubagentStart';
  else if (rawEvent && !PRE_EVENTS.has(rawEvent)) event = 'other';
  if (event !== 'PreToolUse') return { event, cwd, calls: [] };
  const args = toolArgs(payload);
  let name = payload.tool_name ?? payload.toolName ?? (payload.toolCall && payload.toolCall.name) ?? payload.tool;
  // Shell- and write-specific events carry no tool name: the event says what the call is.
  if (!name && (rawEvent === 'beforeshellexecution' || rawEvent === 'pre_run_command')) name = 'shell';
  if (!name && rawEvent === 'pre_write_code') name = 'edit';
  if (!name && typeof payload.command === 'string') return { event, cwd, calls: [{ tool: 'Bash', input: { command: payload.command } }] };
  return { event, cwd, calls: toClaudeCalls(name, args) };
}

/**
 * Write a pre-tool decision in the protocol of the harness.
 *
 * Exit code 2 with the reason on stderr denies in Codex, Gemini CLI, Qwen Code, Copilot, Factory Droid,
 * Junie, Kiro, Goose, Devin and the OpenCode, Kilo, Amp and Cline shims. Cursor and Antigravity read a
 * JSON decision instead. Where a harness cannot ask the user, "ask" becomes a denial that tells the
 * agent to get the user's explicit approval first.
 *
 * @param {string} harness Harness id.
 * @param {'allow' | 'ask' | 'deny'} decision Decision.
 * @param {string} reason Text for the agent.
 * @param {string} [note] Non-blocking warning for the agent.
 * @returns {number} Exit code.
 */
function respond(harness, decision, reason, note) {
  let final = decision;
  let text = reason;
  if (final === 'ask' && !CAN_ASK.has(harness)) {
    final = 'deny';
    text = `${reason}\nThis harness cannot ask the user from a hook: ask the user for explicit approval, then let them run it themselves or relax the rule in .claude/guardrails.json.`;
  }
  if (harness === 'cursor') {
    if (final !== 'allow') process.stdout.write(JSON.stringify({ permission: final, user_message: text, agent_message: text }));
    else if (note) process.stdout.write(JSON.stringify({ permission: 'allow', agent_message: note }));
    return 0;
  }
  if (harness === 'antigravity') {
    if (final !== 'allow') process.stdout.write(JSON.stringify({ decision: 'deny', reason: text }));
    return 0;
  }
  if (final === 'deny') {
    process.stderr.write(`${text}\n`);
    return 2;
  }
  if (note) process.stderr.write(`${note}\n`);
  return 0;
}

module.exports = { HARNESSES, normalize, respond, toClaudeCalls, patchCalls };
