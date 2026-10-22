'use strict';
// Entry point of the guardrails hooks (PreToolUse, SessionStart, SubagentStart).
// Reads the hook payload on stdin and answers with the JSON documented for that event.
// Runs from the plugin (${CLAUDE_PLUGIN_ROOT}/runtime) or from a project copy (.claude/hooks/guardrails).
// Other coding agents call it with --harness <id>: see lib/harness.cjs. Without it, Claude Code's protocol.

const fs = require('node:fs');
const path = require('node:path');

const git = require('./lib/git.cjs');
const { loadConfig } = require('./lib/config.cjs');
const { analyzeCommand } = require('./lib/command-texts.cjs');
const { RULES } = require('./rules.cjs');
const harness = require('./lib/harness.cjs');
const { TARGETS } = require('./lib/wiring.cjs');

const SHELL_TOOLS = new Set(['Bash', 'PowerShell']);
const FILE_TOOLS = new Set(['Write', 'Edit', 'MultiEdit', 'NotebookEdit']);
// Larger files are compared as empty: a full rewrite of a huge file is rare and reading it is slow.
const MAX_COMPARED_FILE_BYTES = 5 * 1024 * 1024;
const PROJECT_COPY = path.join('.claude', 'hooks', 'guardrails', 'guard.cjs');
const LEVEL_ORDER = { block: 3, ask: 2, warn: 1 };

/**
 * Find the project root: CLAUDE_PROJECT_DIR, else the git root of the working directory.
 *
 * @param {string} cwd Working directory of the hook call.
 * @returns {string | null} Absolute root, or null outside a project.
 */
function projectRoot(cwd) {
  return process.env.CLAUDE_PROJECT_DIR || git.root(cwd) || null;
}

/**
 * Tell whether this process is the plugin copy while the project ships its own copy, which then
 * answers alone (the project copy may be newer and is the one cloud sessions run).
 *
 * @param {string | null} root Project root.
 * @returns {boolean} True when this copy must stay silent.
 */
function shadowedByProject(root) {
  if (!root) return false;
  const projectCopy = path.resolve(root, PROJECT_COPY);
  if (path.resolve(__filename) === projectCopy || !fs.existsSync(projectCopy)) return false;
  const id = harnessArgument();
  if (id === 'claude') return true;
  // Another harness only defers to the project copy when the project wires that copy for it.
  const wiring = TARGETS[id] && TARGETS[id].project;
  try {
    return Boolean(wiring) && fs.readFileSync(path.join(root, wiring), 'utf8').includes('hooks/guardrails/guard.cjs');
  } catch {
    return false;
  }
}

/** Harness named by --harness, or "claude" when the hook runs without it (Claude Code's own wiring). */
function harnessArgument() {
  const index = process.argv.indexOf('--harness');
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1].toLowerCase() : 'claude';
}

/**
 * Text before and after a file tool call, for rules that only block what the call adds.
 *
 * @param {string} tool Tool name.
 * @param {object} input Tool input.
 * @param {string | null} root Project root.
 * @param {string} cwd Working directory.
 * @returns {{path: string, rel: string, before: string, after: string} | null}
 */
function fileChange(tool, input, root, cwd) {
  const target = input.file_path || input.notebook_path;
  if (!target) return null;
  const absolute = path.resolve(cwd, target);
  const rel = (root ? path.relative(root, absolute) : absolute).replace(/\\/g, '/');
  let before = '';
  let after = '';
  if (tool === 'Write') {
    after = input.content || '';
    try {
      if (fs.statSync(absolute).size <= MAX_COMPARED_FILE_BYTES) before = fs.readFileSync(absolute, 'utf8');
    } catch {
      before = '';
    }
  } else if (tool === 'Edit') {
    before = input.old_string || '';
    after = input.new_string || '';
  } else if (tool === 'MultiEdit') {
    before = (input.edits || []).map((edit) => edit.old_string || '').join('\n');
    after = (input.edits || []).map((edit) => edit.new_string || '').join('\n');
  } else if (tool === 'NotebookEdit') {
    after = input.new_source || '';
  }
  return { path: absolute, rel, before, after };
}

