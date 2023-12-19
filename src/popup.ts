import {
  REQ_GET_KEYMAPS,
  REQ_PREVIOUS_TAB,
  REQ_SAVE_KEYMAPS,
  REQ_SEARCH_TABS,
} from "./contracts";
import { MapEntry } from "./mappings";

export const navigateToTabKeyDownBehavior = (event: KeyboardEvent) => {
  console.log(`key down "${event.key}"`);
  let queryOptions = { active: true, lastFocusedWindow: true };
  // `tab` will either be a `tabs.Tab` instance or `undefined`.
  chrome.tabs.query(queryOptions).then(([activeTab]) => {
    if (event.key === " ") {
      chrome.runtime.sendMessage({ type: REQ_PREVIOUS_TAB, activeTab });
      return;
    }

    chrome.runtime.sendMessage({
      type: REQ_SEARCH_TABS,
      key: event.key,
      activeTab,
    });
  });
};

// function createSwitchKeymapsFn(keymapLookup: {
//   [key: string]: (event: KeyboardEvent) => void;
// }) {
//   let currentListener = keymapLookup["g2tab"] as (event: KeyboardEvent) => void;
//   return (keymapName: string) => {
//     document.body.removeEventListener("keydown", currentListener);
//     currentListener = keymapLookup[keymapName];
//     document.body.addEventListener("keydown", currentListener);
//   };
// }
// const switchKeymaps = createSwitchKeymapsFn({
//   g2tab: navigateToTabKeyDownBehavior,
//   editSettings: editSettingsKeyDownBehavior,
// });
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
  "b",
];
const rightKeys = ["y", "u", "i", "o", "p", "h", "j", "k", "l", "n", "m"];
const qwertyLayout = [...leftKeys, ...rightKeys];

function sortBasedOnKeyboard(keymaps: MapEntry[], layout: string[]) {
  if (keymaps.length !== layout.length) {
    console.log(
      "keymaps and layout are not of the same length, no sorting done"
    );
    return keymaps;
  }
  const sortedKeymaps: MapEntry[] = [];
  for (let i = 0; i < layout.length; i++) {
    const keymap = keymaps.find((e) => e.key === layout[i]);
    sortedKeymaps.push(keymap!);
  }
  return sortedKeymaps;
}

interface AppSettings {
  keymaps: MapEntry[];
}

var app_settings: AppSettings = {
  keymaps: [],
};

const settingsDiv = document.getElementById("settings") as HTMLDivElement;
const toggleEditBtn = document.getElementById(
  "toggle-edit-btn"
) as HTMLButtonElement;

function renderMappings(keymaps: MapEntry[]) {
  const list = document.getElementById("mapping-list") as HTMLUListElement;
  list.replaceChildren();
  var sortedKeymaps = sortBasedOnKeyboard(keymaps, qwertyLayout);
  for (const entry of sortedKeymaps) {
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

async function renderEditSection(keymaps: MapEntry[]) {
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

async function saveKeymaps(keymaps: MapEntry[]) {
  const newKeymaps = [...keymaps];
  const form = document.getElementById("edit-keymaps") as HTMLDivElement;
  const settings = form.querySelectorAll(".keymap-entry");
  for (let i = 0; i < settings.length; i++) {
    const setting = settings[i] as HTMLDivElement;
    const key = setting.querySelector(".key") as HTMLLabelElement;
    const name = setting.querySelector(".name") as HTMLInputElement;
    const searchText = setting.querySelector(
      ".search-text"
    ) as HTMLInputElement;
    const url = setting.querySelector(".url") as HTMLInputElement;
    const entry = newKeymaps.find((e) => e.key === key.textContent);
    if (entry) {
      entry.name = name.value;
      entry.searchText = searchText.value;
      entry.url = url.value;
    }
  }
  await chrome.runtime.sendMessage({ type: REQ_SAVE_KEYMAPS, keymaps });
  return newKeymaps;
}

async function loadMappings() {
  console.log("loading settings...");
  const settings = await chrome.runtime.sendMessage({ type: REQ_GET_KEYMAPS });
  console.log("render mappings...");
  renderMappings(settings.keymaps);
}

function enableKeymaps() {
  console.log("enabling keymaps...");
  document.body.addEventListener("keydown", navigateToTabKeyDownBehavior);
}

function disableKeymaps(reason: string) {
  console.log(`disabling keymaps because ${reason}...`);
  document.body.removeEventListener("keydown", navigateToTabKeyDownBehavior);
}

async function loadExtension() {
  console.log("loading extension popup...");
  await loadMappings();

  const saveBtn = document.getElementById("save-btn")! as HTMLButtonElement;
  saveBtn.addEventListener("click", async () => {
    const settings = await chrome.runtime.sendMessage({
      type: REQ_GET_KEYMAPS,
    });
    const newKeymaps = await saveKeymaps(settings.keymaps);
    console.log("new keymaps are", newKeymaps);
    renderMappings(newKeymaps);
  });

  // const resetBtn = document.getElementById("reset-btn")! as HTMLButtonElement;
  // resetBtn.addEventListener("click", () => {
  //   app_settings.keymaps = defaultKeymaps;
  //   renderMappings();
  // });

  toggleEditBtn!.addEventListener("click", async () => {
    if (toggleEditBtn!.value.indexOf("Edit") >= 0) {
      const settings = await chrome.runtime.sendMessage({
        type: REQ_GET_KEYMAPS,
      });
      renderEditSection(settings.keymaps);
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
