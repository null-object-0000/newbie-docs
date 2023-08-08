import { ApiStorageEnum, Book } from "@/types/global";
import { UseBooksApiFunction } from "@/types/api";
import { UseLocalStorageBooksApi } from "./LocalStorageBooks";
import { UseRESTfulBooksApi } from "./RESTfulBooks";

export function useBooksApi(storage: ApiStorageEnum): UseBooksApiFunction {
    let booksApi = {} as UseBooksApiFunction;

    const configStorage = import.meta.env.VITE_API_STORAGE as ApiStorageEnum
    if (configStorage) {
        storage = configStorage
    }

    switch (storage) {
        case "localStorage":
            booksApi = new UseLocalStorageBooksApi();
            break;
        case "restful":
            booksApi = new UseRESTfulBooksApi();
            break;
    }

    return booksApi;
}