/**
 * Evaluate every active rule on a tool call.
 *
 * @param {object} payload Hook input.
 * @returns {{level: string, id: string, findings: string[], advice: string}[]} Rules with findings.
 */
function evaluate(payload) {
  const cwd = payload.cwd || process.cwd();
  const root = projectRoot(cwd);
  if (shadowedByProject(root)) return { results: [], problems: [] };
  const { config, problems } = loadConfig(root);
  if (!config.enabled) return { results: [], problems };
  const tool = payload.tool_name;
  const input = payload.tool_input || {};
  let stagedCache = null;
  const ctx = {
    event: 'pre',
    tool,
    input,
    cwd,
    root,
    config,
    shell: SHELL_TOOLS.has(tool) ? analyzeCommand(input.command || '', cwd, { powershell: tool === 'PowerShell' }) : null,
    file: FILE_TOOLS.has(tool) ? fileChange(tool, input, root, cwd) : null,
    staged() {
      if (!stagedCache) {
        const commit = this.shell && this.shell.commits[0];
        const directory = commit ? commit.call.cwd : cwd;
        const files = new Set(git.stagedFiles(directory));
        const added = git.stagedAddedLines(directory);
        // `git add -A && git commit` or `git commit -a`: what is about to be staged counts too.
        for (const pending of (this.shell && this.shell.staging) || []) {
          const changes = git.pendingChanges(pending.cwd, pending.pathspecs, pending.untracked);
          for (const file of changes.files) files.add(file);
          added.push(...changes.added);
        }
        stagedCache = { files: [...files], added };
      }
      return stagedCache;
    },
  };
  const results = [];
  for (const [id, rule] of Object.entries(RULES)) {
    const level = (config.rules[id] || {}).level || 'block';
    if (level === 'off') continue;
    let findings;
    try {
      findings = rule.check(ctx);
    } catch (error) {
      problems.push(`rule ${id} failed (${error.message}): skipped for this call`);
      continue;
    }
    if (findings.length) results.push({ level, id, findings, advice: rule.advice });
  }
  return { results, problems };
}

/**
 * Format the findings of one level for Claude.
 *
 * @param {{id: string, findings: string[], advice: string}[]} results Rules of that level.
 * @param {string} heading First line.
 * @returns {string} Message.
 */
function describe(results, heading) {
  const lines = [heading];
  for (const { id, findings, advice } of results) {
    for (const finding of findings) lines.push(`- [${id}] ${finding}`);
    if (advice) lines.push(`  ${advice}`);
  }
  return lines.join('\n');
}

/**
 * Short reminder of the active rules, injected at session and subagent start.
 *
 * @param {object} payload Hook input.
 * @returns {string | null} Context text, or null when disabled.
 */
function reminder(payload) {
  const cwd = payload.cwd || process.cwd();
  const root = projectRoot(cwd);
  if (shadowedByProject(root)) return null;
  const { config } = loadConfig(root);
  if (!config.enabled) return null;
  const rules = config.rules;
  const on = (id) => rules[id] && rules[id].level !== 'off';
  const items = [];
  if (on('em-dash')) items.push('no em dash');
  if (on('emoji')) items.push(`no emoji unless asked (allowed: ${(rules.emoji.allow || []).join(' ') || 'none'})`);
  if (on('protected-push')) items.push(`no push to ${(rules['protected-push'].branches || []).join(', ')}: branch and PR`);
  if (on('no-verify')) items.push('never bypass the git hooks');
  if (on('secrets') || on('env-file')) items.push('no secret in the code or in git, they stay in the .env');
  if (on('conventional-commit')) items.push('commits in the Conventional Commits format, 72 characters at most');
  if (on('ai-marker')) items.push(`PR and issue titles written by the AI end with ${rules['ai-marker'].marker}`);
  if (on('merge-approval')) items.push('merge and approval: confirmed by the user');
  if (on('prod-credentials')) items.push('production credentials: only the ones configured for the project, never from elsewhere');
  if (!items.length) return null;
  return `Active guardrails (guardrails hooks, they block): ${items.join('; ')}. If a rule gets in the way, tell the user: only they change it (.claude/guardrails.json).`;
}

