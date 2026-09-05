import { DEFAULT_URL, normalizeBase } from './core.js';
const input = document.getElementById('url');
const status = document.getElementById('status');
chrome.storage.local.get({ jellyfinUrl: DEFAULT_URL }).then((data) => { input.value = data.jellyfinUrl; }).catch((error) => { status.textContent = error.message; });
document.getElementById('settings-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const jellyfinUrl = normalizeBase(input.value);
    await chrome.storage.local.set({ jellyfinUrl });
    input.value = jellyfinUrl;
    status.className = 'success'; status.textContent = 'Settings saved.';
  } catch (error) { status.className = 'error'; status.textContent = error.message; }
});
