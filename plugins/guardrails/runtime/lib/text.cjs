'use strict';
// Character checks shared by the rules: em dash, emoji, introduced occurrences, path globs.

const EM_DASH = String.fromCodePoint(0x2014);
const VARIATION_SELECTOR = 0xfe0f;
const PICTOGRAPHIC = /\p{Extended_Pictographic}/u;
// Pictographic code points below this are common typography (copyright, trademark, arrows), not emoji,
// unless followed by the emoji variation selector.
const FIRST_EMOJI_CODE_POINT = 0x2300;
const REGIONAL_INDICATORS = [0x1f1e6, 0x1f1ff];

/**
 * List the emoji of a text, in order, one entry per occurrence.
 *
 * @param {string} text Text to scan.
 * @param {string[]} allowed Emoji that are always permitted.
 * @returns {string[]} The forbidden emoji found.
 */
function emojis(text, allowed = []) {
  const found = [];
  const chars = [...(text || '')];
  for (let index = 0; index < chars.length; index++) {
    const char = chars[index];
    const code = char.codePointAt(0);
    const selected = chars[index + 1] && chars[index + 1].codePointAt(0) === VARIATION_SELECTOR;
    const flag = code >= REGIONAL_INDICATORS[0] && code <= REGIONAL_INDICATORS[1];
    const emoji = flag || (PICTOGRAPHIC.test(char) && (code >= FIRST_EMOJI_CODE_POINT || selected));
    if (emoji && !allowed.includes(char)) found.push(char);
  }
  return found;
}

/** @param {string} text Text to scan. @returns {number} Number of em dashes in it. */
function emDashes(text) {
  return (text || '').split(EM_DASH).length - 1;
}

/**
 * Occurrences present in the new text beyond those already in the old one, so editing a legacy file
 * that already holds some is not blocked, only adding more is.
 *
 * @param {string[]} before Occurrences in the old text.
 * @param {string[]} after Occurrences in the new text.
 * @returns {string[]} The introduced occurrences.
 */
function introduced(before, after) {
  const remaining = new Map();
  for (const item of before) remaining.set(item, (remaining.get(item) || 0) + 1);
  const result = [];
  for (const item of after) {
    const count = remaining.get(item) || 0;
    if (count > 0) remaining.set(item, count - 1);
    else result.push(item);
  }
  return result;
}

/**
 * Turn a glob (`**`, `*`, `?`) into an anchored regular expression on forward-slash paths.
 *
 * @param {string} glob Pattern relative to the project root.
 * @returns {RegExp} The matcher.
 */
function globToRegExp(glob) {
  let source = '';
  for (let index = 0; index < glob.length; index++) {
    const char = glob[index];
    if (char === '*' && glob[index + 1] === '*') {
      const slash = glob[index + 2] === '/';
      source += slash ? '(?:.*/)?' : '.*';
      index += slash ? 2 : 1;
    } else if (char === '*') {
      source += '[^/]*';
    } else if (char === '?') {
      source += '[^/]';
    } else {
      source += char.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    }
  }
  return new RegExp(`^${source}$`);
}

/**
 * Tell whether a path matches one of the globs. A glob without a slash matches the file name anywhere.
 *
 * @param {string} relativePath Path relative to the project root, any separator.
 * @param {string[]} globs Patterns.
 * @returns {boolean} True on the first match.
 */
function matchesAny(relativePath, globs) {
  const normalized = (relativePath || '').replace(/\\/g, '/').replace(/^\.\//, '');
  const name = normalized.split('/').pop();
  return (globs || []).some((glob) => {
    const matcher = globToRegExp(glob);
    return matcher.test(normalized) || (!glob.includes('/') && matcher.test(name));
  });
}

module.exports = { EM_DASH, emojis, emDashes, introduced, globToRegExp, matchesAny };
