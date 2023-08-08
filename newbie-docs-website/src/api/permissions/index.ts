import { ApiStorageEnum, Permission } from "@/types/global";
import { UsePermissionsApiFunction } from "@/types/api";
import { UseLocalStoragePermissionsApi } from "./LocalStoragePermissions";
import { UseRESTfulPermissionsApi } from "./RESTfulPermissions";

export function usePermissionsApi(storage: ApiStorageEnum): UsePermissionsApiFunction {
    let permissionsApi = {} as UsePermissionsApiFunction;

    const configStorage = import.meta.env.VITE_API_STORAGE as ApiStorageEnum
    if (configStorage) {
        storage = configStorage
    }

    switch (storage) {
        case "localStorage":
            permissionsApi = new UseLocalStoragePermissionsApi();
            break;
        case "restful":
            permissionsApi = new UseRESTfulPermissionsApi();
            break;
    }

    return permissionsApi;
}
