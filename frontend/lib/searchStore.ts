import { SearchResult } from "@/types";

let currentSearchResult: SearchResult | null = null;

export const searchStore = {
  get: (): SearchResult | null => currentSearchResult,
  set: (result: SearchResult | null) => {
    currentSearchResult = result;
  },
  clear: () => {
    currentSearchResult = null;
  }
};
