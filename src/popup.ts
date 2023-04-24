import { mappings } from "./mappings";

async function renderMappings() {
  const list = document.getElementById("mapping-list") as HTMLUListElement;

  for (const entry of mappings) {
    const item = document.createElement("div");
    item.className = "mapping-item";

    const key = document.createElement("span");
    key.className = "key";
    key.textContent = entry.key;
    item.appendChild(key);

    const name = document.createElement("span");
    name.className = "name";
    name.textContent = entry.name;
    item.appendChild(name)
    list.appendChild(item);
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
