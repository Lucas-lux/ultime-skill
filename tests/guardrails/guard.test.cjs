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
const ps = (command) => ({ tool_name: 'PowerShell', tool_input: { command } });
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

test('bypass: redirections are not push refspecs', () => {
  const env = setup();
  assert.equal(decision(env, bash('git push origin 2>&1 | tail -5')), 'deny');
  assert.equal(decision(env, bash('git push -u origin > /dev/null')), 'deny');
  assert.equal(decision(env, bash('git push origin >/dev/null 2>&1')), 'deny');
  assert.equal(decision(env, bash('git push origin feat/x 2>&1')), 'allow');
});

test('bypass: wrappers before git are stripped', () => {
  const env = setup();
  for (const prefix of ['timeout 60', 'timeout -s KILL 5m', 'nice -n 10', 'nice -5', 'stdbuf -oL', 'ionice -c 2', 'nohup', 'time', 'command', 'builtin', 'exec', 'env -i', 'sudo -u me', 'HOME=/x env']) {
    assert.equal(decision(env, bash(`${prefix} git push origin main`)), 'deny', prefix);
  }
  assert.equal(decision(env, bash('command -v git')), 'allow');
});

test('bypass: Git Bash drive paths resolve to the Windows drive', { skip: process.platform !== 'win32' }, () => {
  const env = setup();
  const gitBash = env.repo.replace(/\\/g, '/').replace(/^([A-Za-z]):/, (match, drive) => `/${drive.toLowerCase()}`);
  assert.equal(decision(env, { ...bash(`cd ${gitBash} && git push`), cwd: env.base }), 'deny');
  assert.equal(decision(env, { ...bash(`git -C ${gitBash} push`), cwd: env.base }), 'deny');
});

test('bypass: PowerShell keeps backslashes literal', () => {
  const env = setup();
  assert.equal(decision(env, { ...ps(`cd ${env.repo}; git push`), cwd: env.base }), 'deny');
  assert.equal(decision(env, { ...ps(`git -C ${env.repo} push`), cwd: env.base }), 'deny');
  assert.equal(decision(env, ps('Get-ChildItem "C:\\Temp\\"; git push origin main')), 'deny');
});

test('bypass: git add and commit -a are checked for what they would stage', () => {
  const env = setup();
  fs.writeFileSync(path.join(env.repo, '.env'), 'A=1\n');
  fs.writeFileSync(path.join(env.repo, 'keys.txt'), `KEY=${AWS_KEY}\n`);
  const result = hook(env, bash('git add -A && git commit -m "feat: x"'));
  assert.equal(result.permissionDecision, 'deny');
  assert.match(result.permissionDecisionReason, /env-file/);
  assert.match(result.permissionDecisionReason, /secrets/);
  assert.equal(decision(env, bash('git add keys.txt && git commit -m "feat: x"')), 'deny');
  // Explicit paths restrict the check to them.
  fs.writeFileSync(path.join(env.repo, 'src.ts'), 'export const a = 1;\n');
  assert.equal(decision(env, bash('git add src.ts && git commit -m "feat: x"')), 'allow');
  fs.rmSync(path.join(env.repo, '.env'));
  fs.rmSync(path.join(env.repo, 'keys.txt'));
  fs.writeFileSync(path.join(env.repo, 'README.md'), `x ${EM_DASH} y\n`);
  assert.equal(decision(env, bash('git commit -a -m "docs: x"')), 'deny');
  assert.equal(decision(env, bash('git commit -am "docs: x"')), 'deny');
  assert.equal(decision(env, bash('git add -u && git commit -m "docs: x"')), 'deny');
  assert.equal(decision(env, bash('git commit -m "docs: x"')), 'allow');
});

test('bypass: each heredoc belongs to the command that opens it', () => {
  const env = setup();
  const command = [
    "git commit -m \"$(cat <<'EOF'", 'feat: add x', 'EOF', ')" && gh pr create --title "Ajoute x ' + SPARKLES + '" --body "$(cat <<\'EOF\'',
    `Corps ${EM_DASH} ici`, 'EOF', ')"',
  ].join('\n');
  const result = hook(env, bash(command));
  assert.equal(result.permissionDecision, 'deny');
  assert.match(result.permissionDecisionReason, /em dash in the body \(gh pr\)/);
  assert.doesNotMatch(result.permissionDecisionReason, /message de commit/);
  assert.equal(decision(env, bash("cat <<'EOF' > notes.txt\nUpdate stuff\nEOF\ngit commit -F - <<'EOF'\nfeat: ok\nEOF")), 'allow');
  assert.equal(decision(env, bash("cat <<'EOF' | git commit -F -\nUpdate stuff\nEOF")), 'deny');
});

