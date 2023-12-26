import { MapEntry, defaultKeymaps } from "./mappings";
import {
  LogRequest,
  REQ_GET_KEYMAPS,
  REQ_LOG,
  REQ_PREVIOUS_TAB,
  REQ_SAVE_KEYMAPS,
  REQ_NAV_OR_OPEN_TAB,
  Request,
  SaveKeymapsRequest,
  SearchTabRequest,
  REQ_MARK_AS_SCRATCH,
  REQ_NAV_TO_SCRATCH,
} from "./contracts";
import { nameof } from "./utils";

type TabInfo = { id: number; windowId: number };
interface AppSettings {
  keymaps: MapEntry[];
  currentTab: TabInfo | null;
  scratchWindowId: number | null;
}

var app_settings: AppSettings = {
  keymaps: [],
  currentTab: null,
  scratchWindowId: null,
};

async function loadAppSettings() {
  var settings = await chrome.storage.sync.get([
    nameof<AppSettings>("keymaps"),
    nameof<AppSettings>("scratchWindowId"),
  ]);
  if (!settings) {
    console.log("no settings found");
    return;
  }
  const { scratchWindowId, keymaps } = settings;
  if (scratchWindowId) {
    chrome.windows.get(scratchWindowId, (_) => {
      app_settings.scratchWindowId = scratchWindowId;
    });
  }
  app_settings.keymaps = (keymaps as MapEntry[]) ?? defaultKeymaps;
}

function activateTab(id: number, windowId: number) {
  chrome.tabs.update(id, { active: true }, () => {
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
}

chrome.runtime.onStartup.addListener(async () => {
  await loadAppSettings();
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  app_settings.currentTab = {
    id: activeInfo.tabId,
    windowId: activeInfo.windowId,
  };
  chrome.storage.local.get(["recordedTabs"], (result) => {
    const newRecordedTabs =
      !result || !result.recordedTabs
        ? [activeInfo, null]
        : [activeInfo, result.recordedTabs[0]];

    console.log(`recording tabs ${JSON.stringify(newRecordedTabs)}`);
    chrome.storage.local.set({ recordedTabs: newRecordedTabs });
  });
});

chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
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
      const [oldTab, olderTab] = result.recordedTabs;
      if (!olderTab) {
        console.log("no previous recorded tab");
        return;
      }

      // note: when the active tab is switched to another window, it seems that the `chrome.tab.onActivated`
      // event does not, either get triggered or there is some bug that prevents the right tab from being recorded.
      // in these scenario, the last recorded tab is the effective previous tab
      const { tabId, windowId } =
        oldTab && oldTab.tabId !== activeTab.id ? oldTab : olderTab;
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
    return;
  }

  if (type === REQ_MARK_AS_SCRATCH) {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
      if (!tabs || tabs.length === 0) {
        console.log("no active tab");
        return;
      }
      const currentTab = tabs[0];
      console.log(
        `marking window with current tab (${currentTab.id}) ${currentTab.title} as scratch`
      );
      app_settings.scratchWindowId = currentTab.windowId;
      chrome.storage.sync.set(app_settings);
    });
    return;
  }

  if (type === REQ_NAV_TO_SCRATCH) {
    const { scratchWindowId } = app_settings;
    if (!scratchWindowId) {
      console.log("no scratch window");
      return;
    }

    chrome.tabs.query({ windowId: scratchWindowId! }, (tabs) => {
      console.log("a tab in scratch window found, navigating to it");
      const tab = tabs[0];
      activateTab(tab.id!, tab.windowId);
      return;
    });
  }

  if (type === REQ_NAV_OR_OPEN_TAB) {
    const mappings = app_settings.keymaps;
    const { key } = request as SearchTabRequest;
    const entry = mappings.find((e) => e.key === key);

    if (!entry) {
      return;
    }

    const searchText = entry.searchText.toLowerCase();
    const otherEntries = mappings.filter((e) => e.key !== key);
    chrome.windows.getAll({ populate: true }, (windows) => {
      const matchingTabs: chrome.tabs.Tab[] = [];

      for (const window of windows) {
        if (!window || !window.tabs) {
          continue;
        }
        for (const tab of window.tabs) {
          if (tab.url && tab.url.toLowerCase().includes(searchText)) {
            matchingTabs.push(tab);
          }
        }
      }

      if (matchingTabs.length > 0) {
        // exclude tabs where the url matches exactly to the url of other entries
        const tabsMatchingSearchTextButNotOtherEntriesExactUrl =
          matchingTabs.filter(
            (t) => !otherEntries.some((e) => e.url === t.url)
          );

        // activate the first tab that matches the search text but not the url of other entries
        if (tabsMatchingSearchTextButNotOtherEntriesExactUrl.length > 0) {
          const tab = tabsMatchingSearchTextButNotOtherEntriesExactUrl[0];
          activateTab(tab.id!, tab.windowId);
          return;
        }
      }
      chrome.tabs.create({ url: entry.url });
    });

    return;
  }

  if (type === REQ_GET_KEYMAPS) {
    if (app_settings.keymaps.length > 0) {
      console.log("using cached settings");
      sendResponse({ ...app_settings });
      return true;
    }

    //todo: replace this with loadSettings
    chrome.storage.sync.get([nameof<AppSettings>("keymaps")], (settings) => {
      console.log("loading settings...");
      if (!settings || !settings.keymaps || settings.keymaps.length === 0) {
        app_settings.keymaps = defaultKeymaps;
        sendResponse({ ...app_settings });
        console.log("no settings found, using default");
        return true;
      }

      app_settings.keymaps = settings.keymaps;
      try {
        sendResponse({ ...app_settings });
        return true;
      } catch (e) {
        console.error(e);
      }
    });
    return true;
  }

  if (type === REQ_SAVE_KEYMAPS) {
    const { keymaps } = request as SaveKeymapsRequest;
    chrome.storage.sync.set({ keymaps }, () => {
      console.log("saved keymaps");
      app_settings.keymaps = keymaps;
      sendResponse({ keymaps });
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
