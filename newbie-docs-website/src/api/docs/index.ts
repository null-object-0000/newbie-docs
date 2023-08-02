import { Doc, ApiStorageEnum, UseDocsApiFunction, DocData } from "@/types/global";
import { UseLocalStorageDocsApi } from "./LocalStorageDocs";
import { UseRestDocsApi } from "./RestDocs";

export function useDocsApi(storage: ApiStorageEnum, spaceData: Record<string, DocData>): UseDocsApiFunction {
  let docsApi;
  switch (storage) {
    case "localStorage":
      docsApi = new UseLocalStorageDocsApi(spaceData);
    case "rest":
      docsApi = new UseRestDocsApi(spaceData);
    default:
      docsApi = new UseLocalStorageDocsApi(spaceData);
  }

  return docsApi;
}