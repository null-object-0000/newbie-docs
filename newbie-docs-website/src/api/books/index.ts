import { ApiStorageEnum, Book } from "@/types/global";
import { UseBooksApiFunction } from "@/types/api";
import { UseLocalStorageBooksApi } from "./LocalStorageBooks";

export function useBooksApi(storage: ApiStorageEnum): UseBooksApiFunction {
    let booksApi = {} as UseBooksApiFunction;
    switch (storage) {
        case "localStorage":
            booksApi = new UseLocalStorageBooksApi();
        // case "rest":
        // docsApi = new UseRESTfulBooksApi(spaceData);
        default:
            booksApi = new UseLocalStorageBooksApi();
    }

    return booksApi;
}
