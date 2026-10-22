#!/usr/bin/env node
'use strict';
// Universal installer of ultime-skill: puts the packs' skills, subagents, commands, guardrails and
// always-on instructions where each coding agent reads them. Claude Code keeps its native plugin
// marketplace (this script only drives the `claude` CLI for it); every other harness gets copies
// converted from the same plugins/ sources.
//
//   npx github:Lucas-lux/ultime-skill install [packs or bundles...] [--agent codex,gemini|all|auto]
//       [--scope user|project] [--dir <project>] [--no-guardrails] [--no-ponytail] [--dry-run]
//   npx github:Lucas-lux/ultime-skill uninstall [packs...|--all] [--agent ...] [--scope ...] [--dir ...]
//   npx github:Lucas-lux/ultime-skill list | agents

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { HARNESSES } = require('./lib/harnesses.cjs');
const convert = require('./lib/convert.cjs');

const ROOT = path.resolve(__dirname, '..');
const PLUGINS = path.join(ROOT, 'plugins');
const MARKETPLACE = 'ultime-skill';
const SOURCE = process.env.ULTIME_SKILL_SOURCE || 'Lucas-lux/ultime-skill';
const DEFAULT_PACKS = ['ultime-profile', 'guardrails', 'ponytail'];
const GATED = new Set(['sec-offense']);
const BEGIN = '<!-- ultime-skill:begin (managed by the ultime-skill installer, edits inside are overwritten) -->';
const END = '<!-- ultime-skill:end -->';

const home = () => process.env.ULTIME_SKILL_HOME || require('node:os').homedir();
const wiring = () => require(path.join(PLUGINS, 'guardrails', 'runtime', 'lib', 'wiring.cjs'));

