'use strict';
// End-to-end tests of the guardrails hook: each case pipes a real hook payload into guard.cjs, run
// as a separate process against a throwaway git repository, and checks the decision.
// Run: node --test tests/guardrails

const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const GUARD = path.resolve(__dirname, '..', '..', 'authored', 'guardrails', 'runtime', 'guard.cjs');
// Built from code points or pieces so this file never holds a literal forbidden character or secret.
const EM_DASH = String.fromCodePoint(0x2014);
const CHECK_EMOJI = String.fromCodePoint(0x2705);
const SPARKLES = String.fromCodePoint(0x2728);
const AWS_KEY = ['AKIA', 'Z7QW3RTY8UIOP5LK'].join('');
const GITHUB_TOKEN = ['ghp', '_', 'a1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6q7R8'].join('');

function sh(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
}

/** Fresh repository on branch main with one commit, and an isolated home directory. */
function setup() {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'guardrails-test-'));
  const repo = path.join(base, 'repo');
  const home = path.join(base, 'home');
  fs.mkdirSync(repo);
  fs.mkdirSync(home);
  sh(repo, 'init', '-q', '-b', 'main');
  sh(repo, 'config', 'user.email', 'test@example.com');
  sh(repo, 'config', 'user.name', 'Test');
  fs.writeFileSync(path.join(repo, 'README.md'), 'hello\n');
  sh(repo, 'add', '.');
  sh(repo, 'commit', '-q', '-m', 'chore: init');
  return { base, repo, home };
}

/** Run the hook and return its parsed hookSpecificOutput (empty object when it says nothing). */
function hook(env, payload) {
  const output = execFileSync('node', [GUARD], {
    input: JSON.stringify({ hook_event_name: 'PreToolUse', cwd: env.repo, ...payload }),
    encoding: 'utf8',
    env: { ...process.env, HOME: env.home, USERPROFILE: env.home, CLAUDE_PROJECT_DIR: '', GUARDRAILS_DISABLED: '', GUARDRAILS_DISABLED_RULES: '' },
  });
  return output ? JSON.parse(output).hookSpecificOutput : {};
}

const bash = (command) => ({ tool_name: 'Bash', tool_input: { command } });
const write = (file, content) => ({ tool_name: 'Write', tool_input: { file_path: file, content } });
const edit = (file, oldString, newString) => ({ tool_name: 'Edit', tool_input: { file_path: file, old_string: oldString, new_string: newString } });

function decision(env, payload) {
  return hook(env, payload).permissionDecision || 'allow';
}

test('em dash: blocked when added to a file or a written text, allowed when reading', () => {
  const env = setup();
  assert.equal(decision(env, write(path.join(env.repo, 'a.md'), `a ${EM_DASH} b`)), 'deny');
  assert.equal(decision(env, edit(path.join(env.repo, 'a.md'), `old ${EM_DASH} x`, `new ${EM_DASH} x`)), 'allow');
  assert.equal(decision(env, bash(`echo "a ${EM_DASH} b" > notes.txt`)), 'deny');
  assert.equal(decision(env, bash(`grep -rn "${EM_DASH}" .`)), 'allow');
});

test('em dash: staged lines are checked at commit time', () => {
  const env = setup();
  fs.writeFileSync(path.join(env.repo, 'doc.md'), `x ${EM_DASH} y\n`);
  sh(env.repo, 'add', 'doc.md');
  assert.equal(decision(env, bash('git commit -m "docs: add doc"')), 'deny');
});

test('emoji: blocked unless allowed by the list or the configuration', () => {
  const env = setup();
  assert.equal(decision(env, write(path.join(env.repo, 'a.ts'), `// done ${CHECK_EMOJI}`)), 'deny');
  assert.equal(decision(env, write(path.join(env.repo, 'a.ts'), `// marker ${SPARKLES}`)), 'allow');
  assert.equal(decision(env, write(path.join(env.repo, 'a.ts'), '// (c) arrows <-> and copyright ©')), 'allow');
  fs.mkdirSync(path.join(env.repo, '.claude'));
  fs.writeFileSync(path.join(env.repo, '.claude', 'guardrails.json'), JSON.stringify({ rules: { emoji: { allow_paths: ['docs/**'] } } }));
  assert.equal(decision(env, write(path.join(env.repo, 'docs', 'fun.md'), `party ${CHECK_EMOJI}`)), 'allow');
});

