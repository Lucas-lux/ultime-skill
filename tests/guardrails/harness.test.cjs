'use strict';
// Tests of the guardrails hook called by other coding agents (guard.cjs --harness <id>): each case pipes
// the payload shape that harness documents and checks the decision in that harness's protocol.
// Run: node --test tests/guardrails

const assert = require('node:assert/strict');
const { spawnSync, execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const RUNTIME = path.resolve(__dirname, '..', '..', 'authored', 'guardrails', 'runtime');
const GUARD = path.join(RUNTIME, 'guard.cjs');
const { normalize, patchCalls } = require(path.join(RUNTIME, 'lib', 'harness.cjs'));
const EM_DASH = String.fromCodePoint(0x2014);

function repository() {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'guardrails-harness-'));
  const repo = path.join(base, 'repo');
  const home = path.join(base, 'home');
  fs.mkdirSync(repo);
  fs.mkdirSync(home);
  const git = (...args) => execFileSync('git', args, { cwd: repo, stdio: 'ignore' });
  git('init', '-q', '-b', 'main');
  git('config', 'user.email', 'test@example.com');
  git('config', 'user.name', 'Test');
  fs.writeFileSync(path.join(repo, 'README.md'), 'hello\n');
  git('add', '.');
  git('commit', '-q', '-m', 'chore: init');
  return { repo, home };
}

const env = repository();

/** Run the guard for a harness; returns its exit code, stdout and stderr. */
function run(harness, payload) {
  const result = spawnSync('node', [GUARD, '--harness', harness], {
    input: JSON.stringify(payload),
    encoding: 'utf8',
    env: { ...process.env, HOME: env.home, USERPROFILE: env.home, CLAUDE_PROJECT_DIR: '', GUARDRAILS_DISABLED: '', GUARDRAILS_DISABLED_RULES: '' },
  });
  return { code: result.status, stdout: result.stdout, stderr: result.stderr };
}

const pushToMain = 'git push origin main';
const file = (name) => path.join(env.repo, name);

test('exit-code harnesses: a push to main is denied with exit 2 and the reason on stderr', () => {
  const cases = {
    codex: { hook_event_name: 'PreToolUse', cwd: env.repo, tool_name: 'Bash', tool_input: { command: pushToMain } },
    gemini: { hook_event_name: 'BeforeTool', cwd: env.repo, tool_name: 'run_shell_command', tool_input: { command: pushToMain } },
    qwen: { hook_event_name: 'PreToolUse', cwd: env.repo, tool_name: 'run_shell_command', tool_input: { command: pushToMain } },
    copilot: { cwd: env.repo, toolName: 'bash', toolArgs: JSON.stringify({ command: pushToMain }) },
    droid: { hook_event_name: 'PreToolUse', cwd: env.repo, tool_name: 'Execute', tool_input: { command: pushToMain } },
    kiro: { hook_event_name: 'PreToolUse', cwd: env.repo, tool_name: 'execute_bash', tool_input: { command: pushToMain } },
    goose: { event: 'PreToolUse', cwd: env.repo, tool_name: 'shell', tool_input: { command: pushToMain } },
    devin: { hook_event_name: 'PreToolUse', cwd: env.repo, tool_name: 'exec', tool_input: { command: pushToMain } },
    opencode: { hook_event_name: 'PreToolUse', cwd: env.repo, tool_name: 'bash', tool_input: { command: pushToMain } },
  };
  for (const [harness, payload] of Object.entries(cases)) {
    const result = run(harness, payload);
    assert.equal(result.code, 2, harness);
    assert.match(result.stderr, /protected branch main/, harness);
  }
});

test('exit-code harnesses: an allowed call exits 0 and says nothing blocking', () => {
  const result = run('codex', { hook_event_name: 'PreToolUse', cwd: env.repo, tool_name: 'Bash', tool_input: { command: 'git status' } });
  assert.equal(result.code, 0);
  assert.equal(result.stdout, '');
});

test('cursor and antigravity read a JSON decision', () => {
  const cursor = run('cursor', { hook_event_name: 'preToolUse', cwd: env.repo, tool_name: 'Shell', tool_input: { command: pushToMain } });
  assert.equal(cursor.code, 0);
  assert.equal(JSON.parse(cursor.stdout).permission, 'deny');
  const shell = run('cursor', { hook_event_name: 'beforeShellExecution', command: pushToMain, cwd: env.repo });
  assert.equal(JSON.parse(shell.stdout).permission, 'deny');
  const antigravity = run('antigravity', { hookEventName: 'PreToolUse', cwd: env.repo, toolCall: { name: 'run_command', args: { CommandLine: pushToMain } } });
  assert.equal(antigravity.code, 0);
  assert.equal(JSON.parse(antigravity.stdout).decision, 'deny');
});

