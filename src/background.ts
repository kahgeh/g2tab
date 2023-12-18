import {
  LogRequest,
  REQ_LOG,
  REQ_PREVIOUS_TAB,
  REQ_SEARCH_TABS,
  Request,
  SearchTabRequest,
} from "./contracts";

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.storage.local.get(["recordedTabs"], (result) => {
    const newRecordedTabs =
      !result || !result.recordedTabs
        ? [activeInfo, null]
        : [activeInfo, result.recordedTabs[0]];

    console.log(`recording tabs ${JSON.stringify(newRecordedTabs)}`);
    chrome.storage.local.set({ recordedTabs: newRecordedTabs });
  });
});

chrome.runtime.onMessage.addListener((request) => {
  const { type, activeTab } = request as Request;
  if (type === REQ_LOG) {
    const { message } = request as LogRequest;
    console.log(message);
    return;
  }

  if (type === REQ_PREVIOUS_TAB) {
    chrome.storage.local.get(["recordedTabs"], (result) => {
      if (!result || !result.recordedTabs) {
        console.log("no recorded tabs");
        return;
      }
      const [first, second] = result.recordedTabs;
      if (!second) {
        console.log("no previous recorded tab");
        return;
      }
      const { tabId, windowId } =
        first && first.tabId !== activeTab.id ? first : second;
      chrome.tabs.update(tabId, { active: true }, () => {
        if (chrome.runtime.lastError) {
          console.log(
            `error activating tab reason : ${chrome.runtime.lastError.message}`
          );
          return;
        }
        chrome.windows.update(windowId, { focused: true }, () => {
          if (chrome.runtime.lastError) {
            console.log(
              `error activating window reason : ${chrome.runtime.lastError.message}`
            );
            return;
          }
        });
      });
      return;
    });
  }

  if (type === REQ_SEARCH_TABS) {
    const { key, mappings } = request as SearchTabRequest;
    const entry = mappings.find((e) => e.key === key);

    if (!entry) {
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
      if (matchingTabs.length > 0) {
        const tab = matchingTabs[0];
        chrome.tabs.update(tab.id!, { active: true }, () => {
          if (chrome.runtime.lastError) {
            console.log(
              `error activating tab reason : ${chrome.runtime.lastError.message}`
            );
            return;
          }
          chrome.windows.update(tab.windowId, { focused: true }, () => {
            if (chrome.runtime.lastError) {
              console.log(
                `error activating window reason : ${chrome.runtime.lastError.message}`
              );
              return;
            }
          });
        });
      } else {
        chrome.tabs.create({ url: entry.url });
      }
    });

    return true;
  }
});

self.addEventListener("unhandledrejection", (event) => {
  chrome.storage.local.set({ unhandledRejection: event.reason });
});

self.addEventListener("error", (event) => {
  chrome.storage.local.set({ error: event.message });
});
