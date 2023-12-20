import { REQ_PREVIOUS_TAB, REQ_NAV_OR_OPEN_TAB } from "./contracts";
import {
  downloadBtnId,
  fileInputId,
  loadSettingsBtnId,
  saveBtnId,
  toggleEditBtnId,
} from "./uiControlsIds";
import { nameof } from "./utils";

export interface KeymapLookup {
  g2tab: (event: KeyboardEvent) => void;
  editSettings: (event: KeyboardEvent) => void;
}

export function initKeydownWithNavigateToTab() {
  console.log("enabling keymaps...");
  document.body.addEventListener("keydown", navigateToTabKeyDownBehavior);
}

export function createSwitchKeymapsFn(keymapLookup: {
  [key: string]: (event: KeyboardEvent) => void;
}) {
  let currentListener = keymapLookup[nameof<KeymapLookup>("g2tab")] as (
    event: KeyboardEvent
  ) => void;
  return (keymapName: string) => {
    document.body.removeEventListener("keydown", currentListener);
    currentListener = keymapLookup[keymapName];
    document.body.addEventListener("keydown", currentListener);
  };
}
const alphabets = [
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
];

export const navigateToTabKeyDownBehavior = (event: KeyboardEvent) => {
  const { key } = event;
  if (key === "E") {
    event.preventDefault();
    const toggleEditBtn = document.getElementById(
      "toggle-edit-btn"
    ) as HTMLButtonElement;
    toggleEditBtn.click();
    return;
  }

  if (key === "D") {
    event.preventDefault();
    const downloadBtn = document.getElementById(
      downloadBtnId
    ) as HTMLButtonElement;
    downloadBtn.click();
    return;
  }

  let queryOptions = { active: true, lastFocusedWindow: true };
  // `tab` will either be a `tabs.Tab` instance or `undefined`.
  chrome.tabs.query(queryOptions).then(([activeTab]) => {
    if (event.key === " ") {
      chrome.runtime.sendMessage({ type: REQ_PREVIOUS_TAB, activeTab });
      return;
    }

    chrome.runtime.sendMessage({
      type: REQ_NAV_OR_OPEN_TAB,
      key,
      activeTab,
    });

    // note: ideally we would like to close the popup (window.close()) after the user has pressed a key,
    // however, when the focus has been shifted to a tab in another window, closing the popup will refocus
    // the active window to the window where the popup was opened from. This is not the desired behavior.
    // To work around this, we just hide the popup instead.
    document.body.innerHTML = "";
  });
};

export const editSettingsKeyDownBehavior = (event: KeyboardEvent) => {
  const { key } = event;

  if (window.document.activeElement?.tagName === "INPUT" && key === "Escape") {
    event.preventDefault();
    const inputElement = window.document.activeElement as HTMLInputElement;
    inputElement.blur();
    return;
  }

  if (window.document.activeElement?.tagName === "INPUT") {
    return;
  }

  if (key === "E") {
    event.preventDefault();
    const toggleEditBtn = document.getElementById(
      toggleEditBtnId
    ) as HTMLButtonElement;
    toggleEditBtn.click();
    return;
  }

  if (key === "S") {
    event.preventDefault();
    const saveBtn = document.getElementById(saveBtnId)! as HTMLButtonElement;
    saveBtn.click();
    return;
  }

  if (key === "F") {
    event.preventDefault();
    const fileInput = document.getElementById(
      fileInputId
    )! as HTMLButtonElement;
    fileInput.click();
    return;
  }

  if (key === "L") {
    event.preventDefault();
    const loadSettingsBtn = document.getElementById(
      loadSettingsBtnId
    )! as HTMLButtonElement;
    loadSettingsBtn.click();
    return;
  }

  if (alphabets.includes(key)) {
    const nameTextInput = document.getElementById(
      `name-${key}`
    ) as HTMLButtonElement;
    event.preventDefault();
    nameTextInput.focus();
    return;
  }
};