function fail(message) {
  process.stderr.write(`ultime-skill: ${message}\n`);
  process.exit(1);
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeFile(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

/** Packs and bundles of the marketplace, in catalog order. */
function catalog() {
  const marketplace = readJson(path.join(ROOT, '.claude-plugin', 'marketplace.json'), null);
  if (!marketplace) fail('plugins/ and .claude-plugin/marketplace.json not found: run from the repository or with npx github:Lucas-lux/ultime-skill');
  const packs = new Map();
  for (const entry of marketplace.plugins) {
    const manifest = readJson(path.join(ROOT, entry.source, '.claude-plugin', 'plugin.json'), {});
    packs.set(entry.name, { name: entry.name, dir: path.join(ROOT, entry.source), description: entry.description, members: manifest.dependencies || null });
  }
  return packs;
}

/** Expand bundles into packs, keeping catalog order and dropping duplicates. */
function expand(targets, packs) {
  const wanted = new Set();
  const visit = (name, explicit) => {
    const pack = packs.get(name);
    if (!pack) fail(`unknown pack or bundle "${name}" (see: ultime-skill list)`);
    if (pack.members) for (const member of pack.members) visit(member, false);
    else if (explicit || !GATED.has(name)) wanted.add(name);
  };
  for (const target of targets) visit(target, true);
  return [...packs.keys()].filter((name) => wanted.has(name));
}

function onPath(command) {
  const extensions = process.platform === 'win32' ? (process.env.PATHEXT || '.EXE;.CMD;.BAT').split(';') : [''];
  for (const directory of (process.env.PATH || '').split(path.delimiter)) {
    for (const extension of extensions) {
      if (directory && fs.existsSync(path.join(directory, command + extension.toLowerCase()))) return true;
      if (directory && fs.existsSync(path.join(directory, command + extension))) return true;
    }
  }
  return false;
}

/** Harnesses found on this machine: a command on the PATH or a configuration folder in the home directory. */
function detected() {
  return Object.entries(HARNESSES)
    .filter(([, harness]) => harness.detect.some((hint) => (hint.startsWith('.') ? fs.existsSync(path.join(home(), hint)) : onPath(hint))))
    .map(([id]) => id);
}

function options(argv) {
  const result = { targets: [], agent: 'auto', scope: 'user', dir: process.cwd(), guardrails: true, ponytail: true, dryRun: false, all: false };
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    const value = () => argv[++index] || fail(`${arg} needs a value`);
    if (arg === '--agent' || arg === '-a') result.agent = value();
    else if (arg === '--scope') result.scope = value();
    else if (arg === '--dir') result.dir = path.resolve(value());
    else if (arg === '--no-guardrails') result.guardrails = false;
    else if (arg === '--no-ponytail') result.ponytail = false;
    else if (arg === '--dry-run') result.dryRun = true;
    else if (arg === '--all') result.all = true;
    else if (arg === '-h' || arg === '--help') result.help = true;
    else if (arg.startsWith('-')) fail(`unknown option ${arg}`);
    else result.targets.push(arg);
  }
  if (!['user', 'project'].includes(result.scope)) fail('--scope is user or project');
  return result;
}

function harnessList(agent) {
  const ids = agent === 'all' ? Object.keys(HARNESSES) : agent === 'auto' ? detected() : agent.split(',').map((id) => id.trim().toLowerCase()).filter(Boolean);
  const unknown = ids.filter((id) => !HARNESSES[id]);
  if (unknown.length) fail(`unknown agent ${unknown.join(', ')} (known: ${Object.keys(HARNESSES).join(', ')})`);
  if (!ids.length) fail(`no coding agent detected: name it with --agent (${Object.keys(HARNESSES).join(', ')})`);
  return ids;
}

/** Installation record of a scope: what was written, for which pack and harness. */
class State {
  constructor(base) {
    this.file = path.join(base, '.ultime-skill', 'installed.json');
    const saved = readJson(this.file, {});
    this.entries = saved.entries || {};
  }

  /** Remember that `harness` uses `target` (a skill folder or a file) installed for `pack`. */
  add(target, pack, harness, kind) {
    const entry = this.entries[target] || { pack, kind, harnesses: [] };
    if (!entry.harnesses.includes(harness)) entry.harnesses.push(harness);
    this.entries[target] = entry;
  }

  owner(target) {
    return this.entries[target] && this.entries[target].pack;
  }

  save(dryRun) {
    if (!dryRun) writeFile(this.file, `${JSON.stringify({ version: 1, entries: this.entries }, null, 2)}\n`);
  }
}

/** Replace (or with text=null, remove) our managed block in an instructions file shared with the user. */
function writeBlock(file, text) {
  const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  const pattern = new RegExp(`\\n?${BEGIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${END}\\n?`);
  const without = current.replace(pattern, '\n').replace(/^\n+/, '');
  if (text === null) {
    if (without.trim()) fs.writeFileSync(file, without);
    else fs.rmSync(file, { force: true });
    return;
  }
  writeFile(file, `${without.trimEnd()}${without.trim() ? '\n\n' : ''}${BEGIN}\n${text.trim()}\n${END}\n`);
}

/** Always-on instructions for harnesses without Claude Code's session hooks. */
function instructionsText(id, packs, guardText) {
  const parts = ['## ultime-skill'];
  if (guardText) {
    parts.push(HARNESSES[id].guardrails
      ? `${guardText.trim()}`
      : `Guardrails to follow (this harness runs no ultime-skill hook, nothing enforces them): ${guardText.trim().replace(/^Active guardrails \([^)]*\): /, '')}`);
  }
  parts.push('Names: the skills use Claude Code naming, `<pack>:<name>`. Here a skill is just `<name>` (a few carry a `<pack>-` prefix when two packs share a name), and Claude Code tool names (Bash, Read, Edit, Agent, AskUserQuestion) mean this harness\'s equivalent tools.');
  const withAgents = packs.filter((pack) => fs.existsSync(path.join(PLUGINS, pack, 'agents')));
  if (withAgents.length) {
    parts.push(`Subagents: a skill that delegates to \`<pack>:<role>\` means the subagent \`<pack>-<role>\` here (packs: ${withAgents.join(', ')}). If this harness cannot run subagents, read the role in the skill's \`roles/<role>.md\` and do that step yourself, one role at a time.`);
  }
  if (packs.includes('ponytail')) {
    const skill = fs.readFileSync(path.join(PLUGINS, 'ponytail', 'skills', 'ponytail', 'SKILL.md'), 'utf8');
    parts.push(convert.parse(skill).body.trim());
  }
  return parts.join('\n\n');
}

function copyDirectory(source, target) {
  fs.rmSync(target, { recursive: true, force: true });
  fs.cpSync(source, target, { recursive: true, filter: (item) => !/__pycache__|\.pyc$/.test(item) });
}

/**
 * Install one pack for one harness at one scope.
 *
 * @returns {string[]} Human-readable actions.
 */
function installPack(pack, id, scope, base, state, dryRun) {
  const harness = HARNESSES[id];
  const source = path.join(PLUGINS, pack);
  const actions = [];
  const skillsRoot = harness.skills && harness.skills[scope];
  const agentsDir = path.join(source, 'agents');
  const agentFiles = fs.existsSync(agentsDir) ? fs.readdirSync(agentsDir).filter((file) => file.endsWith('.md')) : [];
  if (skillsRoot && fs.existsSync(path.join(source, 'skills'))) {
    for (const name of fs.readdirSync(path.join(source, 'skills'))) {
      const from = path.join(source, 'skills', name);
      if (!fs.existsSync(path.join(from, 'SKILL.md'))) continue;
      let folder = name;
      let target = path.join(base, skillsRoot, folder);
      // Skill names are flat outside Claude Code: a name already taken by another pack gets a prefix.
      if (fs.existsSync(target) && state.owner(target) !== pack) {
        if (!state.owner(target)) {
          actions.push(`skip      ${target} (exists and was not installed by ultime-skill)`);
          continue;
        }
        folder = convert.flatName(pack, name);
        target = path.join(base, skillsRoot, folder);
      }
      if (!dryRun) {
        copyDirectory(from, target);
        if (folder !== name) {
          const file = path.join(target, 'SKILL.md');
          fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace(/^(---\r?\n[\s\S]*?^name:\s*).*$/m, `$1${folder}`));
        }
        const text = fs.readFileSync(path.join(target, 'SKILL.md'), 'utf8');
        // An orchestrator skill gets its pack's roles, for harnesses that cannot run subagents.
        if (agentFiles.length && text.includes(`${pack}:`)) {
          for (const file of agentFiles) writeFile(path.join(target, 'roles', file), fs.readFileSync(path.join(agentsDir, file), 'utf8'));
        }
      }
      state.add(target, pack, id, 'skill');
      actions.push(`skill     ${path.join(skillsRoot, folder).replace(/\\/g, '/')}`);
    }
  }
  const agentTarget = harness.agents && harness.agents[scope];
  if (agentTarget && agentFiles.length) {
    for (const file of agentFiles) {
      const converted = convert.agent(pack, fs.readFileSync(path.join(agentsDir, file), 'utf8'), harness.agents.format);
      const target = path.join(base, agentTarget, converted.file);
      if (!dryRun) writeFile(target, converted.content);
      state.add(target, pack, id, 'file');
      actions.push(`agent     ${path.join(agentTarget, converted.file).replace(/\\/g, '/')}`);
    }
  }
  const commandsDir = path.join(source, 'commands');
  const commandTarget = harness.commands && harness.commands[scope];
  if (commandTarget && fs.existsSync(commandsDir)) {
    for (const file of fs.readdirSync(commandsDir).filter((item) => item.endsWith('.md'))) {
      const converted = convert.command(pack, file.replace(/\.md$/, ''), fs.readFileSync(path.join(commandsDir, file), 'utf8'), harness.commands.format);
      const target = path.join(base, commandTarget, converted.file);
      if (!dryRun) writeFile(target, converted.content);
      state.add(target, pack, id, 'file');
      actions.push(`command   ${path.join(commandTarget, converted.file).replace(/\\/g, '/')}`);
    }
  }
  return actions;
}

