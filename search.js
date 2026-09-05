import { DEFAULT_URL, normalizeBase, searchUrl, wordsFrom } from './core.js';
const $ = (id) => document.getElementById(id);
const id = new URLSearchParams(location.search).get('id');
let sourceWindowId;
let sourceTabId;
let base;
let checkboxes = [];

$('settings').addEventListener('click', () => chrome.runtime.openOptionsPage());
function updateQuery() {
  $('query').value = checkboxes.filter((box) => box.checked).map((box) => box.value).join(' ');
  updateSubmit();
}
function updateSubmit() { $('submit').disabled = !$('query').value.trim() || !base; }
$('query').addEventListener('input', updateSubmit);
for (const [name, checked] of [['all', true], ['none', false]]) {
  $(name).addEventListener('click', () => { checkboxes.forEach((box) => { box.checked = checked; }); updateQuery(); });
}
async function loadBase() {
  const stored = await chrome.storage.local.get({ jellyfinUrl: DEFAULT_URL });
  base = normalizeBase(stored.jellyfinUrl);
  $('destination').textContent = 'Destination: ' + base;
  updateSubmit();
}
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.jellyfinUrl) loadBase().catch(showError);
});
function showError(error) { $('error').textContent = error.message; }
async function init() {
  await loadBase();
  let text = '';
  if (id) {
    const data = (await chrome.storage.session.get(id))[id];
    text = data?.text || '';
    sourceWindowId = data?.windowId;
    sourceTabId = data?.tabId;
    await chrome.storage.session.remove(id);
  } else {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    sourceTabId = tab?.id;
    sourceWindowId = tab?.windowId;
  }
  for (const word of wordsFrom(text)) {
    const label = document.createElement('label');
    label.className = 'word';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox'; checkbox.checked = false; checkbox.value = word;
    checkbox.addEventListener('change', updateQuery);
    label.append(checkbox, document.createTextNode(word));
    $('words').append(label); checkboxes.push(checkbox);
  }
  $('empty').hidden = checkboxes.length > 0;
  $('all').disabled = $('none').disabled = !checkboxes.length;
  updateQuery();
  $('query').focus();
}
$('search-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  $('error').textContent = '';
  $('submit').disabled = true;
  try {
    await loadBase();
    $('submit').disabled = true;
    const url = searchUrl(base, $('query').value);
    let sourceTab;
    if (sourceTabId !== undefined) {
      try { sourceTab = await chrome.tabs.get(sourceTabId); } catch { /* The source tab may have closed. */ }
    }
    let targetWindow;
    if (sourceTab) {
      targetWindow = { id: sourceTab.windowId };
    } else if (sourceWindowId !== undefined) {
      try { targetWindow = await chrome.windows.get(sourceWindowId); } catch { /* The source window may have closed. */ }
    } else {
      targetWindow = await chrome.windows.getLastFocused({ windowTypes: ['normal'] });
    }
    if (targetWindow) {
      const placement = sourceTab ? { index: sourceTab.index + 1, openerTabId: sourceTab.id } : {};
      await chrome.tabs.create({ url, active: true, windowId: targetWindow.id, ...placement });
      await chrome.windows.update(targetWindow.id, { focused: true });
    } else {
      await chrome.windows.create({ url, type: 'normal' });
    }
    window.close();
  } catch (error) { showError(error); updateSubmit(); }
});
$('query').addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    if (!$('submit').disabled) $('search-form').requestSubmit();
  }
});
init().catch(showError);
