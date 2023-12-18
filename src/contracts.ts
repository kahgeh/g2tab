import { MapEntry } from "./mappings";

type RequestType = "LOG" | "NAVTO_PREV_TAB" | "SEARCH_TABS";

export const REQ_LOG = "LOG";
export const REQ_PREVIOUS_TAB = "NAVTO_PREV_TAB";
export const REQ_SEARCH_TABS = "SEARCH_TABS";

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
