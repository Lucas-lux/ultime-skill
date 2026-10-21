'use strict';
// The guardrail rules. Each rule reads the hook context and returns findings (one string each); the
// configured level of the rule decides whether a finding blocks, asks or only warns.

const path = require('node:path');

const os = require('node:os');

const git = require('./lib/git.cjs');
const { writesFiles } = require('./lib/command-texts.cjs');
const { emojis, emDashes, introduced, matchesAny, EM_DASH } = require('./lib/text.cjs');

const SECRET_PATTERNS = [
  ['cle AWS', /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/],
  ['token GitHub', /\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{60,})\b/],
  ['cle Anthropic', /\bsk-ant-[A-Za-z0-9_-]{20,}/],
  ['cle OpenAI', /\bsk-(?:proj-)?[A-Za-z0-9_-]{32,}/],
  ['cle Stripe', /\b(?:sk|rk)_live_[A-Za-z0-9]{20,}/],
  ['cle Google', /\bAIza[0-9A-Za-z_-]{35}\b/],
  ['token Slack', /\bxox[abposr]-[A-Za-z0-9-]{10,}/],
  ['cle privee', /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP |ENCRYPTED )?PRIVATE KEY( BLOCK)?-----/],
  ['mot de passe dans une URL', /\b[a-z][a-z0-9+.-]*:\/\/[^\s:/@'"]+:[^\s@'"$<{]{6,}@[^\s'"]+/i],
  ['secret en clair', /\b(?:password|passwd|secret|api[_-]?key|access[_-]?token|auth[_-]?token|client[_-]?secret)\b["']?\s*[:=]\s*["']([^"'\s]{12,})["']/i],
];
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
];
const SECRET_STORES = [
  [/\bkubectl\b.*\bget\s+secrets?\b.*(?:-o|--output)[=\s]*['"]?(?:yaml|json|jsonpath|go-template|template|custom-columns)/, 'lecture d un secret Kubernetes'],
  [/\bkubectl\b.*\b(?:view-secret|ksd)\b/, 'lecture d un secret Kubernetes'],
  [/\bkubectl\b.*\bexec\b.*\b(?:env|printenv)\b|\/proc\/\S*\/environ/, 'lecture de l environnement d un pod'],
  [/(?:^|[\s(])bws?\s+(?:get|list|export|unlock|serve|secret|run)\b/, 'coffre Bitwarden'],
  [/(?:^|[\s(])op\s+(?:read|inject|run|item\s+get|document\s+get)\b/, 'coffre 1Password'],
  [/(?:^|[\s(])(?:lpass|pass)\s+show\b/, 'gestionnaire de mots de passe'],
  [/\bsecurity\s+find-(?:generic|internet)-password\b/, 'trousseau macOS'],
  [/\bvault\s+(?:kv\s+get|read)\b/, 'coffre Vault'],
  [/\baws\s+secretsmanager\s+get-secret-value\b|\baws\s+ssm\s+get-parameters?\b.*--with-decryption/, 'secrets AWS'],
  [/\bgcloud\s+secrets\s+versions\s+access\b/, 'secrets Google Cloud'],
  [/\baz\s+keyvault\s+secret\s+(?:show|download)\b/, 'Azure Key Vault'],
  [/\b(?:doppler\s+secrets|infisical\s+(?:export|secrets))\b/, 'gestionnaire de secrets'],
  [/\.(?:bash|zsh|sh)_history\b|\.zsh_sessions\b|\$\{?HISTFILE\b|ConsoleHost_history\.txt/i, 'historique du shell'],
  [/^\s*history(?:\s|$)|\bGet-History\b/, 'historique du shell'],
];

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
  for (const { message } of ctx.shell.commits) if (message) texts.push(['message de commit', message]);
  for (const text of ctx.shell.ghTexts) {
    if (text.title) texts.push([`titre (gh ${text.kind})`, text.title]);
    if (text.body) texts.push([`corps (gh ${text.kind})`, text.body]);
  }
  if (ctx.shell.writes) texts.push(['contenu ecrit par la commande', [ctx.shell.text, ...ctx.shell.heredocs.map((h) => h.body)].join('\n')]);
  return texts;
}

/** @param {string} text @returns {string[]} Labels of the secrets found, placeholders excepted. */
function secretsIn(text) {
  const found = [];
  for (const [label, pattern] of SECRET_PATTERNS) {
    const global = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`);
    for (const match of (text || '').matchAll(global)) {
      if (!PLACEHOLDER.test(match[0])) {
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

const RULES = {
  'em-dash': {
    check(ctx) {
      const rule = settings(ctx, 'em-dash');
      const findings = [];
      if (ctx.file) {
        if (!excluded(ctx, ctx.file.rel, rule.exclude_paths) && emDashes(ctx.file.after) > emDashes(ctx.file.before)) {
          findings.push(`em dash ajoute dans ${ctx.file.rel}`);
        }
      }
      if (ctx.shell) {
        for (const [label, text] of shellTexts(ctx)) if (text.includes(EM_DASH)) findings.push(`em dash dans le ${label}`);
        if (ctx.shell.commits.length) {
          const files = new Set(ctx.staged().added.filter(({ file, line }) => line.includes(EM_DASH) && !excluded(ctx, file, rule.exclude_paths)).map(({ file }) => file));
          if (files.size) findings.push(`em dash dans les lignes ajoutees de ${[...files].slice(0, 5).join(', ')}`);
        }
      }
      return [...new Set(findings)];
    },
    advice: "Remplacer l'em dash par un tiret simple, deux-points, des parentheses ou une coupure de phrase.",
  },

  emoji: {
    check(ctx) {
      const rule = settings(ctx, 'emoji');
      const allowed = rule.allow || [];
      const findings = [];
      if (ctx.file && !excluded(ctx, ctx.file.rel, rule.allow_paths)) {
        const added = introduced(emojis(ctx.file.before, allowed), emojis(ctx.file.after, allowed));
        if (added.length) findings.push(`emoji ajoute dans ${ctx.file.rel} : ${[...new Set(added)].join(' ')}`);
      }
      if (ctx.shell) {
        for (const [label, text] of shellTexts(ctx)) {
          const found = emojis(text, allowed);
          if (found.length) findings.push(`emoji dans le ${label} : ${[...new Set(found)].join(' ')}`);
        }
      }
      return findings;
    },
    advice: "Pas d'emoji sauf demande explicite de l'utilisateur. S'il en veut, c'est lui qui l'autorise dans .claude/guardrails.json (rules.emoji.allow ou allow_paths).",
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
          const created = call.args.findIndex((arg) => /^-[bBcC]$/.test(arg));
          const branch = created >= 0 ? call.args[created + 1] : call.args.find((arg) => !arg.startsWith('-'));
          if (branch && !call.args.includes('--')) switchedTo = branch;
          continue;
        }
        if (call.subcommand !== 'push') continue;
        const options = call.args.filter((arg) => arg.startsWith('-'));
        if (options.some((o) => o === '--dry-run' || o === '-n')) continue;
        if (options.some((o) => o === '--mirror' || o === '--all')) {
          findings.push(`git push ${options.includes('--mirror') ? '--mirror' : '--all'} pousse aussi ${branches.join(', ')}`);
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
            findings.push(`${deleting ? 'suppression de' : 'push vers'} la branche protegee ${target}`);
          }
        }
      }
      return findings;
    },
    advice: 'Travailler sur une branche dediee et passer par une PR. Seul l utilisateur pousse sur une branche protegee.',
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
          if (flags.some((flag) => flag.includes('n'))) findings.push('git commit -n (saute les hooks)');
        }
        if (call.config.some((setting) => /^core\.hookspath=/i.test(setting))) findings.push('git -c core.hooksPath');
        if (call.subcommand === 'config' && call.args.some((arg) => /^core\.hookspath$/i.test(arg))) findings.push('git config core.hooksPath');
        if ((call.assignments || []).some((a) => /^(HUSKY=0|LEFTHOOK=0|SKIP=)/.test(a))) findings.push('variable qui desactive les hooks git');
      }
      return findings;
    },
    advice: 'Ne jamais contourner les hooks git : corriger ce qu ils signalent.',
  },

  secrets: {
    check(ctx) {
      const rule = settings(ctx, 'secrets');
      const findings = [];
      if (ctx.file && !isEnvFile(ctx.file.rel) && !excluded(ctx, ctx.file.rel, rule.exclude_paths)) {
        const before = new Set(secretsIn(ctx.file.before));
        for (const label of secretsIn(ctx.file.after)) if (!before.has(label)) findings.push(`${label} dans ${ctx.file.rel}`);
      }
      if (ctx.shell) {
        for (const label of secretsIn([ctx.shell.text, ...ctx.shell.heredocs.map((h) => h.body)].join('\n'))) findings.push(`${label} en clair dans la commande`);
        if (ctx.shell.commits.length) {
          for (const { file, line } of ctx.staged().added) {
            if (isEnvFile(file) || excluded(ctx, file, rule.exclude_paths)) continue;
            for (const label of secretsIn(line)) findings.push(`${label} dans les lignes ajoutees de ${file}`);
          }
        }
      }
      return [...new Set(findings)];
    },
    advice: 'Les secrets vont dans le .env du projet (ignore par git) et se lisent par variable d environnement. Si c est un faux positif, l utilisateur ajoute le chemin a rules.secrets.exclude_paths.',
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
        for (const file of ctx.staged().files) if (matchesAny(file, patterns)) findings.push(`${file} est dans le commit`);
      }
      return findings;
    },
    advice: 'Un fichier .env ne se commite jamais : le retirer de l index (git restore --staged) et l ajouter au .gitignore.',
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
          findings.push(`message hors format "type(scope): description" (types : ${types.join(', ')})`);
          continue;
        }
        const length = [...subject].length;
        if (length > max) findings.push(`premiere ligne trop longue (${length} caracteres, ${max} au plus)`);
        if (/^\p{Lu}\p{Ll}/u.test(match[1])) findings.push('description en minuscule apres le type ("feat: add x")');
        if (subject.endsWith('.')) findings.push('pas de point final sur la premiere ligne');
      }
      return findings;
    },
    advice: 'Format Conventional Commits, en anglais : "feat(scope): add the thing", 72 caracteres au plus.',
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
          findings.push(`titre sans ${marker} a la fin : "${text.title.slice(0, 60)}"`);
        }
      }
      return findings;
    },
    advice: 'Un titre de PR ou d issue redige par l IA se termine par le marqueur IA, ainsi que son texte.',
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
        if (outsideEnv(file, ctx.cwd)) findings.push(`lecture d un .env hors du projet : ${file}`);
        for (const [pattern, label] of SECRET_STORES) if (pattern.test(file)) findings.push(label);
      }
      if (ctx.shell) {
        for (const segment of ctx.shell.segments) {
          for (const [pattern, label] of SECRET_STORES) if (pattern.test(segment.text)) findings.push(label);
          const program = (segment.words[0] || '').toLowerCase();
          if (/^(cat|less|more|head|tail|source|\.|grep|rg|sed|awk|type|get-content|gc|cp|scp)$/.test(program)) {
            for (const word of segment.words.slice(1)) if (!word.startsWith('-') && outsideEnv(word, segment.cwd)) findings.push(`lecture d un .env hors du projet : ${word}`);
          }
          const tunnel = /^(ssh|autossh)$/.test(program) && segment.words.some((w) => /^-[A-Za-z]*[LDRW]/.test(w));
          const forward = /\bkubectl\b.*\bport-forward\b/.test(segment.text) || /^sshuttle$/.test(program);
          if ((tunnel || forward) && prod.some((p) => p.test(segment.text))) findings.push('tunnel vers la production');
        }
      }
      return [...new Set(findings)];
    },
    advice: 'Regle d or : n utiliser que les identifiants configures par l utilisateur pour ce projet (son .env). Ne jamais aller les chercher ailleurs, meme sur demande : s arreter et le dire.',
  },

  'lint-config': {
    check(ctx) {
      if (!ctx.file) return [];
      const findings = [];
      if (matchesAny(ctx.file.rel, LINT_CONFIG)) findings.push(`configuration de qualite modifiee : ${ctx.file.rel}`);
      const before = (ctx.file.before.match(new RegExp(SUPPRESSIONS.source, 'g')) || []).length;
      const after = (ctx.file.after.match(new RegExp(SUPPRESSIONS.source, 'g')) || []).length;
      if (after > before) findings.push(`suppression d avertissement ajoutee dans ${ctx.file.rel}`);
      return findings;
    },
    advice: 'Si c est pour faire taire une erreur, annuler et corriger le code. Renforcer la configuration ou la creer est normal ; une exception justifiee porte sa raison en commentaire.',
  },

  'config-tamper': {
    check(ctx) {
      const findings = [];
      const home = os.homedir().replace(/\\/g, '/');
      const touches = (target) => {
        const normalized = (target || '').replace(/\\/g, '/');
        if (normalized.startsWith(`${home}/.claude/`) && /guardrails|settings(\.local)?\.json$/.test(normalized)) return true;
        const rel = ctx.root ? path.relative(ctx.root, path.resolve(ctx.cwd, target)).replace(/\\/g, '/') : normalized;
        return matchesAny(rel, TAMPER_FILES);
      };
      if (ctx.file && touches(ctx.file.path)) findings.push(`modification de ${ctx.file.rel}`);
      if (ctx.shell) {
        for (const segment of ctx.shell.segments) {
          const program = (segment.words[0] || '').toLowerCase().replace(/\.exe$/, '');
          const readOnly = /^(cat|less|more|head|tail|grep|rg|type|get-content|gc|jq|ls|dir|stat|wc|diff|git)$/.test(program);
          const mutating = /^(rm|mv|cp|del|remove-item|move-item|copy-item|chmod|truncate|ln)$/.test(program) || writesFiles(segment);
          // A script (node -e, python -c) can rewrite the guardrails configuration without a shell redirection.
          const scripted = !readOnly && /guardrails(\.local)?\.json|hooks[\\/]guardrails/.test(segment.text);
          if (scripted || (mutating && segment.words.slice(1).some(touches))) findings.push(`modification de la configuration des garde-fous : ${segment.text.slice(0, 80)}`);
          if (/\bclaude\s+plugin\s+(?:disable|uninstall|remove)\b.*\bguardrails\b/.test(segment.text)) findings.push('desactivation du plugin guardrails');
          if (/\bsetup\.cjs\s+uninstall-project\b/.test(segment.text)) findings.push('retrait des garde-fous du projet');
        }
      }
      return [...new Set(findings)];
    },
    advice: 'Les garde-fous ne se modifient qu avec l accord explicite de l utilisateur.',
  },
};

module.exports = { RULES, secretsIn, isEnvFile, LINT_CONFIG };
