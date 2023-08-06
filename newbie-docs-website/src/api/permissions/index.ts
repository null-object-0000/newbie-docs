import { ApiStorageEnum, Permission } from "@/types/global";
import { UsePermissionsApiFunction } from "@/types/api";
import { UseLocalStoragePermissionsApi } from "./LocalStoragePermissions";

export function usePermissionsApi(storage: ApiStorageEnum): UsePermissionsApiFunction {
    let permissionsApi = {} as UsePermissionsApiFunction;
    switch (storage) {
        case "localStorage":
            permissionsApi = new UseLocalStoragePermissionsApi();
        // case "rest":
        // permissionsApi = new UseRESTfulPermissionsApi(spaceData);
        default:
            permissionsApi = new UseLocalStoragePermissionsApi();
    }

    return permissionsApi;
}