test('bypass: config-tamper sees home paths and any drive letter case', () => {
  const env = setup();
  assert.equal(decision(env, bash("echo '{}' > ~/.claude/settings.json")), 'ask');
  assert.equal(decision(env, bash("echo '{}' > $HOME/.claude/settings.json")), 'ask');
  assert.equal(decision(env, bash("echo '{}' >${HOME}/.claude/guardrails.json")), 'ask');
  const lowerDrive = path.join(env.home, '.claude', 'settings.json').replace(/^[A-Z]:/, (drive) => drive.toLowerCase());
  assert.equal(decision(env, write(lowerDrive, '{}')), 'ask');
  assert.equal(decision(env, bash("echo '{}' > ~/notes.json")), 'allow');
});

test('bypass: a here-string is not a heredoc', () => {
  const env = setup();
  assert.equal(decision(env, bash('read x <<<"EOF"\ngit push origin main')), 'deny');
  assert.equal(decision(env, bash("read x <<< 'EOF'\ngit push origin main")), 'deny');
});

test('bypass: checking out a file is not a branch switch', () => {
  const env = setup();
  assert.equal(decision(env, bash('git checkout README.md && git push')), 'deny');
  assert.equal(decision(env, bash('git checkout -- README.md && git push')), 'deny');
  assert.equal(decision(env, bash('git checkout HEAD -- README.md && git push')), 'deny');
  sh(env.repo, 'branch', 'feat/q');
  assert.equal(decision(env, bash('git checkout feat/q && git push')), 'allow');
  assert.equal(decision(env, bash('git switch feat/q && git push')), 'allow');
});

test('false positive: PowerShell here-string commit message', () => {
  const env = setup();
  assert.equal(decision(env, ps("git commit -m @'\nfeat: add thing\n'@")), 'allow');
  assert.equal(decision(env, ps('git commit -m @"\nfeat: add thing\n\nBody.\n"@')), 'allow');
  assert.equal(decision(env, ps("git commit -m @'\nAdd thing\n'@")), 'deny');
});

test('false positive: local development URLs are not secrets; the URL scan stays linear', () => {
  const env = setup();
  const url = (user, password, host) => ['postgres', 'ql://', user, ':', password, '@', host, ':5432/app'].join('');
  assert.equal(decision(env, write(path.join(env.repo, 'docker-compose.yml'), `DATABASE_URL: ${url('postgres', 'postgres', 'db')}\n`)), 'allow');
  assert.equal(decision(env, write(path.join(env.repo, '.env.example'), `DATABASE_URL=${url('app', 'app_password', 'localhost')}\n`)), 'allow');
  assert.equal(decision(env, write(path.join(env.repo, 'a.yml'), `u: ${url('app', 'app_password', '[::1]')}\n`)), 'allow');
  assert.equal(decision(env, write(path.join(env.repo, 'a.yml'), `u: ${url('app', 'app_password', 'host.docker.internal')}\n`)), 'allow');
  assert.equal(decision(env, write(path.join(env.repo, 'config.ts'), `const u = "${url('admin', 'Zx81qPw0rdLong', 'db.acme-corp.io')}";`)), 'deny');
  const { secretsIn } = require(path.join(path.dirname(GUARD), 'rules.cjs'));
  const long = 'a.'.repeat(100 * 1024);
  const started = process.hrtime.bigint();
  assert.deepEqual(secretsIn(long), []);
  const elapsedMs = Number(process.hrtime.bigint() - started) / 1e6;
  assert.ok(elapsedMs < 300, `secretsIn took ${elapsedMs} ms on a 200 KB line`);
});

test('false positive: store commands inside quoted text are not store reads', () => {
  const env = setup();
  assert.equal(decision(env, bash('git commit -m "fix: pass show flag to the renderer"')), 'allow');
  assert.equal(decision(env, bash('git commit -m "docs: explain vault read access"')), 'allow');
  assert.equal(decision(env, bash('pass show prod/db')), 'deny');
  assert.equal(decision(env, bash('vault read secret/app')), 'deny');
  assert.equal(decision(env, bash('cat "$HISTFILE"')), 'deny');
});

