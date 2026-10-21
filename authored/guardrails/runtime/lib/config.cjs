'use strict';
// Effective configuration: built-in defaults, then ~/.claude/guardrails.json, then the project's
// .claude/guardrails.json and .claude/guardrails.local.json, then the environment.

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const DEFAULTS = require('../defaults.json');
const LEVELS = new Set(['block', 'warn', 'ask', 'off']);

/** @param {unknown} value Anything. @returns {boolean} True for a non-null, non-array object. */
function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Merge plain objects recursively; arrays and scalars of the override replace the base.
 *
 * @param {object} base Lower-priority values.
 * @param {object} override Higher-priority values.
 * @returns {object} A new merged object.
 */
function merge(base, override) {
  if (!override || typeof override !== 'object' || Array.isArray(override)) return override === undefined ? base : override;
  const result = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const current = result[key];
    const bothObjects = current && typeof current === 'object' && !Array.isArray(current) && value && typeof value === 'object' && !Array.isArray(value);
    result[key] = bothObjects ? merge(current, value) : value;
  }
  return result;
}

/**
 * Read a JSON file, or nothing when it is missing. A broken file is reported, not ignored silently.
 *
 * @param {string} file Path to read.
 * @param {string[]} problems Collected configuration problems.
 * @returns {object | undefined} Parsed content.
 */
function readJson(file, problems) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') problems.push(`${file} illisible (${error.message}) : ignore`);
    return undefined;
  }
}

/**
 * Load the effective configuration for a project.
 *
 * A rule may be set to a level string ("off") as a shorthand for {"level": "off"}.
 *
 * @param {string | null} projectRoot Project root, or null outside a project.
 * @returns {{config: object, problems: string[]}} Configuration and any problem met reading it.
 */
function loadConfig(projectRoot) {
  const problems = [];
  const sources = [path.join(os.homedir(), '.claude', 'guardrails.json')];
  if (projectRoot) {
    sources.push(path.join(projectRoot, '.claude', 'guardrails.json'), path.join(projectRoot, '.claude', 'guardrails.local.json'));
  }
  let config = DEFAULTS;
  for (const source of sources) {
    const raw = readJson(source, problems);
    if (raw === undefined) continue;
    if (!isPlainObject(raw)) {
      problems.push(`${source} n est pas un objet JSON : ignore`);
      continue;
    }
    if (raw.rules !== undefined && !isPlainObject(raw.rules)) {
      problems.push(`${source} : "rules" n est pas un objet : ignore`);
      delete raw.rules;
    }
    for (const [id, value] of Object.entries(raw.rules || {})) {
      if (typeof value === 'string') {
        raw.rules[id] = { level: value };
      } else if (!isPlainObject(value)) {
        // A rule must never be switched off by a typo: anything else than an object or a level blocks.
        problems.push(`${source} : regle ${id} invalide (${JSON.stringify(value)}) : bloque par defaut`);
        raw.rules[id] = { level: 'block' };
      }
    }
    config = merge(config, raw);
  }
  if (/^(1|true|yes)$/i.test(process.env.GUARDRAILS_DISABLED || '')) config = { ...config, enabled: false };
  for (const id of (process.env.GUARDRAILS_DISABLED_RULES || '').split(',').map((item) => item.trim()).filter(Boolean)) {
    config = merge(config, { rules: { [id]: { level: 'off' } } });
  }
  for (const [id, rule] of Object.entries(config.rules)) {
    if (!LEVELS.has(rule.level)) {
      problems.push(`niveau "${rule.level}" inconnu pour la regle ${id} : bloque par defaut`);
      rule.level = 'block';
    }
  }
  return { config, problems };
}

module.exports = { loadConfig, merge, DEFAULTS };
