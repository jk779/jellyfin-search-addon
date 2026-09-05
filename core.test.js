import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeBase, searchUrl, wordsFrom } from './core.js';
test('normalizes server, web and copied search addresses', () => {
  for (const suffix of ['', '/', '/web', '/web/', '/web/index.html', '/web/#/search?query=old']) {
    assert.equal(normalizeBase('http://192.168.0.100:8096' + suffix), 'http://192.168.0.100:8096/web/');
  }
  assert.equal(normalizeBase('https://example.com/jellyfin/web/#/search?query=old'), 'https://example.com/jellyfin/web/');
});
test('uses plus for spaces and safely encodes reserved characters and Unicode', () => {
  const result = searchUrl('http://192.168.0.100:8096', ' Anna Müller & C++ #1 ');
  assert.equal(result, 'http://192.168.0.100:8096/web/#/search?query=Anna+M%C3%BCller+%26+C%2B%2B+%231');
  assert.equal(new URLSearchParams(result.split('?')[1]).get('query'), 'Anna Müller & C++ #1');
});
test('rejects empty searches and unsafe or malformed addresses', () => {
  assert.throws(() => searchUrl('https://example.com', '  '));
  for (const value of ['javascript:alert(1)', 'file:///tmp/a', 'not a URL', 'https://user:pass@example.com']) assert.throws(() => normalizeBase(value));
});
test('splits whitespace and punctuation while preserving letters and order', () => {
  assert.deepEqual(wordsFrom('  Anna\tMüller\nJean-Luc  '), ['Anna', 'Müller', 'Jean', 'Luc']);
  assert.deepEqual(wordsFrom('   '), []);
});

test('cleans selected titles without joining adjacent words', () => {
  assert.deepEqual(wordsFrom('Nature Documentary, Ocean Wildlife'), ['Nature', 'Documentary', 'Ocean', 'Wildlife']);
  assert.deepEqual(wordsFrom('Anna,Nature / [Interview]_2026 & 1080p! 🎬'), ['Anna', 'Nature', 'Interview', '2026', '1080p']);
  assert.deepEqual(wordsFrom('... & 🎬'), []);
  assert.deepEqual(wordsFrom('Mu\u0308ller José 東京'), ['Müller', 'José', '東京']);
});
