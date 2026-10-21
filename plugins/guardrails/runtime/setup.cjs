'use strict';
// Install the guardrails into a project (copy of the runtime + hook entries in .claude/settings.json),
// remove them, or show where they are active. The project copy is what cloud sessions and teammates
// without the plugin run; with the plugin also installed, the plugin copy stays silent in that project.
//
// Usage:
//   node setup.cjs install-project [--dir <project root>]
//   node setup.cjs uninstall-project [--dir <project root>]
//   node setup.cjs status [--dir <project root>]

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const git = require('./lib/git.cjs');

const RUNTIME = __dirname;
const COPY_DIR = path.join('.claude', 'hooks', 'guardrails');
const COMMAND = 'node "${CLAUDE_PROJECT_DIR}/.claude/hooks/guardrails/guard.cjs"';
const ENTRIES = {
  PreToolUse: { matcher: 'Bash|PowerShell|Write|Edit|MultiEdit|NotebookEdit|Read', timeout: 10 },
  SessionStart: { matcher: 'startup|resume|clear|compact', timeout: 5 },
  SubagentStart: { timeout: 5 },
};
const RUNTIME_FILES = ['guard.cjs', 'rules.cjs', 'setup.cjs', 'defaults.json', 'lib'];

function fail(message) {
  process.stderr.write(`error: ${message}\n`);
  process.exit(1);
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return fallback;
    fail(`${file} is not valid JSON (${error.message}): fix it first`);
  }
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

/** Drop this tool's hook entries from a settings object, leaving every other hook untouched. */
function withoutOurHooks(settings) {
  const hooks = settings.hooks || {};
  for (const event of Object.keys(hooks)) {
    hooks[event] = hooks[event]
      .map((group) => ({ ...group, hooks: (group.hooks || []).filter((hook) => hook.command !== COMMAND) }))
      .filter((group) => group.hooks.length);
    if (!hooks[event].length) delete hooks[event];
  }
  if (Object.keys(hooks).length) settings.hooks = hooks;
  else delete settings.hooks;
  return settings;
}

function install(root) {
  const target = path.join(root, COPY_DIR);
  // Run from the project copy itself: the files are already in place, only the settings are refreshed.
  if (path.resolve(RUNTIME) !== path.resolve(target)) {
    fs.rmSync(target, { recursive: true, force: true });
    for (const name of RUNTIME_FILES) fs.cpSync(path.join(RUNTIME, name), path.join(target, name), { recursive: true });
  }

  const settingsFile = path.join(root, '.claude', 'settings.json');
  const settings = withoutOurHooks(readJson(settingsFile, {}));
  settings.hooks = settings.hooks || {};
  for (const [event, { matcher, timeout }] of Object.entries(ENTRIES)) {
    const group = { hooks: [{ type: 'command', command: COMMAND, timeout }] };
    if (matcher) group.matcher = matcher;
    settings.hooks[event] = [...(settings.hooks[event] || []), group];
  }
  writeJson(settingsFile, settings);

  const configFile = path.join(root, '.claude', 'guardrails.json');
  if (!fs.existsSync(configFile)) writeJson(configFile, { rules: {} });
  process.stdout.write([
    `installed  ${COPY_DIR.replace(/\\/g, '/')} and hooks in .claude/settings.json`,
    'config     .claude/guardrails.json (rules: {} = defaults; see the guardrails skill to change a rule)',
    'next       commit .claude/ so cloud sessions and teammates get the same guardrails',
    '',
  ].join('\n'));
}

function uninstall(root) {
  fs.rmSync(path.join(root, COPY_DIR), { recursive: true, force: true });
  const settingsFile = path.join(root, '.claude', 'settings.json');
  if (fs.existsSync(settingsFile)) writeJson(settingsFile, withoutOurHooks(readJson(settingsFile, {})));
  process.stdout.write('removed    project copy and hook entries (.claude/guardrails.json kept)\n');
}

function status(root) {
  const projectCopy = fs.existsSync(path.join(root, COPY_DIR, 'guard.cjs'));
  const userConfig = path.join(os.homedir(), '.claude', 'guardrails.json');
  const projectConfig = path.join(root, '.claude', 'guardrails.json');
  process.stdout.write([
    `project    ${root}`,
    `copy       ${projectCopy ? 'installed (this copy answers in this project)' : 'none (the plugin answers, if installed)'}`,
    `config     user ${fs.existsSync(userConfig) ? userConfig : 'none'} | project ${fs.existsSync(projectConfig) ? projectConfig : 'none'}`,
    '',
  ].join('\n'));
}

function main() {
  const [action, ...rest] = process.argv.slice(2);
  const dirIndex = rest.indexOf('--dir');
  const start = dirIndex >= 0 ? path.resolve(rest[dirIndex + 1] || '.') : process.cwd();
  const root = git.root(start) || start;
  if (action === 'install-project') install(root);
  else if (action === 'uninstall-project') uninstall(root);
  else if (action === 'status') status(root);
  else fail('usage: node setup.cjs install-project|uninstall-project|status [--dir <project root>]');
}

main();
