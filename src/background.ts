//@ts-ignore
interface TabEntry {
  name: string;
  searchText: string;
  key: string;
  url: string;
}

let mappings: TabEntry[];

//@ts-ignore
async function loadMappings(): Promise<TabEntry[]> {
  try {
    const url = chrome.runtime.getURL("config/mappings.json");
    const response = await fetch(url);
    mappings = await response.json();
  } catch (e) {
    console.error("cannot load mappings file", e);
  }
}

loadMappings();

chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  if (request.type === "SEARCH_TABS") {
    const entry = mappings.find((e) => e.key === request.key);

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