/**
 * Answer a hook call from another harness: translate its tool call, evaluate each equivalent Claude Code
 * call, and reply in that harness's protocol.
 *
 * @param {object} payload Parsed stdin.
 * @param {string} id Harness id.
 * @returns {number} Exit code.
 */
function foreignMain(payload, id) {
  const { event, cwd, calls } = harness.normalize(payload);
  if (event !== 'PreToolUse') return 0;
  const results = [];
  const problems = new Set();
  for (const call of calls) {
    const outcome = evaluate({ hook_event_name: 'PreToolUse', cwd, tool_name: call.tool, tool_input: call.input });
    results.push(...outcome.results);
    for (const problem of outcome.problems) problems.add(problem);
  }
  const top = results.reduce((max, result) => Math.max(max, LEVEL_ORDER[result.level] || 0), 0);
  const notes = [];
  if (results.some((r) => r.level === 'warn')) notes.push(describe(results.filter((r) => r.level === 'warn'), 'Guardrails warning:'));
  if (problems.size) notes.push(`Guardrails configuration: ${[...problems].join('; ')}`);
  if (top === LEVEL_ORDER.block) return harness.respond(id, 'deny', describe(results.filter((r) => r.level === 'block'), 'Blocked by the guardrails:'));
  if (top === LEVEL_ORDER.ask) return harness.respond(id, 'ask', describe(results.filter((r) => r.level === 'ask'), 'Guardrails: the user must approve.'), notes.join('\n'));
  return harness.respond(id, 'allow', '', notes.join('\n'));
}

function main() {
  if (process.argv.includes('--reminder')) {
    // Text for the instructions file (AGENTS.md...) of harnesses without a session-start hook.
    const index = process.argv.indexOf('--dir');
    const text = reminder({ cwd: index >= 0 ? path.resolve(process.argv[index + 1] || '.') : process.cwd() });
    if (text) process.stdout.write(`${text}\n`);
    return;
  }
  let payload;
  try {
    payload = JSON.parse(fs.readFileSync(0, 'utf8'));
  } catch {
    return;
  }
  const id = harnessArgument();
  if (id !== 'claude') {
    process.exitCode = foreignMain(payload, id);
    return;
  }
  const event = payload.hook_event_name;
  if (event === 'SessionStart' || event === 'SubagentStart') {
    const text = reminder(payload);
    if (text) process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: event, additionalContext: text } }));
    return;
  }
  if (event !== 'PreToolUse') return;

  const { results, problems } = evaluate(payload);
  const top = results.reduce((max, result) => Math.max(max, LEVEL_ORDER[result.level] || 0), 0);
  const output = { hookEventName: 'PreToolUse' };
  if (top === LEVEL_ORDER.block) {
    output.permissionDecision = 'deny';
    output.permissionDecisionReason = describe(results.filter((r) => r.level === 'block'), 'Blocked by the guardrails:');
  } else if (top === LEVEL_ORDER.ask) {
    output.permissionDecision = 'ask';
    output.permissionDecisionReason = describe(results.filter((r) => r.level === 'ask'), 'Guardrails: the user must approve.');
  }
  const notes = results.filter((r) => r.level === 'warn');
  const context = [];
  if (notes.length) context.push(describe(notes, 'Guardrails warning:'));
  if (problems.length) context.push(`Guardrails configuration: ${problems.join('; ')}`);
  if (context.length && top !== LEVEL_ORDER.block) output.additionalContext = context.join('\n');
  if (Object.keys(output).length > 1) process.stdout.write(JSON.stringify({ hookSpecificOutput: output }));
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    // Never block work on an internal error: report it (non-blocking) and let the call through.
    process.stderr.write(`guardrails: internal error (${error.message})\n`);
    // Claude Code treats exit 1 as a non-blocking error; some other harnesses deny on any non-zero code.
    process.exit(harnessArgument() === 'claude' ? 1 : 0);
  }
}

module.exports = { evaluate, reminder };
