import { MapEntry, defaultKeymaps } from "./mappings";

const leftKeys = [
  "q",
  "w",
  "e",
  "r",
  "t",
  "a",
  "s",
  "d",
  "f",
  "g",
  "z",
  "x",
  "c",
  "v",
];
const rightKeys = ["y", "u", "i", "o", "p", "h", "j", "k", "l", "b", "n", "m"];
const keyOrderBasedOnKeyboardLayout = [...leftKeys, ...rightKeys];
const sortedDefaultKeymaps: MapEntry[] = [];
for (let i = 0; i < keyOrderBasedOnKeyboardLayout.length; i++) {
  const keymap = defaultKeymaps.find(
    (e) => e.key === keyOrderBasedOnKeyboardLayout[i]
  );
  sortedDefaultKeymaps.push(keymap!);
}

const settingNames = {
  keymaps: "keymaps",
};

var app_settings: { [keymaps: string]: MapEntry[] } = {
  keymaps: [],
};

const keyDownBehavior = (event: KeyboardEvent) => {
  chrome.runtime.sendMessage(
    { type: "SEARCH_TABS", key: event.key, mappings: app_settings.keymaps },
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
      window.close();
    }
  );
};

const settingsDiv = document.getElementById("settings") as HTMLDivElement;
const toggleEditBtn = document.getElementById(
  "toggle-edit-btn"
) as HTMLButtonElement;

async function renderMappings() {
  const keymaps = app_settings[settingNames.keymaps];
  const list = document.getElementById("mapping-list") as HTMLUListElement;
  list.replaceChildren();
  for (const entry of keymaps) {
    const item = document.createElement("div");
    item.className = "mapping-item";

    const key = document.createElement("span");
    key.className = "key";
    key.textContent = entry.key;
    item.appendChild(key);

    const name = document.createElement("span");
    name.className = "name";
    name.textContent = entry.name;
    item.appendChild(name);
    list.appendChild(item);
  }
  return list;
}

async function renderEditSection() {
  const keymaps = app_settings[settingNames.keymaps];
  const form = document.getElementById("edit-keymaps") as HTMLDivElement;
  form.replaceChildren();

  for (const entry of keymaps) {
    const setting = document.createElement("div");
    setting.className = "keymap-entry";

    const key = document.createElement("label");
    key.className = "key";
    key.textContent = entry.key;
    setting.appendChild(key);

    const name = document.createElement("input");
    name.type = "text";
    name.placeholder = "Name";
    name.className = "name";
    name.id = "name";
    name.name = "name";
    name.value = entry.name;
    setting.appendChild(name);

    const searchText = document.createElement("input");
    searchText.className = "search-text";
    searchText.placeholder = "Search text";
    searchText.type = "text";
    searchText.id = "searchText";
    searchText.name = "searchText";
    searchText.value = entry.searchText;
    setting.appendChild(searchText);

    const url = document.createElement("input");
    url.className = "url";
    url.placeholder = "URL";
    url.type = "text";
    url.id = "url";
    url.name = "url";
    url.value = entry.url;
    setting.appendChild(url);

    form.appendChild(setting);
  }
}

function saveKeymaps() {
  const form = document.getElementById("edit-keymaps") as HTMLDivElement;
  const keymaps = app_settings[settingNames.keymaps];
  const settings = form.querySelectorAll(".keymap-entry");
  for (let i = 0; i < settings.length; i++) {
    const setting = settings[i] as HTMLDivElement;
    const key = setting.querySelector(".key") as HTMLLabelElement;
    const name = setting.querySelector(".name") as HTMLInputElement;
    const searchText = setting.querySelector(
      ".search-text"
    ) as HTMLInputElement;
    const url = setting.querySelector(".url") as HTMLInputElement;
    const entry = keymaps.find((e) => e.key === key.textContent);
    if (entry) {
      entry.name = name.value;
      entry.searchText = searchText.value;
      entry.url = url.value;
    }
  }
  app_settings[settingNames.keymaps] = keymaps;
  chrome.storage.sync.set(app_settings).then((_) => {
    console.log("saved keymaps");
  });
}

async function loadMappings() {
  console.log("loading settings...");
  var settings = await chrome.storage.sync.get([settingNames.keymaps]);
  if (settings) {
    app_settings[settingNames.keymaps] =
      (settings[settingNames.keymaps] as MapEntry[]) ?? sortedDefaultKeymaps;
  }

  console.log("render mappings...");
  await renderMappings();
}

async function enableKeymaps() {
  console.log("enabling keymaps...");
  document.body.addEventListener("keydown", keyDownBehavior);
}

async function disableKeymaps(reason: string) {
  console.log(`disabling keymaps because ${reason}...`);
  document.body.removeEventListener("keydown", keyDownBehavior);
}

async function loadExtension() {
  await loadMappings();

  const saveBtn = document.getElementById("save-btn")! as HTMLButtonElement;
  saveBtn.addEventListener("click", () => {
    saveKeymaps();
    renderMappings();
  });

  toggleEditBtn!.addEventListener("click", () => {
    if (toggleEditBtn!.value.indexOf("Edit") >= 0) {
      renderEditSection();
      toggleEditBtn!.value = "Hide";
      settingsDiv.style.display = "flex";
      disableKeymaps("editing keymaps");
      return;
    }
    toggleEditBtn!.value = "Edit keymaps";
    settingsDiv.style.display = "none";
    enableKeymaps();
  });

  settingsDiv.style.display = "none";

  enableKeymaps();
}

await loadExtension();