test('false positive: kubectl exec flags env only as the remote command', () => {
  const env = setup();
  assert.equal(decision(env, bash('kubectl exec -n app-env deploy/web -- ls /app')), 'allow');
  assert.equal(decision(env, bash('kubectl exec -n app deploy/web -- env')), 'deny');
  assert.equal(decision(env, bash('kubectl exec deploy/web -- printenv DB_URL')), 'deny');
  assert.equal(decision(env, bash('kubectl exec deploy/web -- sh -c "env | grep DB"')), 'deny');
  assert.equal(decision(env, bash('kubectl exec deploy/web -- cat /proc/1/environ')), 'deny');
});

test('false positive: reading core.hooksPath is allowed, setting it is not', () => {
  const env = setup();
  assert.equal(decision(env, bash('git config --get core.hooksPath')), 'allow');
  assert.equal(decision(env, bash('git config core.hooksPath')), 'allow');
  assert.equal(decision(env, bash('git config --unset core.hooksPath')), 'allow');
  assert.equal(decision(env, bash('git config get core.hooksPath')), 'allow');
  assert.equal(decision(env, bash('git config core.hooksPath /dev/null')), 'deny');
  assert.equal(decision(env, bash('git config --global core.hooksPath .hooks')), 'deny');
});

test('false positive: sed, perl, awk and tr removing a forbidden character', () => {
  const env = setup();
  assert.equal(decision(env, bash(`sed -i 's/${EM_DASH}/-/g' README.md`)), 'allow');
  assert.equal(decision(env, bash(`perl -pi -e 's/${CHECK_EMOJI}//g' README.md`)), 'allow');
  assert.equal(decision(env, bash(`tr -d '${EM_DASH}' < a.md > b.md`)), 'allow');
  assert.equal(decision(env, bash(`cat <<'EOF' > a.md\nx ${EM_DASH} y\nEOF`)), 'deny');
  assert.equal(decision(env, bash(`sed -i 's/a/b/' x.md && echo "${EM_DASH}" > y.md`)), 'deny');
});

test('configuration: a malformed rule value blocks instead of crashing', () => {
  const env = setup();
  fs.mkdirSync(path.join(env.repo, '.claude'));
  for (const value of [true, null, 3, ['x']]) {
    fs.writeFileSync(path.join(env.repo, '.claude', 'guardrails.json'), JSON.stringify({ rules: { emoji: value } }));
    assert.equal(decision(env, write(path.join(env.repo, 'a.ts'), `// done ${CHECK_EMOJI}`)), 'deny', JSON.stringify(value));
  }
  fs.writeFileSync(path.join(env.repo, '.claude', 'guardrails.json'), JSON.stringify({ rules: { emoji: true } }));
  const result = hook(env, write(path.join(env.repo, 'a.md'), 'plain'));
  assert.match(result.additionalContext, /invalid rule emoji/);
  for (const content of ['null', '5', '{"rules": 7}']) {
    fs.writeFileSync(path.join(env.repo, '.claude', 'guardrails.json'), content);
    assert.equal(decision(env, write(path.join(env.repo, 'a.md'), `a ${EM_DASH} b`)), 'deny', content);
  }
});

test('merge and approval need the user', () => {
  const env = setup();
  assert.equal(decision(env, bash('gh pr merge 12 --squash')), 'ask');
  assert.equal(decision(env, bash('gh pr merge --auto --squash')), 'ask');
  assert.equal(decision(env, bash('gh pr review 12 --approve')), 'ask');
  assert.equal(decision(env, bash('gh api -X PUT repos/o/r/pulls/3/merge')), 'ask');
  assert.equal(decision(env, bash('gh api repos/o/r/pulls/3/reviews -f event=APPROVE')), 'ask');
  assert.equal(decision(env, bash('gh api -X POST repos/o/r/actions/runs/9/pending_deployments -f state=approved')), 'ask');
  assert.equal(decision(env, bash('gh pr view 12')), 'allow');
  assert.equal(decision(env, bash('gh api repos/o/r/pulls/3')), 'allow');
  assert.equal(decision(env, bash('gh pr review 12 --comment -b "ok"')), 'allow');
  assert.equal(decision(env, bash('gh api repos/o/r/pulls/3/reviews -f event=COMMENT')), 'allow');
  const output = execFileSync('node', [GUARD], {
    input: JSON.stringify({ hook_event_name: 'SessionStart', cwd: env.repo }),
    encoding: 'utf8',
    env: { ...process.env, HOME: env.home, USERPROFILE: env.home, CLAUDE_PROJECT_DIR: '' },
  });
  assert.match(JSON.parse(output).hookSpecificOutput.additionalContext, /merge and approval/);
});