/** Copy the guardrails runtime (user scope) or install the project copy, then wire the harness hook. */
function installGuardrails(id, scope, base, state, dryRun) {
  if (!HARNESSES[id].guardrails) return { actions: [`note      ${id}: no hook support used, guardrails become written instructions`], guard: null };
  const runtime = path.join(PLUGINS, 'guardrails', 'runtime');
  if (scope === 'project') {
    if (!dryRun) {
      const result = spawnSync(process.execPath, [path.join(runtime, 'setup.cjs'), 'install-project', '--harness', id, '--dir', base], { encoding: 'utf8' });
      if (result.status) fail(`guardrails setup failed: ${result.stderr.trim()}`);
    }
    return { actions: [`hook      ${(wiring().TARGETS[id].project || '').replace(/\\/g, '/')} (project copy .claude/hooks/guardrails)`], guard: path.join(base, '.claude', 'hooks', 'guardrails', 'guard.cjs') };
  }
  const copy = path.join(base, '.ultime-skill', 'guardrails', 'runtime');
  const guard = path.join(copy, 'guard.cjs');
  if (!wiring().TARGETS[id].user) return { actions: [`note      ${id}: no user-level hook file, install the guardrails per project (--scope project)`], guard: null };
  if (!dryRun) {
    copyDirectory(runtime, copy);
    wiring().wire(id, 'user', base, { path: guard, relative: false });
  }
  state.add(path.dirname(copy), 'guardrails', id, 'dir');
  return { actions: [`hook      ${wiring().TARGETS[id].user}`], guard };
}

