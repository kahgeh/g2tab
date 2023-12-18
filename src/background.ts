import { SearchTabRequest } from "./contracts";

chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  console.log(JSON.stringify(request));
  const { key, mappings } = request as SearchTabRequest;
  if (request.type === "SEARCH_TABS") {
    const entry = mappings.find((e) => e.key === key);

    if (!entry) {
      sendResponse(null);
      return;
    }

    const query = entry.searchText.toLowerCase();
    chrome.windows.getAll({ populate: true }, (windows) => {
      const matchingTabs: chrome.tabs.Tab[] = [];

      for (const window of windows) {
        if (!window || !window.tabs) {
          continue;
        }
        for (const tab of window.tabs) {
          if (tab.url && tab.url.toLowerCase().includes(query)) {
            matchingTabs.push(tab);
          }
        }
      }

      sendResponse({ entry, matchingTabs });
    });

    return true;
  }
});
