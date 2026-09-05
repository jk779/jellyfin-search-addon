export const DEFAULT_URL = 'http://192.168.0.100:8096';

export function normalizeBase(value) {
  const url = new URL(value.trim());
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('Enter an HTTP or HTTPS address without credentials.');
  }
  url.search = '';
  url.hash = '';
  let path = url.pathname.replace(/\/+$/, '');
  path = path.replace(/\/web(?:\/index\.html)?$/i, '');
  url.pathname = path + '/web/';
  return url.href;
}

export function searchUrl(base, query) {
  const text = query.trim();
  if (!text) throw new Error('Select at least one word or enter a search.');
  return normalizeBase(base) + '#/search?' + new URLSearchParams({ query: text });
}

export function wordsFrom(text) {
  return text.normalize('NFC').match(/[\p{L}\p{N}][\p{L}\p{M}\p{N}]*/gu) || [];
}