function reminderText(guard, id, dir) {
  const runtime = guard && fs.existsSync(guard) ? guard : path.join(PLUGINS, 'guardrails', 'runtime', 'guard.cjs');
  const result = spawnSync(process.execPath, [runtime, '--reminder', '--harness', id, '--dir', dir], { encoding: 'utf8' });
  return result.stdout.trim();
}

/** Claude Code: native plugins through its own CLI. */
function installClaude(packs, scope, dryRun) {
  const steps = [['plugin', 'marketplace', 'add', SOURCE, ...(scope === 'project' ? ['--scope', 'project'] : [])], ...packs.map((pack) => ['plugin', 'install', `${pack}@${MARKETPLACE}`, '--scope', scope])];
  for (const step of steps) {
    process.stdout.write(`claude    claude ${step.join(' ')}\n`);
    if (dryRun) continue;
    const result = spawnSync('claude', step, { stdio: 'inherit', shell: process.platform === 'win32' });
    if (result.status && step[1] !== 'marketplace') fail(`claude ${step.join(' ')} failed`);
  }
}

function install(opts) {
  const packs = catalog();
  const targets = opts.targets.length ? opts.targets : [...DEFAULT_PACKS];
  if (opts.guardrails && !targets.includes('guardrails')) targets.push('guardrails');
  if (opts.ponytail && !targets.includes('ponytail')) targets.push('ponytail');
  const selected = expand(targets, packs).filter((pack) => (opts.guardrails || pack !== 'guardrails') && (opts.ponytail || pack !== 'ponytail'));
  const base = opts.scope === 'user' ? home() : opts.dir;
  const state = new State(base);
  for (const id of harnessList(opts.agent)) {
    process.stdout.write(`\n${HARNESSES[id].label} (${opts.scope})${opts.dryRun ? ' [dry run]' : ''}\n`);
    if (HARNESSES[id].plugin) {
      installClaude(selected, opts.scope === 'user' ? 'user' : 'project', opts.dryRun);
      continue;
    }
    const actions = [];
    for (const pack of selected) actions.push(...installPack(pack, id, opts.scope, base, state, opts.dryRun));
    let guard = null;
    if (selected.includes('guardrails')) {
      const outcome = installGuardrails(id, opts.scope, base, state, opts.dryRun);
      actions.push(...outcome.actions);
      guard = outcome.guard;
    }
    const instructions = HARNESSES[id].instructions && HARNESSES[id].instructions[opts.scope];
    if (instructions) {
      const text = instructionsText(id, selected, selected.includes('guardrails') ? reminderText(guard, id, base) : '');
      const file = path.join(base, instructions);
      if (!opts.dryRun) {
        if (file.endsWith('.mdc')) writeFile(file, `---\ndescription: ultime-skill always-on rules\nalwaysApply: true\n---\n\n${text}\n`);
        else if (instructions.includes('.kiro/steering')) writeFile(file, `---\ninclusion: always\n---\n\n${text}\n`);
        else writeBlock(file, text);
      }
      state.add(file, '*', id, file.endsWith('.mdc') || instructions.includes('.kiro/') ? 'file' : 'block');
      actions.push(`rules     ${instructions}`);
    }
    process.stdout.write(`${summarize(actions)}\n`);
  }
  state.save(opts.dryRun);
  process.stdout.write(`\nDone. Restart the agent (or reload its skills) to pick up the changes.\n`);
}

