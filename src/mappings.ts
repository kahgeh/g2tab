import savedMappings from "../config/mappings.json";

export interface MapEntry {
  name: string;
  searchText: string;
  key: string;
  url: string;
}

export const mappings: MapEntry[] = savedMappings;
