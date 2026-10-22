'use strict';
// Where each coding agent reads skills, subagents, commands and always-on instructions, at user scope
// (relative to the home directory) and project scope (relative to the project root). A missing entry
// means the harness has no such file there, or none documented. Hooks are in
// plugins/guardrails/runtime/lib/wiring.cjs. Sources: each harness's documentation, October 2026.
//
// `.agents/skills` is the shared folder of the Agent Skills standard: one copy serves every harness
// that reads it, so installing for several of them never duplicates a skill.

const SHARED = { user: '.agents/skills', project: '.agents/skills' };

/**
 * agents.format: codex (TOML), opencode (mode: subagent), copilot (.agent.md), claude-like (keeps
 * tools), plain (name and description only).
 * commands.format: gemini (TOML, /pack:name), markdown (frontmatter description), plain (body only).
 */
const HARNESSES = {
  claude: { label: 'Claude Code', plugin: true, detect: ['claude', '.claude'] },
  codex: {
    label: 'OpenAI Codex',
    skills: SHARED,
    agents: { user: '.codex/agents', project: '.codex/agents', format: 'codex' },
    instructions: { user: '.codex/AGENTS.md', project: 'AGENTS.md' },
    guardrails: true,
    detect: ['codex', '.codex'],
  },
  gemini: {
    label: 'Gemini CLI',
    skills: SHARED,
    agents: { user: '.gemini/agents', project: '.gemini/agents', format: 'plain' },
    commands: { user: '.gemini/commands', project: '.gemini/commands', format: 'gemini' },
    instructions: { user: '.gemini/GEMINI.md', project: 'GEMINI.md' },
    guardrails: true,
    detect: ['gemini', '.gemini'],
  },
  qwen: {
    label: 'Qwen Code',
    skills: SHARED,
    agents: { user: '.qwen/agents', project: '.qwen/agents', format: 'claude-like' },
    commands: { user: '.qwen/commands', project: '.qwen/commands', format: 'gemini' },
    instructions: { user: '.qwen/QWEN.md', project: 'QWEN.md' },
    guardrails: true,
    detect: ['qwen', '.qwen'],
  },
  antigravity: {
    label: 'Google Antigravity',
    skills: { user: '.gemini/config/skills', project: '.agents/skills' },
    agents: { user: '.gemini/config/agents', project: '.agents/agents', format: 'plain' },
    instructions: { user: '.gemini/GEMINI.md', project: 'AGENTS.md' },
    detect: ['agy', '.gemini/config'],
  },
  cursor: {
    label: 'Cursor',
    skills: SHARED,
    agents: { user: '.cursor/agents', project: '.cursor/agents', format: 'plain' },
    commands: { user: '.cursor/commands', project: '.cursor/commands', format: 'plain' },
    instructions: { project: '.cursor/rules/ultime-skill.mdc' },
    guardrails: true,
    detect: ['cursor-agent', 'cursor', '.cursor'],
  },
  copilot: {
    label: 'GitHub Copilot (CLI, VS Code, coding agent)',
    skills: SHARED,
    agents: { user: '.copilot/agents', project: '.github/agents', format: 'copilot' },
    commands: { project: '.github/prompts', format: 'copilot' },
    instructions: { project: 'AGENTS.md' },
    guardrails: true,
    detect: ['copilot', '.copilot'],
  },
  windsurf: {
    label: 'Windsurf / Devin Desktop',
    skills: { user: '.codeium/windsurf/skills', project: '.agents/skills' },
    instructions: { project: 'AGENTS.md' },
    detect: ['windsurf', '.codeium/windsurf'],
  },
  devin: {
    label: 'Devin CLI',
    skills: { user: '.config/devin/skills', project: '.agents/skills' },
    agents: { user: '.config/devin/agents', project: '.devin/agents', format: 'plain' },
    instructions: { project: 'AGENTS.md' },
    detect: ['devin', '.config/devin'],
  },
  junie: {
    label: 'JetBrains Junie',
    skills: SHARED,
    agents: { user: '.junie/agents', project: '.junie/agents', format: 'claude-like' },
    instructions: { project: 'AGENTS.md' },
    detect: ['junie', '.junie'],
  },
  droid: {
    label: 'Factory Droid',
    skills: SHARED,
    agents: { user: '.factory/droids', project: '.factory/droids', format: 'plain' },
    instructions: { project: 'AGENTS.md' },
    guardrails: true,
    detect: ['droid', '.factory'],
  },
  opencode: {
    label: 'OpenCode',
    skills: SHARED,
    agents: { user: '.config/opencode/agents', project: '.opencode/agents', format: 'opencode' },
    commands: { user: '.config/opencode/commands', project: '.opencode/commands', format: 'markdown' },
    instructions: { user: '.config/opencode/AGENTS.md', project: 'AGENTS.md' },
    guardrails: true,
    detect: ['opencode', '.config/opencode'],
  },
  kilo: {
    label: 'Kilo Code',
    skills: SHARED,
    agents: { project: '.kilo/agents', format: 'opencode' },
    commands: { project: '.kilo/commands', format: 'markdown' },
    instructions: { project: 'AGENTS.md' },
    guardrails: true,
    detect: ['kilo', '.kilo'],
  },
  cline: {
    label: 'Cline',
    skills: { user: '.cline/skills', project: '.cline/skills' },
    instructions: { project: 'AGENTS.md' },
    detect: ['cline', '.cline'],
  },
  kiro: {
    label: 'Kiro',
    skills: { user: '.kiro/skills', project: '.kiro/skills' },
    instructions: { user: '.kiro/steering/ultime-skill.md', project: '.kiro/steering/ultime-skill.md' },
    guardrails: true,
    detect: ['kiro', 'kiro-cli', '.kiro'],
  },
  amp: {
    label: 'Amp',
    skills: SHARED,
    instructions: { project: 'AGENTS.md' },
    detect: ['amp', '.config/amp'],
  },
  goose: {
    label: 'Goose',
    skills: SHARED,
    instructions: { project: 'AGENTS.md' },
    detect: ['goose', '.config/goose'],
  },
  zed: {
    label: 'Zed (Zed Agent)',
    skills: SHARED,
    instructions: { project: 'AGENTS.md' },
    detect: ['zed', '.config/zed'],
  },
};

module.exports = { HARNESSES };
