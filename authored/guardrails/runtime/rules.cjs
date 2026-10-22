'use strict';
// The guardrail rules. Each rule reads the hook context and returns findings (one string each); the
// configured level of the rule decides whether a finding blocks, asks or only warns.

const os = require('node:os');
const path = require('node:path');

const git = require('./lib/git.cjs');
const { writesFiles, optionValues, apiEndpoint, apiFields } = require('./lib/command-texts.cjs');
const { isProgram, programName, resolvePath } = require('./lib/shell.cjs');
const { emojis, emDashes, introduced, matchesAny, EM_DASH } = require('./lib/text.cjs');

const SECRET_PATTERNS = [
  ['AWS key', /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/],
  ['GitHub token', /\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{60,})\b/],
  ['Anthropic key', /\bsk-ant-[A-Za-z0-9_-]{20,}/],
  ['OpenAI key', /\bsk-(?:proj-)?[A-Za-z0-9_-]{32,}/],
  ['Stripe key', /\b(?:sk|rk)_live_[A-Za-z0-9]{20,}/],
  ['Google key', /\bAIza[0-9A-Za-z_-]{35}\b/],
  ['Slack token', /\bxox[abposr]-[A-Za-z0-9-]{10,}/],
  ['private key', /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP |ENCRYPTED )?PRIVATE KEY( BLOCK)?-----/],
  // The scheme is bounded: an unbounded one backtracks quadratically on long dotted lines.
  ['password in a URL', /\b[a-z][a-z0-9+.-]{0,20}:\/\/[^\s:/@'"]+:[^\s@'"$<{]{6,}@[^\s'"]+/i, localUrl],
  ['plaintext secret', /\b(?:password|passwd|secret|api[_-]?key|access[_-]?token|auth[_-]?token|client[_-]?secret)\b["']?\s*[:=]\s*["']([^"'\s]{12,})["']/i],
];
// Hosts of a local or compose development setup: a password in their URL is a dev default, not a secret.
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1', 'host.docker.internal']);
const PLACEHOLDER = /example|exemple|test|fake|mock|sample|fixture|changeme|change_me|dummy|placeholder|your[_-]|xxxx|\*\*\*|<[^>]+>|\$\{|\$\(|process\.env|os\.environ|getenv|env\(|secrets\.|vars\./i;
const ENV_FILE = /(^|\/)\.env(\.[^/]*)?$/;
const ENV_TEMPLATE = /\.(example|sample|template|dist|defaults)$/;
const LINT_CONFIG = [
  '.eslintrc*', 'eslint.config.*', 'biome.json', 'biome.jsonc', '.prettierrc*', 'prettier.config.*', 'ruff.toml', '.ruff.toml',
  '.flake8', 'mypy.ini', '.mypy.ini', 'pyrightconfig.json', '.golangci.*', '.stylelintrc*', 'stylelint.config.*', '.rubocop.yml',
  '.hadolint.yaml', '.yamllint*', '.markdownlint*', 'phpstan.neon*', 'phpcs.xml*', '.swiftlint.yml', 'detekt.yml',
];
const SUPPRESSIONS = /eslint-disable|@ts-ignore|@ts-nocheck|@ts-expect-error|biome-ignore|#\s*noqa|#\s*type:\s*ignore|#\s*pyright:\s*ignore|\/\/\s*nolint|@SuppressWarnings|# rubocop:disable|phpstan-ignore|swiftlint:disable|# hadolint ignore/;
const TAMPER_FILES = [
  '.claude/guardrails.json', '.claude/guardrails.local.json', '.claude/hooks/guardrails/**',
  '.claude/settings.json', '.claude/settings.local.json',
  // Guardrails wiring for other coding agents, written by setup.cjs or the ultime-skill installer.
  '.github/hooks/guardrails.json', '.opencode/plugins/guardrails.js', '.kilo/plugins/guardrails.js', '.kiro/hooks/guardrails.json',
];
const SECRET_STORES = [
  [/\bkubectl\b.*\bget\s+secrets?\b.*(?:-o|--output)[=\s]*['"]?(?:yaml|json|jsonpath|go-template|template|custom-columns)/, 'reading a Kubernetes secret'],
  [/\bkubectl\b.*\b(?:view-secret|ksd)\b/, 'reading a Kubernetes secret'],
  [/\/proc\/\S*\/environ/, 'reading a pod environment', { raw: true }],
  [/(?:^|[\s(])bws?\s+(?:get|list|export|unlock|serve|secret|run)\b/, 'Bitwarden vault'],
  [/(?:^|[\s(])op\s+(?:read|inject|run|item\s+get|document\s+get)\b/, '1Password vault'],
  [/(?:^|[\s(])(?:lpass|pass)\s+show\b/, 'password manager'],
  [/\bsecurity\s+find-(?:generic|internet)-password\b/, 'macOS keychain'],
  [/\bvault\s+(?:kv\s+get|read)\b/, 'Vault secrets'],
  [/\baws\s+secretsmanager\s+get-secret-value\b|\baws\s+ssm\s+get-parameters?\b.*--with-decryption/, 'AWS secrets'],
  [/\bgcloud\s+secrets\s+versions\s+access\b/, 'Google Cloud secrets'],
  [/\baz\s+keyvault\s+secret\s+(?:show|download)\b/, 'Azure Key Vault'],
  [/\b(?:doppler\s+secrets|infisical\s+(?:export|secrets))\b/, 'secrets manager'],
  [/\.(?:bash|zsh|sh)_history\b|\.zsh_sessions\b|\$\{?HISTFILE\b|ConsoleHost_history\.txt/i, 'shell history', { raw: true }],
  [/^\s*history(?:\s|$)|\bGet-History\b/, 'shell history'],
];
// Shells whose -c script may print the environment inside a pod.
const SHELLS = /^(sh|bash|zsh|ash|dash|ksh)$/;

/**
 * @typedef {object} Context
 * @property {string} event "pre" or "post".
 * @property {string} tool Tool name.
 * @property {object} input Tool input.
 * @property {string} cwd Working directory of the call.
 * @property {string | null} root Project root.
 * @property {object} config Effective configuration.
 * @property {object | null} shell analyzeCommand result for Bash and PowerShell.
 * @property {{path: string, rel: string, before: string, after: string} | null} file Text written by a file tool.
 * @property {() => {files: string[], added: {file: string, line: string}[]}} staged Staged changes of the commit's repository.
 */

/** @param {Context} ctx @param {string} id @returns {object} The configuration of a rule. */
function settings(ctx, id) {
  return ctx.config.rules[id] || {};
}

/** @param {Context} ctx @param {string} rel @param {string[]} [extra] @returns {boolean} True when the path is excluded. */
function excluded(ctx, rel, extra = []) {
  return matchesAny(rel, [...(ctx.config.exclude_paths || []), ...extra]);
}

/** Every text a shell command writes for humans, with a label. */
function shellTexts(ctx) {
  const texts = [];
  for (const { message } of ctx.shell.commits) if (message) texts.push(['commit message', message]);
  for (const text of ctx.shell.ghTexts) {
    if (text.title) texts.push([`title (gh ${text.kind})`, text.title]);
    if (text.body) texts.push([`body (gh ${text.kind})`, text.body]);
  }
  if (ctx.shell.writes) texts.push(['content written by the command', ctx.shell.written]);
  return texts;
}

/**
 * Tell whether a URL holding a password points to a local or compose host (no dot in the name,
 * localhost, loopback, host.docker.internal).
 *
 * @param {string} url Matched URL.
 * @returns {boolean} True for a development URL.
 */
function localUrl(url) {
  const authority = url.slice(url.indexOf('@', url.indexOf('://') + 3) + 1);
  const bracketed = /^\[([^\]]*)\]/.exec(authority);
  const host = (bracketed ? bracketed[1] : authority.split(/[:/?#]/)[0]).toLowerCase();
  return !host.includes('.') || LOCAL_HOSTS.has(host);
}

/** @param {string} text @returns {string[]} Labels of the secrets found, placeholders excepted. */
function secretsIn(text) {
  const found = [];
  for (const [label, pattern, exempt] of SECRET_PATTERNS) {
    const global = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`);
    for (const match of (text || '').matchAll(global)) {
      if (!PLACEHOLDER.test(match[0]) && !(exempt && exempt(match[0]))) {
        found.push(label);
        break;
      }
    }
  }
  return found;
}

function isEnvFile(rel) {
  return ENV_FILE.test(rel) && !ENV_TEMPLATE.test(rel);
}

/** @param {string} text Segment text. @returns {string} The text with quoted strings emptied. */
function unquoted(text) {
  return text.replace(/'[^']*'|"(?:\\.|[^"\\])*"/g, '""');
}

/**
 * Tell whether a kubectl exec segment prints the pod environment: env or printenv as the command
 * after `--`, directly or in a `sh -c` script.
 *
 * @param {string[]} list Words of the segment.
 * @returns {boolean} True when the pod environment is printed.
 */
function podEnvironment(list) {
  if (!isProgram(list[0], 'kubectl') || !list.includes('exec') || !list.includes('--')) return false;
  const remote = list.slice(list.indexOf('--') + 1);
  const program = programName(remote[0]);
  if (program === 'env' || program === 'printenv') return true;
  const flag = remote.indexOf('-c');
  return SHELLS.test(program) && flag > 0 && /(?:^|[;&|(]\s*)(?:env|printenv)\b/.test(remote[flag + 1] || '');
}

/**
 * Tell whether a git config call sets a key (a read, a listing or an unset does not).
 *
 * @param {string[]} args Words after `git config`.
 * @param {RegExp} key Key to look for.
 * @returns {boolean} True when the key is given a value.
 */
function configSets(args, key) {
  if (/^(get|list|unset|remove-section|rename-section)$/.test(args[0] || '')) return false;
  const reads = /^(--get|--get-all|--get-regexp|--get-urlmatch|--list|-l|--unset|--unset-all|--remove-section|--rename-section)$/;
  if (args.some((arg) => reads.test(arg))) return false;
  const index = args.findIndex((arg) => key.test(arg));
  return index >= 0 && index < args.length - 1;
}

const RULES = {
  'em-dash': {
    check(ctx) {
      const rule = settings(ctx, 'em-dash');
      const findings = [];
      if (ctx.file) {
        if (!excluded(ctx, ctx.file.rel, rule.exclude_paths) && emDashes(ctx.file.after) > emDashes(ctx.file.before)) {
          findings.push(`em dash added in ${ctx.file.rel}`);
        }
      }
      if (ctx.shell) {
        for (const [label, text] of shellTexts(ctx)) if (text.includes(EM_DASH)) findings.push(`em dash in the ${label}`);
        if (ctx.shell.commits.length) {
          const files = new Set(ctx.staged().added.filter(({ file, line }) => line.includes(EM_DASH) && !excluded(ctx, file, rule.exclude_paths)).map(({ file }) => file));
          if (files.size) findings.push(`em dash in the added lines of ${[...files].slice(0, 5).join(', ')}`);
        }
      }
      return [...new Set(findings)];
    },
    advice: 'Replace the em dash with a hyphen, a colon, parentheses or a sentence break.',
  },

  emoji: {
    check(ctx) {
      const rule = settings(ctx, 'emoji');
      const allowed = rule.allow || [];
      const findings = [];
      if (ctx.file && !excluded(ctx, ctx.file.rel, rule.allow_paths)) {
        const added = introduced(emojis(ctx.file.before, allowed), emojis(ctx.file.after, allowed));
        if (added.length) findings.push(`emoji added in ${ctx.file.rel}: ${[...new Set(added)].join(' ')}`);
      }
      if (ctx.shell) {
        for (const [label, text] of shellTexts(ctx)) {
          const found = emojis(text, allowed);
          if (found.length) findings.push(`emoji in the ${label}: ${[...new Set(found)].join(' ')}`);
        }
      }
      return findings;
    },
    advice: 'No emoji unless the user explicitly asks. If they want some, they allow them in .claude/guardrails.json (rules.emoji.allow or allow_paths).',
  },

  'protected-push': {
    check(ctx) {
      if (!ctx.shell) return [];
      const branches = settings(ctx, 'protected-push').branches || [];
      const findings = [];
      // A checkout or switch earlier in the same command changes the branch a later plain push uses.
      let switchedTo = null;
      for (const call of ctx.shell.gitCalls) {
        if (call.subcommand === 'checkout' || call.subcommand === 'switch') {
          if (call.args.includes('--')) continue;
          const created = call.args.findIndex((arg) => /^-[bBcC]$/.test(arg));
          // Without -b or -c, the operand is a branch only when one exists by that name; else it is a file.
          const operand = call.args.find((arg) => !arg.startsWith('-'));
          const branch = created >= 0 ? call.args[created + 1] : git.branchExists(call.cwd, operand) ? operand : null;
          if (branch) switchedTo = branch;
          continue;
        }
        if (call.subcommand !== 'push') continue;
        const options = call.args.filter((arg) => arg.startsWith('-'));
        if (options.some((o) => o === '--dry-run' || o === '-n')) continue;
        if (options.some((o) => o === '--mirror' || o === '--all')) {
          findings.push(`git push ${options.includes('--mirror') ? '--mirror' : '--all'} also pushes ${branches.join(', ')}`);
          continue;
        }
        const deleting = options.some((o) => o === '--delete' || o === '-d');
        const positional = call.args.filter((arg, index) => !arg.startsWith('-') && !/^(--repo|--push-option|-o|--receive-pack|--exec)$/.test(call.args[index - 1] || ''));
        const refspecs = positional.slice(1);
        let targets;
        if (refspecs.length === 0) {
          if (options.includes('--tags')) continue;
          targets = [switchedTo || git.pushTarget(call.cwd)];
        } else {
          targets = refspecs.map((spec) => {
            const clean = spec.replace(/^\+/, '');
            const destination = clean.includes(':') ? clean.slice(clean.indexOf(':') + 1) : clean;
            const resolved = destination === 'HEAD' || destination === '@' ? switchedTo || git.currentBranch(call.cwd) : destination;
            return (resolved || '').replace(/^refs\/heads\//, '');
          });
        }
        for (const target of targets) {
          if (target && branches.includes(target)) {
            findings.push(`${deleting ? 'deletion of' : 'push to'} the protected branch ${target}`);
          }
        }
      }
      return findings;
    },
    advice: 'Work on a dedicated branch and go through a PR. Only the user pushes to a protected branch.',
  },

  'no-verify': {
    check(ctx) {
      if (!ctx.shell) return [];
      const findings = [];
      for (const call of ctx.shell.gitCalls) {
        if (call.args.includes('--no-verify')) findings.push(`git ${call.subcommand} --no-verify`);
        if (call.subcommand === 'commit') {
          const flags = [];
          for (let index = 0; index < call.args.length; index++) {
            const arg = call.args[index];
            if (/^(-m|-F|-C|-c|--message|--file|--author|--date|--trailer|--fixup|--squash)$/.test(arg)) index++;
            else if (/^-[A-Za-z]+$/.test(arg)) flags.push(arg);
          }
          if (flags.some((flag) => flag.includes('n'))) findings.push('git commit -n (skips the hooks)');
        }
        if (call.config.some((setting) => /^core\.hookspath=/i.test(setting))) findings.push('git -c core.hooksPath');
        if (call.subcommand === 'config' && configSets(call.args, /^core\.hookspath$/i)) findings.push('git config core.hooksPath');
        if ((call.assignments || []).some((a) => /^(HUSKY=0|LEFTHOOK=0|SKIP=)/.test(a))) findings.push('variable that disables the git hooks');
      }
      return findings;
    },
    advice: 'Never bypass the git hooks: fix what they report.',
  },

  secrets: {
    check(ctx) {
      const rule = settings(ctx, 'secrets');
      const findings = [];
      if (ctx.file && !isEnvFile(ctx.file.rel) && !excluded(ctx, ctx.file.rel, rule.exclude_paths)) {
        const before = new Set(secretsIn(ctx.file.before));
        for (const label of secretsIn(ctx.file.after)) if (!before.has(label)) findings.push(`${label} in ${ctx.file.rel}`);
      }
      if (ctx.shell) {
        for (const label of secretsIn([ctx.shell.text, ...ctx.shell.heredocs.map((h) => h.body)].join('\n'))) findings.push(`${label} in plain text in the command`);
        if (ctx.shell.commits.length) {
          for (const { file, line } of ctx.staged().added) {
            if (isEnvFile(file) || excluded(ctx, file, rule.exclude_paths)) continue;
            for (const label of secretsIn(line)) findings.push(`${label} in the added lines of ${file}`);
          }
        }
      }
      return [...new Set(findings)];
    },
    advice: 'Secrets go in the project .env (ignored by git) and are read from environment variables. If this is a false positive, the user adds the path to rules.secrets.exclude_paths.',
  },

  'env-file': {
    check(ctx) {
      if (!ctx.shell) return [];
      const patterns = settings(ctx, 'env-file').patterns || [];
      const findings = [];
      for (const call of ctx.shell.gitCalls.filter((c) => c.subcommand === 'add')) {
        for (const arg of call.args.filter((a) => !a.startsWith('-'))) if (matchesAny(arg, patterns)) findings.push(`git add ${arg}`);
      }
      if (ctx.shell.commits.length) {
        for (const file of ctx.staged().files) if (matchesAny(file, patterns)) findings.push(`${file} is in the commit`);
      }
      return findings;
    },
    advice: 'A .env file is never committed: unstage it (git restore --staged) and add it to .gitignore.',
  },

  'conventional-commit': {
    check(ctx) {
      if (!ctx.shell) return [];
      const rule = settings(ctx, 'conventional-commit');
      const types = rule.types || [];
      const max = rule.max_subject || 72;
      const subjectFormat = new RegExp(`^(?:${types.join('|')})(?:\\([^)]+\\))?!?: (.+)$`);
      const findings = [];
      for (const { message } of ctx.shell.commits) {
        if (!message) continue;
        const subject = message.split('\n').find((line) => line.trim()) || '';
        const match = subject.match(subjectFormat);
        if (!match) {
          findings.push(`message not in the "type(scope): description" format (types: ${types.join(', ')})`);
          continue;
        }
        const length = [...subject].length;
        if (length > max) findings.push(`first line too long (${length} characters, ${max} at most)`);
        if (/^\p{Lu}\p{Ll}/u.test(match[1])) findings.push('lowercase description after the type ("feat: add x")');
        if (subject.endsWith('.')) findings.push('no trailing period on the first line');
      }
      return findings;
    },
    advice: 'Conventional Commits format, in English: "feat(scope): add the thing", 72 characters at most.',
  },

  'ai-marker': {
    check(ctx) {
      if (!ctx.shell) return [];
      const marker = settings(ctx, 'ai-marker').marker || '';
      const findings = [];
      for (const text of ctx.shell.ghTexts) {
        const creates = (text.kind === 'pr' || text.kind === 'issue') && (text.action === 'create' || text.action === 'edit');
        const apiCreates = text.kind === 'api' && /\/(pulls|issues)(\/\d+)?$/.test(text.endpoint);
        if ((creates || apiCreates) && text.title !== null && !text.title.trimEnd().endsWith(marker)) {
          findings.push(`title without ${marker} at the end: "${text.title.slice(0, 60)}"`);
        }
      }
      return findings;
    },
    advice: 'A PR or issue title written by the AI ends with the AI marker, and so does its body.',
  },

  'merge-approval': {
    check(ctx) {
      if (!ctx.shell) return [];
      const findings = [];
      const reason = 'merge or approval on behalf of the user, to be confirmed by them';
      for (const segment of ctx.shell.segments) {
        const list = segment.words;
        if (!isProgram(list[0], 'gh')) continue;
        const [, group, action] = list;
        if (group === 'pr' && action === 'merge') findings.push(`gh pr merge: ${reason}`);
        if (group === 'pr' && action === 'review' && list.slice(3).some((word) => word === '--approve' || word === '-a')) {
          findings.push(`gh pr review --approve: ${reason}`);
        }
        if (group !== 'api') continue;
        const args = list.slice(2);
        const endpoint = apiEndpoint(args);
        const fields = apiFields(segment);
        // gh api sends GET, or POST as soon as it has fields or an input body.
        const sends = Object.keys(fields).length > 0 || args.some((arg) => arg === '--input' || arg.startsWith('--input='));
        const method = (optionValues(args, ['--method'], ['X'])[0] || (sends ? 'POST' : 'GET')).toUpperCase();
        if (method === 'PUT' && /\/pulls\/[^/]+\/merge\/?$/.test(endpoint)) findings.push(`merge through the api (${endpoint}): ${reason}`);
        if (method === 'POST' && /\/pulls\/[^/]+\/reviews\/?$/.test(endpoint) && /^approve$/i.test(fields.event || '')) {
          findings.push(`PR approval through the api (${endpoint}): ${reason}`);
        }
        if (method === 'POST' && /\/actions\/runs\/[^/]+\/(?:pending_deployments|deployments|deployment_protection_rule)\/?$/.test(endpoint)) {
          findings.push(`deployment approval through the api (${endpoint}): ${reason}`);
        }
      }
      return findings;
    },
    advice: 'In autopilot, GitHub merges by itself (auto-merge) and production is approved in the GitHub environment: never merge or approve in place of the user.',
  },

  'prod-credentials': {
    check(ctx) {
      const rule = settings(ctx, 'prod-credentials');
      const prod = (rule.prod_patterns || []).map((p) => new RegExp(p, 'i'));
      const allowed = (rule.allowed_files || []).map((file) => path.resolve(file.replace(/^~(?=[\\/])/, os.homedir())));
      const outsideEnv = (file, base) => {
        const absolute = path.resolve(base, file.replace(/^~(?=[\\/]|$)/, os.homedir()));
        if (allowed.includes(absolute)) return false;
        return isEnvFile(absolute.replace(/\\/g, '/')) && (!ctx.root || path.relative(ctx.root, absolute).startsWith('..'));
      };
      const findings = [];
      if (ctx.tool === 'Read' && ctx.input.file_path) {
        const file = ctx.input.file_path;
        if (outsideEnv(file, ctx.cwd)) findings.push(`reading a .env outside the project: ${file}`);
        for (const [pattern, label] of SECRET_STORES) if (pattern.test(file)) findings.push(label);
      }
      if (ctx.shell) {
        for (const segment of ctx.shell.segments) {
          // Quoted text is a message or an argument, not a command: `-m "fix: pass show flag"` reads no store.
          // Path patterns (history files) still read the raw text, a quoted path is still that file.
          const bare = unquoted(segment.text);
          for (const [pattern, label, options] of SECRET_STORES) if (pattern.test(options && options.raw ? segment.text : bare)) findings.push(label);
          if (podEnvironment(segment.words)) findings.push('reading a pod environment');
          const program = (segment.words[0] || '').toLowerCase();
          const sources = segment.redirections.filter((r) => /^\d*<$/.test(r.op)).map((r) => r.target);
          if (/^(cat|less|more|head|tail|source|\.|grep|rg|sed|awk|type|get-content|gc|cp|scp)$/.test(program)) sources.push(...segment.words.slice(1));
          for (const word of sources) if (!word.startsWith('-') && outsideEnv(word, segment.cwd)) findings.push(`reading a .env outside the project: ${word}`);
          const tunnel = /^(ssh|autossh)$/.test(program) && segment.words.some((w) => /^-[A-Za-z]*[LDRW]/.test(w));
          const forward = /\bkubectl\b.*\bport-forward\b/.test(segment.text) || /^sshuttle$/.test(program);
          if ((tunnel || forward) && prod.some((p) => p.test(segment.text))) findings.push('tunnel to production');
        }
      }
      return [...new Set(findings)];
    },
    advice: 'Golden rule: only use the credentials the user configured for this project (its .env). Never fetch them from anywhere else, even when asked: stop and say so.',
  },

  'lint-config': {
    check(ctx) {
      if (!ctx.file) return [];
      const findings = [];
      if (matchesAny(ctx.file.rel, LINT_CONFIG)) findings.push(`quality configuration changed: ${ctx.file.rel}`);
      const before = (ctx.file.before.match(new RegExp(SUPPRESSIONS.source, 'g')) || []).length;
      const after = (ctx.file.after.match(new RegExp(SUPPRESSIONS.source, 'g')) || []).length;
      if (after > before) findings.push(`warning suppression added in ${ctx.file.rel}`);
      return findings;
    },
    advice: 'If it is to silence an error, revert and fix the code. Tightening or creating the configuration is fine; a justified exception carries its reason in a comment.',
  },

  'config-tamper': {
    check(ctx) {
      const findings = [];
      // Windows paths compare without case: c:\Users and C:\Users are the same file.
      const fold = (text) => (process.platform === 'win32' ? text.toLowerCase() : text);
      const home = fold(os.homedir().replace(/\\/g, '/'));
      const touches = (target, base = ctx.cwd) => {
        const absolute = resolvePath(base, target || '');
        const normalized = fold(absolute.replace(/\\/g, '/'));
        if (normalized.startsWith(`${home}/.claude/`) && /guardrails|settings(\.local)?\.json$/.test(normalized)) return true;
        const rel = ctx.root ? path.relative(ctx.root, absolute).replace(/\\/g, '/') : normalized;
        return matchesAny(rel, TAMPER_FILES);
      };
      if (ctx.file && touches(ctx.file.path)) findings.push(`change to ${ctx.file.rel}`);
      if (ctx.shell) {
        for (const segment of ctx.shell.segments) {
          const program = (segment.words[0] || '').toLowerCase().replace(/\.exe$/, '');
          const readOnly = /^(cat|less|more|head|tail|grep|rg|type|get-content|gc|jq|ls|dir|stat|wc|diff|git)$/.test(program);
          const mutating = /^(rm|mv|cp|del|remove-item|move-item|copy-item|chmod|truncate|ln)$/.test(program) || writesFiles(segment);
          // A script (node -e, python -c) can rewrite the guardrails configuration without a shell redirection.
          const scripted = !readOnly && /guardrails(\.local)?\.json|hooks[\\/]guardrails/.test(segment.text);
          const outputs = segment.redirections.filter((r) => /^[\d&*]?>/.test(r.op)).map((r) => r.target);
          const targets = [...segment.words.slice(1), ...outputs];
          if (scripted || (mutating && targets.some((target) => touches(target, segment.cwd)))) findings.push(`change to the guardrails configuration: ${segment.text.slice(0, 80)}`);
          if (/\bclaude\s+plugin\s+(?:disable|uninstall|remove)\b.*\bguardrails\b/.test(segment.text)) findings.push('disabling the guardrails plugin');
          if (/\bsetup\.cjs\s+uninstall-project\b/.test(segment.text)) findings.push('removing the project guardrails');
        }
      }
      return [...new Set(findings)];
    },
    advice: 'The guardrails only change with the explicit approval of the user.',
  },
};

module.exports = { RULES, secretsIn, isEnvFile, LINT_CONFIG };