test('protected push: refspec, current branch, HEAD and deletion', () => {
  const env = setup();
  assert.equal(decision(env, bash('git push origin main')), 'deny');
  assert.equal(decision(env, bash('git push')), 'deny');
  assert.equal(decision(env, bash('git push origin HEAD')), 'deny');
  assert.equal(decision(env, bash('git push origin feat/x:main')), 'deny');
  assert.equal(decision(env, bash('git push origin --delete master')), 'deny');
  assert.equal(decision(env, bash('git push --dry-run origin main')), 'allow');
  assert.equal(decision(env, bash('git push -u origin feat/x')), 'allow');
  assert.equal(decision(env, bash('git push --force origin +feat/x')), 'allow');
  sh(env.repo, 'checkout', '-q', '-b', 'feat/y');
  assert.equal(decision(env, bash('git push')), 'allow');
  assert.equal(decision(env, bash(`cd "${env.repo}" && git checkout main && git push`)), 'deny');
  assert.equal(decision(env, bash('git switch -c feat/z && git push -u origin HEAD')), 'allow');
  assert.equal(decision(env, { tool_name: 'PowerShell', tool_input: { command: 'git push origin main' } }), 'deny');
});

test('no-verify and hook skipping variables', () => {
  const env = setup();
  assert.equal(decision(env, bash('git commit --no-verify -m "feat: x"')), 'deny');
  assert.equal(decision(env, bash('git commit -n -m "feat: x"')), 'deny');
  assert.equal(decision(env, bash('HUSKY=0 git commit -m "feat: x"')), 'deny');
  assert.equal(decision(env, bash('git -c core.hooksPath=/dev/null commit -m "feat: x"')), 'deny');
  assert.equal(decision(env, bash('git commit -am "feat: x"')), 'allow');
});

test('conventional commits, including heredoc messages', () => {
  const env = setup();
  assert.equal(decision(env, bash('git commit -m "Update stuff"')), 'deny');
  assert.equal(decision(env, bash('git commit -m "feat: Add stuff"')), 'deny');
  assert.equal(decision(env, bash(`git commit -m "feat: ${'x'.repeat(80)}"`)), 'deny');
  assert.equal(decision(env, bash("git commit -q -F - <<'EOF'\nfeat(core): add the thing\n\nBody.\nEOF")), 'allow');
  assert.equal(decision(env, bash("git commit -m \"$(cat <<'EOF'\nfix: repair it\nEOF\n)\"")), 'allow');
  assert.equal(decision(env, bash("git commit -m \"$(cat <<'EOF'\nRepair it\nEOF\n)\"")), 'deny');
  assert.equal(decision(env, bash('git commit --amend --no-edit')), 'allow');
});

test('secrets in files, commands and staged lines; .env files are exempt from content checks', () => {
  const env = setup();
  assert.equal(decision(env, write(path.join(env.repo, 'config.ts'), `const key = "${AWS_KEY}";`)), 'deny');
  assert.equal(decision(env, write(path.join(env.repo, '.env'), `AWS_KEY=${AWS_KEY}`)), 'allow');
  assert.equal(decision(env, write(path.join(env.repo, 'config.ts'), 'const key = "AKIAIOSFODNN7EXAMPLE";')), 'allow');
  assert.equal(decision(env, bash(`curl -H "Authorization: token ${GITHUB_TOKEN}" https://api.github.com`)), 'deny');
  fs.writeFileSync(path.join(env.repo, 'leak.py'), `TOKEN = "${GITHUB_TOKEN}"\n`);
  sh(env.repo, 'add', 'leak.py');
  assert.equal(decision(env, bash('git commit -m "feat: add leak"')), 'deny');
});

test('env files never enter git', () => {
  const env = setup();
  assert.equal(decision(env, bash('git add .env')), 'deny');
  assert.equal(decision(env, bash('git add .env.example')), 'allow');
  fs.writeFileSync(path.join(env.repo, '.env.local'), 'A=1\n');
  sh(env.repo, 'add', '-f', '.env.local');
  assert.equal(decision(env, bash('git commit -m "chore: add env"')), 'deny');
});

test('AI marker on PR and issue titles, gh and REST', () => {
  const env = setup();
  assert.equal(decision(env, bash('gh pr create --title "Ajoute x" --body "y"')), 'deny');
  assert.equal(decision(env, bash(`gh pr create --title "Ajoute x ${SPARKLES}" --body "y"`)), 'allow');
  assert.equal(decision(env, bash('gh api repos/o/r/issues -f title="Question" -f body="b"')), 'deny');
  assert.equal(decision(env, bash('gh api repos/o/r/issues/3/comments -f body="ok"')), 'allow');
});

