import { REQ_GET_KEYMAPS, REQ_SAVE_KEYMAPS } from "./contracts";
import {
  createSwitchKeymapsFn,
  editSettingsKeyDownBehavior,
  initKeydownWithNavigateToTab,
  navigateToTabKeyDownBehavior,
} from "./keydownBehaviours";
import { MapEntry } from "./mappings";
import {
  downloadBtnId,
  fileInputId,
  loadSettingsBtnId,
  saveBtnId,
  toggleEditBtnId,
} from "./uiControlsIds";

const switchKeymaps = createSwitchKeymapsFn({
  g2tab: navigateToTabKeyDownBehavior,
  editSettings: editSettingsKeyDownBehavior,
});

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

const settingsDiv = document.getElementById("settings") as HTMLDivElement;
const toggleEditBtn = document.getElementById(
  toggleEditBtnId
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

function renderEditSection(keymaps: MapEntry[]) {
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
    name.id = `name-${entry.key}`;
    name.name = "name";
    name.value = entry.name;
    setting.appendChild(name);

    const searchText = document.createElement("input");
    searchText.className = "search-text";
    searchText.placeholder = "Search text";
    searchText.type = "text";
    searchText.id = `searchText-${entry.key}`;
    searchText.name = "searchText";
    searchText.value = entry.searchText;
    setting.appendChild(searchText);

    const url = document.createElement("input");
    url.className = "url";
    url.placeholder = "URL";
    url.type = "text";
    url.id = `url-${entry.key}`;
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

async function loadExtension() {
  console.log("loading extension popup...");
  await loadMappings();

  const saveBtn = document.getElementById(saveBtnId)! as HTMLButtonElement;
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
      switchKeymaps("editSettings");
      return;
    }
    toggleEditBtn!.value = "Edit keymaps";
    settingsDiv.style.display = "none";
    switchKeymaps("g2tab");
  });

  const downloadBtn = document.getElementById(
    downloadBtnId
  )! as HTMLButtonElement;
  downloadBtn.addEventListener("click", async () => {
    const settings = await chrome.runtime.sendMessage({
      type: REQ_GET_KEYMAPS,
    });

    if (chrome.runtime.lastError) {
      console.error("Error retrieving settings:", chrome.runtime.lastError);
      return;
    }

    const settingsStr = JSON.stringify(settings, null, 2);
    const blob = new Blob([settingsStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "settings.json";
    document.body.appendChild(a);
    a.click();

    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  });

  const loadSettingsBtn = document.getElementById(
    loadSettingsBtnId
  )! as HTMLButtonElement;

  loadSettingsBtn.addEventListener("click", () => {
    const fileInput = document.getElementById(fileInputId)! as HTMLInputElement;
    if (!fileInput.files || fileInput.files.length === 0) {
      return;
    }

    const file = fileInput.files![0];

    const reader = new FileReader();

    reader.onload = function (e) {
      const settings = JSON.parse(e.target.result);
      renderEditSection(settings.keymaps);
    };

    reader.onerror = function () {
      console.error("Error reading file.");
    };

    reader.readAsText(file);
  });
  settingsDiv.style.display = "none";
  initKeydownWithNavigateToTab();
}

await loadExtension();