/** Group repeated action kinds into a count, keeping notes and hooks verbatim. */
function summarize(actions) {
  const counts = {};
  const lines = [];
  for (const action of actions) {
    const kind = action.slice(0, 10).trim();
    if (['skill', 'agent', 'command'].includes(kind)) counts[kind] = (counts[kind] || 0) + 1;
    else lines.push(`  ${action}`);
  }
  const head = Object.entries(counts).map(([kind, count]) => `${count} ${kind}${count > 1 ? 's' : ''}`).join(', ');
  return [head ? `  ${head}` : '', ...lines].filter(Boolean).join('\n');
}

function uninstall(opts) {
  const base = opts.scope === 'user' ? home() : opts.dir;
  const state = new State(base);
  const ids = harnessList(opts.agent);
  const packs = opts.all || !opts.targets.length ? null : new Set(expand(opts.targets, catalog()));
  for (const id of ids.filter((h) => HARNESSES[h].plugin)) {
    for (const pack of packs || []) spawnSync('claude', ['plugin', 'uninstall', `${pack}@${MARKETPLACE}`, '--scope', opts.scope], { stdio: 'inherit', shell: process.platform === 'win32' });
  }
  let removed = 0;
  for (const [target, entry] of Object.entries(state.entries)) {
    if (packs && entry.pack !== '*' && !packs.has(entry.pack)) continue;
    if (packs && entry.pack === '*' && !packs.has('guardrails') && !packs.has('ponytail')) continue;
    entry.harnesses = entry.harnesses.filter((h) => !ids.includes(h));
    if (entry.harnesses.length) continue;
    if (!opts.dryRun) {
      if (entry.kind === 'block') writeBlock(target, null);
      else fs.rmSync(target, { recursive: true, force: true });
    }
    delete state.entries[target];
    removed++;
  }
  if (!packs || packs.has('guardrails')) {
    for (const id of ids.filter((h) => HARNESSES[h].guardrails)) {
      if (opts.dryRun) continue;
      if (opts.scope === 'user') wiring().wire(id, 'user', base, { path: '', relative: false }, true);
      else spawnSync(process.execPath, [path.join(PLUGINS, 'guardrails', 'runtime', 'setup.cjs'), 'uninstall-project', '--harness', id, '--dir', base]);
    }
  }
  state.save(opts.dryRun);
  process.stdout.write(`Removed ${removed} item(s) for ${ids.join(', ')}${opts.dryRun ? ' [dry run]' : ''}.\n`);
}

function list() {
  const lines = ['Packs:'];
  const bundles = ['', 'Bundles:'];
  for (const pack of catalog().values()) {
    if (pack.members) bundles.push(`  ${pack.name.padEnd(20)} ${pack.members.join(', ')}`);
    else {
      const skills = fs.existsSync(path.join(pack.dir, 'skills')) ? fs.readdirSync(path.join(pack.dir, 'skills')).length : 0;
      lines.push(`  ${pack.name.padEnd(20)} ${String(skills).padStart(3)} skills  ${pack.description.slice(0, 90)}`);
    }
  }
  process.stdout.write(`${[...lines, ...bundles].join('\n')}\n`);
}

function agents() {
  const found = new Set(detected());
  for (const [id, harness] of Object.entries(HARNESSES)) {
    const parts = [harness.plugin ? 'plugins' : 'skills', harness.agents && 'subagents', harness.commands && 'commands', harness.guardrails && 'guardrail hooks', harness.instructions && 'rules'].filter(Boolean);
    process.stdout.write(`${found.has(id) ? '*' : ' '} ${id.padEnd(12)} ${harness.label.padEnd(44)} ${parts.join(', ')}\n`);
  }
  process.stdout.write('\n* detected on this machine\n');
}

function main() {
  const [action, ...rest] = process.argv.slice(2);
  const opts = options(rest);
  if (!action || opts.help || action === 'help') {
    const source = fs.readFileSync(__filename, 'utf8').split('\n');
    process.stdout.write(`${source.slice(7, 11).map((line) => line.replace(/^\/\/ ?/, '')).join('\n')}\n`);
    return;
  }
  if (action === 'install') install(opts);
  else if (action === 'uninstall') uninstall(opts);
  else if (action === 'list') list();
  else if (action === 'agents') agents();
  else fail(`unknown command ${action} (install, uninstall, list, agents)`);
}

if (require.main === module) main();

module.exports = { expand, catalog, writeBlock, instructionsText };
