const MENU_ID = 'search-jellyfin';
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: MENU_ID, title: 'Search in Jellyfin', contexts: ['selection'] });
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === MENU_ID) openSearch(info.selectionText || '', tab?.windowId, tab?.id).catch(console.error);
});

async function openSearch(text, windowId, tabId) {
  const id = crypto.randomUUID();
  await chrome.storage.session.set({ [id]: { text, windowId, tabId } });
  try {
    await chrome.windows.create({
      url: chrome.runtime.getURL('search.html') + '?id=' + id,
      type: 'popup', width: 620, height: 620, focused: true
    });
  } catch (error) {
    await chrome.storage.session.remove(id);
    throw error;
  }
}
