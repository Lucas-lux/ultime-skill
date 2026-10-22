'use strict';
// Conversion of the Claude Code subagents and slash commands of a pack into the formats of other
// coding agents. The Claude files stay the single source: nothing here is written back to plugins/.

/**
 * Split a Markdown file into its YAML frontmatter (top-level scalars, folded blocks and simple lists)
 * and its body.
 *
 * @param {string} text File content.
 * @returns {{fields: Record<string, string | string[]>, body: string}} Parsed file.
 */
function parse(text) {
  const match = String(text).match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { fields: {}, body: String(text) };
  const fields = {};
  let key = null;
  for (const line of match[1].split(/\r?\n/)) {
    const top = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (top) {
      key = top[1];
      const value = top[2].trim();
      fields[key] = ['>', '|', '>-', '|-'].includes(value) ? '' : value.replace(/^["']|["']$/g, '');
    } else if (key && /^\s+-\s+/.test(line)) {
      fields[key] = [...(Array.isArray(fields[key]) ? fields[key] : []), line.replace(/^\s+-\s+/, '').trim()];
    } else if (key && /^\s+\S/.test(line) && typeof fields[key] === 'string') {
      fields[key] = `${fields[key]} ${line.trim()}`.trim();
    }
  }
  return { fields, body: match[2] };
}

/** YAML scalar: JSON strings are valid double-quoted YAML. */
const yaml = (value) => JSON.stringify(String(value));

/** TOML multi-line string, literal when possible so backslashes stay as written. */
function tomlText(text) {
  return text.includes("'''") ? `"""\n${text.replace(/\\/g, '\\\\').replace(/"""/g, '\\"\\"\\"')}"""` : `'''\n${text}'''`;
}

/** Name of a pack's agent or command outside Claude Code, where there is no `pack:` namespace. */
function flatName(pack, name) {
  return name.startsWith(`${pack}-`) ? name : `${pack}-${name}`;
}

/** Claude model alias to a Codex reasoning effort (other models are not portable across vendors). */
const EFFORT = { haiku: 'low', sonnet: 'medium' };

/**
 * Convert one Claude Code subagent.
 *
 * @param {string} pack Pack name.
 * @param {string} text Agent file content.
 * @param {string} format codex | opencode | copilot | claude-like | plain.
 * @returns {{file: string, content: string}} File name and content in the target format.
 */
function agent(pack, text, format) {
  const { fields, body } = parse(text);
  const name = flatName(pack, fields.name);
  const description = fields.description || '';
  if (format === 'codex') {
    const lines = [`name = ${JSON.stringify(name)}`, `description = ${JSON.stringify(description)}`];
    if (EFFORT[fields.model]) lines.push(`model_reasoning_effort = ${JSON.stringify(EFFORT[fields.model])}`);
    lines.push(`developer_instructions = ${tomlText(body.trim() + '\n')}`);
    return { file: `${name}.toml`, content: `${lines.join('\n')}\n` };
  }
  const head = [`name: ${yaml(name)}`, `description: ${yaml(description)}`];
  let file = `${name}.md`;
  if (format === 'opencode') {
    head.shift();
    head.push('mode: subagent');
  } else if (format === 'copilot') {
    file = `${name}.agent.md`;
  } else if (format === 'claude-like') {
    for (const key of ['tools', 'disallowedTools']) {
      const value = fields[key];
      if (value && value.length) head.push(`${key}: ${Array.isArray(value) ? value.join(', ') : value}`);
    }
  }
  return { file, content: `---\n${head.join('\n')}\n---\n\n${body.trim()}\n` };
}

/**
 * Convert one Claude Code slash command.
 *
 * @param {string} pack Pack name.
 * @param {string} name Command name (file stem).
 * @param {string} text Command file content.
 * @param {string} format gemini | markdown | copilot | plain.
 * @returns {{file: string, content: string}} Relative file path and content.
 */
function command(pack, name, text, format) {
  const { fields, body } = parse(text);
  const description = fields.description || '';
  if (format === 'gemini') {
    // A subfolder namespaces the command: commands/<pack>/<name>.toml is /<pack>:<name>, as in Claude Code.
    const prompt = body.trim().replace(/\$ARGUMENTS/g, '{{args}}');
    return { file: `${pack}/${name}.toml`, content: `description = ${JSON.stringify(description)}\nprompt = ${tomlText(`${prompt}\n`)}\n` };
  }
  const flat = flatName(pack, name);
  if (format === 'copilot') return { file: `${flat}.prompt.md`, content: `---\ndescription: ${yaml(description)}\n---\n\n${body.trim()}\n` };
  if (format === 'markdown') return { file: `${flat}.md`, content: `---\ndescription: ${yaml(description)}\n---\n\n${body.trim()}\n` };
  return { file: `${flat}.md`, content: `${description ? `# ${description}\n\n` : ''}${body.trim()}\n` };
}

module.exports = { parse, agent, command, flatName };
