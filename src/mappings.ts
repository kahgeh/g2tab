import emptyMappings from "../config/empty-mappings.json";

export interface MapEntry {
  name: string;
  searchText: string;
  key: string;
  url: string;
}

export const defaultKeymaps: MapEntry[] = emptyMappings;