test('prod credentials: stores, history, other projects and tunnels', () => {
  const env = setup();
  assert.equal(decision(env, bash('kubectl get secret db -o yaml')), 'deny');
  assert.equal(decision(env, bash('kubectl get secrets')), 'allow');
  assert.equal(decision(env, bash('cat ~/.bash_history')), 'deny');
  assert.equal(decision(env, bash('cat ../other-project/.env')), 'deny');
  assert.equal(decision(env, bash('cat .env')), 'allow');
  assert.equal(decision(env, bash('ssh -N -L 3306:db:3306 admin@prod-db.internal')), 'deny');
  assert.equal(decision(env, { tool_name: 'Read', tool_input: { file_path: path.join(env.base, 'other', '.env') } }), 'deny');
});

test('guardrails configuration changes need the user', () => {
  const env = setup();
  assert.equal(decision(env, edit(path.join(env.repo, '.claude', 'guardrails.json'), 'a', 'b')), 'ask');
  assert.equal(decision(env, bash('echo {} > .claude/guardrails.json')), 'ask');
  assert.equal(decision(env, bash("node -e \"require('fs').writeFileSync('.claude/guardrails.json','{}')\"")), 'ask');
  assert.equal(decision(env, bash('cat .claude/guardrails.json')), 'allow');
});

test('lint configuration and suppressions only warn', () => {
  const env = setup();
  const result = hook(env, edit(path.join(env.repo, 'src', 'a.ts'), 'f();', '// eslint-disable-next-line\nf();'));
  assert.equal(result.permissionDecision, undefined);
  assert.match(result.additionalContext, /lint-config/);
});

test('configuration: a rule can be turned off, the whole guard disabled', () => {
  const env = setup();
  fs.mkdirSync(path.join(env.repo, '.claude'));
  fs.writeFileSync(path.join(env.repo, '.claude', 'guardrails.json'), JSON.stringify({ rules: { 'protected-push': 'off' } }));
  assert.equal(decision(env, bash('git push origin main')), 'allow');
  fs.writeFileSync(path.join(env.repo, '.claude', 'guardrails.json'), JSON.stringify({ enabled: false }));
  assert.equal(decision(env, write(path.join(env.repo, 'a.md'), `a ${EM_DASH} b`)), 'allow');
});

test('the plugin copy stays silent when the project ships its own copy', () => {
  const env = setup();
  const copy = path.join(env.repo, '.claude', 'hooks', 'guardrails');
  fs.mkdirSync(copy, { recursive: true });
  fs.writeFileSync(path.join(copy, 'guard.cjs'), '');
  assert.equal(decision(env, bash('git push origin main')), 'allow');
});

test('project install is idempotent, keeps other hooks and uninstalls cleanly', () => {
  const env = setup();
  const setupScript = path.join(path.dirname(GUARD), 'setup.cjs');
  const settingsFile = path.join(env.repo, '.claude', 'settings.json');
  fs.mkdirSync(path.dirname(settingsFile), { recursive: true });
  const other = { matcher: 'Bash', hooks: [{ type: 'command', command: 'echo other' }] };
  fs.writeFileSync(settingsFile, JSON.stringify({ permissions: { allow: ['Bash(ls)'] }, hooks: { PreToolUse: [other] } }));
  const run = (script, action) => execFileSync('node', [script, action, '--dir', env.repo], { encoding: 'utf8' });
  run(setupScript, 'install-project');
  run(path.join(env.repo, '.claude', 'hooks', 'guardrails', 'setup.cjs'), 'install-project');
  let settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
  const ours = (s) => Object.values(s.hooks || {}).flat().flatMap((g) => g.hooks).filter((h) => h.command.includes('guardrails')).length;
  assert.equal(ours(settings), 3);
  assert.deepEqual(settings.hooks.PreToolUse[0], other);
  assert.ok(fs.existsSync(path.join(env.repo, '.claude', 'hooks', 'guardrails', 'guard.cjs')));
  run(setupScript, 'uninstall-project');
  settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
  assert.equal(ours(settings), 0);
  assert.deepEqual(settings.hooks.PreToolUse, [other]);
  assert.deepEqual(settings.permissions, { allow: ['Bash(ls)'] });
});

test('session start reminder lists the active rules', () => {
  const env = setup();
  const output = execFileSync('node', [GUARD], {
    input: JSON.stringify({ hook_event_name: 'SessionStart', cwd: env.repo }),
    encoding: 'utf8',
    env: { ...process.env, HOME: env.home, USERPROFILE: env.home, CLAUDE_PROJECT_DIR: '' },
  });
  const context = JSON.parse(output).hookSpecificOutput.additionalContext;
  assert.match(context, /em dash/);
  assert.match(context, /main, master/);
});
