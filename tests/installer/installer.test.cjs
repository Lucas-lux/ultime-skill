'use strict';
// End-to-end tests of the universal installer (bin/ultime-skill.cjs) against the built plugins/: each
// case installs into a throwaway home or project and checks the files every harness reads.
// Run: node --test tests/installer

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..', '..');
const CLI = path.join(ROOT, 'bin', 'ultime-skill.cjs');
const BUILT = fs.existsSync(path.join(ROOT, 'plugins', 'guardrails', 'runtime', 'lib', 'wiring.cjs'));
const convert = require(path.join(ROOT, 'bin', 'lib', 'convert.cjs'));

function cli(home, ...args) {
  const result = spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8', env: { ...process.env, ULTIME_SKILL_HOME: home } });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout;
}

const fresh = (name) => fs.mkdtempSync(path.join(os.tmpdir(), `ultime-installer-${name}-`));
const read = (...parts) => fs.readFileSync(path.join(...parts), 'utf8');

test('convert: Claude agent to Codex TOML, OpenCode, Copilot; command to Gemini TOML', () => {
  const source = '---\nname: implementer\ndescription: Builds one story.\ndisallowedTools: Agent\nmodel: sonnet\n---\n\nBody with C:\\path.\n';
  const codex = convert.agent('app-factory', source, 'codex');
  assert.equal(codex.file, 'app-factory-implementer.toml');
  assert.match(codex.content, /^name = "app-factory-implementer"$/m);
  assert.match(codex.content, /model_reasoning_effort = "medium"/);
  assert.match(codex.content, /developer_instructions = '''\nBody with C:\\path\.\n'''/);
  assert.match(convert.agent('app-factory', source, 'opencode').content, /^mode: subagent$/m);
  assert.equal(convert.agent('app-factory', source, 'copilot').file, 'app-factory-implementer.agent.md');
  assert.match(convert.agent('app-factory', source, 'claude-like').content, /^disallowedTools: Agent$/m);
  const gemini = convert.command('agent-skills', 'plan', '---\ndescription: Plan it\n---\nTarget: $ARGUMENTS\n', 'gemini');
  assert.equal(gemini.file, 'agent-skills/plan.toml');
  assert.match(gemini.content, /Target: \{\{args\}\}/);
});

test('user scope: skills once in the shared folder, agents and hooks per harness, clean uninstall', { skip: !BUILT && 'needs a built plugins/' }, () => {
  const home = fresh('user');
  cli(home, 'install', 'agent-skills', 'superpowers', 'app-factory', '--agent', 'codex,gemini,opencode');
  const skills = path.join(home, '.agents', 'skills');
  assert.ok(fs.existsSync(path.join(skills, 'test-driven-development', 'SKILL.md')));
  // The second pack shipping the same skill name gets a prefix, and its frontmatter name follows.
  assert.match(read(skills, 'agent-skills-test-driven-development', 'SKILL.md'), /^name: agent-skills-test-driven-development$/m);
  assert.ok(fs.existsSync(path.join(skills, 'app-factory', 'roles', 'implementer.md')));
  assert.ok(fs.existsSync(path.join(home, '.codex', 'agents', 'app-factory-implementer.toml')));
  assert.ok(fs.existsSync(path.join(home, '.gemini', 'commands', 'agent-skills', 'plan.toml')));
  assert.ok(fs.existsSync(path.join(home, '.config', 'opencode', 'agents', 'app-factory-implementer.md')));
  assert.match(read(home, '.codex', 'hooks.json'), /guardrails\/runtime\/guard\.cjs\\" --harness codex/);
  assert.match(read(home, '.codex', 'AGENTS.md'), /ultime-skill:begin[\s\S]*Active guardrails[\s\S]*PONYTAIL|ultime-skill:begin[\s\S]*Active guardrails/);

  // The installed hook blocks a push to main for Codex.
  const guard = path.join(home, '.ultime-skill', 'guardrails', 'runtime', 'guard.cjs');
  const blocked = spawnSync(process.execPath, [guard, '--harness', 'codex'], {
    input: JSON.stringify({ hook_event_name: 'PreToolUse', cwd: home, tool_name: 'Bash', tool_input: { command: 'git push origin main' } }),
    encoding: 'utf8',
    env: { ...process.env, HOME: home, USERPROFILE: home },
  });
  assert.equal(blocked.status, 2);

  // A user's own content next to ours survives the uninstall.
  fs.appendFileSync(path.join(home, '.codex', 'AGENTS.md'), '\nMy own rule.\n');
  cli(home, 'uninstall', '--agent', 'codex,gemini,opencode');
  assert.ok(!fs.existsSync(path.join(skills, 'test-driven-development')));
  assert.ok(!fs.existsSync(path.join(home, '.codex', 'hooks.json')));
  assert.ok(!fs.existsSync(path.join(home, '.ultime-skill', 'guardrails')));
  const rest = read(home, '.codex', 'AGENTS.md');
  assert.doesNotMatch(rest, /ultime-skill:begin/);
  assert.match(rest, /My own rule\./);
});

test('project scope: project copy of the guardrails wired for the harness, instructions in AGENTS.md', { skip: !BUILT && 'needs a built plugins/' }, () => {
  const project = fresh('project');
  spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: project });
  cli(fresh('home'), 'install', '--agent', 'codex,cursor', '--scope', 'project', '--dir', project);
  assert.ok(fs.existsSync(path.join(project, '.agents', 'skills', 'ultime-profile', 'SKILL.md')));
  assert.ok(fs.existsSync(path.join(project, '.claude', 'hooks', 'guardrails', 'guard.cjs')));
  assert.match(read(project, '.codex', 'hooks.json'), /\.claude\/hooks\/guardrails\/guard\.cjs\\" --harness codex/);
  assert.match(read(project, '.cursor', 'hooks.json'), /--harness cursor/);
  assert.match(read(project, 'AGENTS.md'), /ultime-skill:begin/);
  assert.match(read(project, '.cursor', 'rules', 'ultime-skill.mdc'), /^alwaysApply: true$/m);
  // Claude Code's own settings are not written when Claude Code is not a target.
  assert.ok(!fs.existsSync(path.join(project, '.claude', 'settings.json')));
});

test('bundles expand to their packs, sec-offense only when named', { skip: !BUILT && 'needs a built plugins/' }, () => {
  const { expand, catalog } = require(CLI);
  const packs = catalog();
  const all = expand(['ultime-all'], packs);
  assert.ok(all.includes('app-factory') && !all.includes('sec-offense') && !all.includes('ultime-all'));
  assert.ok(expand(['sec-offense'], packs).includes('sec-offense'));
});