test('file tools of every harness: an added em dash is denied, plain text is allowed', () => {
  const text = `a ${EM_DASH} b`;
  const cases = [
    ['gemini', { hook_event_name: 'BeforeTool', cwd: env.repo, tool_name: 'write_file', tool_input: { file_path: file('a.md'), content: text } }],
    ['gemini', { hook_event_name: 'BeforeTool', cwd: env.repo, tool_name: 'replace', tool_input: { file_path: file('README.md'), old_string: 'hello', new_string: text } }],
    ['opencode', { hook_event_name: 'PreToolUse', cwd: env.repo, tool_name: 'edit', tool_input: { filePath: file('README.md'), oldString: 'hello', newString: text } }],
    ['copilot', { cwd: env.repo, toolName: 'create', toolArgs: { path: file('b.md'), file_text: text } }],
    ['kiro', { hook_event_name: 'PreToolUse', cwd: env.repo, tool_name: 'fs_write', tool_input: { command: 'str_replace', path: file('README.md'), old_str: 'hello', new_str: text } }],
    ['antigravity', { hookEventName: 'PreToolUse', cwd: env.repo, toolCall: { name: 'write_to_file', args: { TargetFile: file('c.md'), CodeContent: text } } }],
  ];
  for (const [harness, payload] of cases) {
    const result = run(harness, payload);
    const denied = harness === 'antigravity' ? JSON.parse(result.stdout).decision === 'deny' : result.code === 2;
    assert.ok(denied, `${harness} ${payload.tool_name || payload.toolName || payload.toolCall.name}`);
  }
  const plain = run('gemini', { hook_event_name: 'BeforeTool', cwd: env.repo, tool_name: 'write_file', tool_input: { file_path: file('a.md'), content: 'plain' } });
  assert.equal(plain.code, 0);
});

test('codex apply_patch: each file of the patch is checked', () => {
  const patch = ['*** Begin Patch', '*** Add File: notes.md', '+fine line', '*** Update File: README.md', '@@', '-hello', `+hello ${EM_DASH} there`, '*** End Patch'].join('\n');
  assert.deepEqual(patchCalls(patch).map((call) => call.tool), ['Write', 'Edit']);
  const result = run('codex', { hook_event_name: 'PreToolUse', cwd: env.repo, tool_name: 'apply_patch', tool_input: { command: patch } });
  assert.equal(result.code, 2);
  assert.match(result.stderr, /em dash added in README\.md/);
});

test('ask becomes a denial asking for explicit approval where the harness cannot ask', () => {
  const result = run('codex', { hook_event_name: 'PreToolUse', cwd: env.repo, tool_name: 'Bash', tool_input: { command: 'gh pr merge 12' } });
  assert.equal(result.code, 2);
  assert.match(result.stderr, /explicit approval/);
  const cursor = run('cursor', { hook_event_name: 'preToolUse', cwd: env.repo, tool_name: 'Shell', tool_input: { command: 'gh pr merge 12' } });
  assert.equal(JSON.parse(cursor.stdout).permission, 'ask');
});

test('normalize: argv commands, MCP tools and other events', () => {
  assert.deepEqual(normalize({ tool_name: 'shell', tool_input: { command: ['bash', '-lc', 'git push'] } }).calls, [{ tool: 'Bash', input: { command: 'git push' } }]);
  assert.deepEqual(normalize({ tool_name: 'mcp__github__create_issue', tool_input: { title: 'x' } }).calls, []);
  assert.equal(normalize({ hook_event_name: 'SessionStart' }).event, 'SessionStart');
  assert.equal(normalize({ hook_event_name: 'AfterTool', tool_name: 'write_file' }).event, 'other');
  assert.deepEqual(normalize({ tool_name: 'powershell', tool_input: { command: 'git status' } }).calls[0].tool, 'PowerShell');
});

test('an internal error never blocks another harness', () => {
  const result = spawnSync('node', [GUARD, '--harness', 'copilot'], { input: 'not json', encoding: 'utf8' });
  assert.equal(result.status, 0);
});

test('setup.cjs wires every harness in a project, the copy answers, uninstall removes only our entries', () => {
  const project = repository();
  fs.mkdirSync(path.join(project.repo, '.codex'));
  fs.writeFileSync(path.join(project.repo, '.codex', 'hooks.json'), JSON.stringify({ hooks: { Stop: [{ hooks: [{ type: 'command', command: 'echo keep' }] }] } }));
  const setup = (...args) => execFileSync('node', [path.join(RUNTIME, 'setup.cjs'), ...args, '--dir', project.repo], { encoding: 'utf8', env: { ...process.env, HOME: project.home, USERPROFILE: project.home } });
  const output = setup('install-project', '--harness', 'all');
  for (const file of ['.codex/hooks.json', '.gemini/settings.json', '.cursor/hooks.json', '.github/hooks/guardrails.json', '.opencode/plugins/guardrails.js', '.claude/settings.json']) {
    assert.ok(fs.existsSync(path.join(project.repo, file)), file);
  }
  assert.match(output, /wired {6}\.codex\/hooks\.json/);
  const codex = JSON.parse(fs.readFileSync(path.join(project.repo, '.codex', 'hooks.json'), 'utf8'));
  assert.equal(codex.hooks.Stop[0].hooks[0].command, 'echo keep');
  const command = codex.hooks.PreToolUse[0].hooks[0].command;
  assert.match(command, /\.claude\/hooks\/guardrails\/guard\.cjs" --harness codex$/);
  // The project copy, run as the codex hook from the project root, blocks a push to main.
  const copy = path.join(project.repo, '.claude', 'hooks', 'guardrails', 'guard.cjs');
  const result = spawnSync('node', [copy, '--harness', 'codex'], {
    cwd: project.repo,
    input: JSON.stringify({ hook_event_name: 'PreToolUse', cwd: project.repo, tool_name: 'Bash', tool_input: { command: pushToMain } }),
    encoding: 'utf8',
    env: { ...process.env, HOME: project.home, USERPROFILE: project.home, CLAUDE_PROJECT_DIR: '' },
  });
  assert.equal(result.status, 2);
  setup('uninstall-project');
  assert.ok(!fs.existsSync(path.join(project.repo, '.opencode', 'plugins', 'guardrails.js')));
  const after = JSON.parse(fs.readFileSync(path.join(project.repo, '.codex', 'hooks.json'), 'utf8'));
  assert.deepEqual(Object.keys(after.hooks), ['Stop']);
});
