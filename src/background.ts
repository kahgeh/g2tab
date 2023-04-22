chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "SEARCH_TABS") {
    const query = request.query.toLowerCase();
    chrome.windows.getAll({ populate: true }, (windows) => {
      const matchingTabs = [];

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

      sendResponse(matchingTabs);
    });

    return true; // Required for async sendResponse
  }
});
