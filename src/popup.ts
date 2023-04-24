import { mappings } from "./mappings";

async function renderMappings() {
  const list = document.getElementById("mapping-list") as HTMLUListElement;

  for (const entry of mappings) {
    const listItem = document.createElement("li");
    listItem.textContent = `${entry.key}: ${entry.name}`;
    list.appendChild(listItem);
  }
}

renderMappings();
document.body.addEventListener("keydown", (event) => {
  chrome.runtime.sendMessage(
    { type: "SEARCH_TABS", key: event.key },
    (response) => {
      if (!response) return;

      const { entry, matchingTabs } = response;

      if (matchingTabs.length > 0) {
        const tab = matchingTabs[0];
        chrome.windows.update(tab.windowId, { focused: true });
        chrome.tabs.update(tab.id, { active: true });
      } else {
        chrome.tabs.create({ url: entry.url });
      }
    }
  );
});
