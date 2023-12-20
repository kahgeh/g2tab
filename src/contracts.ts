import { MapEntry } from "./mappings";

type RequestType =
  | "LOG"
  | "GET_KEYMAPS"
  | "SAVE_KEYMAPS"
  | "MARK_AS_SCRATCH"
  | "NAV_TO_SCRATCH"
  | "NAVTO_PREV_TAB"
  | "NAV_OR_OPEN_TAB";

export const REQ_LOG = "LOG";
export const REQ_PREVIOUS_TAB = "NAVTO_PREV_TAB";
export const REQ_NAV_OR_OPEN_TAB = "NAV_OR_OPEN_TAB";
export const REQ_MARK_AS_SCRATCH = "MARK_AS_SCRATCH";
export const REQ_NAV_TO_SCRATCH = "NAV_TO_SCRATCH";
export const REQ_GET_KEYMAPS = "GET_KEYMAPS";
export const REQ_SAVE_KEYMAPS = "SAVE_KEYMAPS";

export interface Request {
  type: RequestType;
  activeTab: chrome.tabs.Tab;
}

export interface LogRequest extends Request {
  message: string;
}

export interface SearchTabRequest extends Request {
  key: string;
  mappings: MapEntry[];
}

export interface SaveKeymapsRequest extends Request {
  keymaps: MapEntry[];
}
