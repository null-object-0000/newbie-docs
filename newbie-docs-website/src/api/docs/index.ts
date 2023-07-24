import { Doc, DocsStorageEnum, UseDocsApiFunction, DocData } from "@/types/global";
import { UseLocalStorageDocsApi } from "./LocalStorageDocs";
import { UseRestDocsApi } from "./RestDocs";

export function useDocsApi(storage: DocsStorageEnum, spaceData: Record<string, DocData>): UseDocsApiFunction {
  switch (storage) {
    case "localStorage":
      return new UseLocalStorageDocsApi(spaceData);
    case "rest":
      return new UseRestDocsApi(spaceData);
    default:
      return new UseLocalStorageDocsApi(spaceData);
  }
}