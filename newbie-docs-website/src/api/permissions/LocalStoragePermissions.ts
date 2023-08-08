import { Permission } from "@/types/global";
import { UsePermissionsApiFunction } from "@/types/api";

export class UseLocalStoragePermissionsApi implements UsePermissionsApiFunction {
    __get(): Permission[] | undefined {
        const cache = localStorage.getItem('newbie_permissions');
        return cache ? JSON.parse(cache) as Permission[] : []
    }

    __updateCache(from: string, permissions: Permission[] | undefined): boolean {
        if (permissions) {
            localStorage.setItem('newbie_permissions', JSON.stringify(permissions))
            return true
        } else {
            return false
        }
    }

    async get(params: { ownerType: number, owner: string, authType?: number; dataType: number; dataId?: number; dataSlug?: string; }): Promise<Permission | undefined> {
        if (params.ownerType === undefined || params.owner === undefined
            || (params.dataId === undefined && params.dataSlug === undefined)) {
            return
        }

        const permissions = await this.list(params)
        if (permissions && permissions.length > 0) {
            return permissions[0]
        }
    }

    async list(params: { ownerType?: number, owner?: string, authType?: number; dataType: number; dataId?: number; dataSlug?: string; }): Promise<Permission[] | undefined> {
        const permissions = this.__get()
        if (permissions) {
            return permissions.filter(item => {
                let flag = true
                if (params.authType && item.authType !== params.authType) {
                    flag = false
                }
                if (item.dataType !== params.dataType) {
                    flag = false
                }
                if (params.dataId && item.dataId !== params.dataId) {
                    flag = false
                }
                if (params.dataSlug && item.dataSlug !== params.dataSlug) {
                    flag = false
                }
                if (params.ownerType && item.ownerType !== params.ownerType) {
                    flag = false
                }
                if (params.owner && item.owner !== params.owner) {
                    flag = false
                }
                return flag
            })
        }
    }

    async put(permission: Permission): Promise<boolean> {
        let permissions = this.__get() as Permission[] | undefined

        if (permissions) {
            if (!permission.id || permission.id <= 0) {
                permission.id = Math.ceil(Math.random() * 1000000000)
            }

            permissions.push(permission)
            return this.__updateCache('put', permissions)
        } else {
            return false
        }
    }
    async remove(id: number): Promise<boolean> {
        let permissions = this.__get() as Permission[] | undefined

        if (permissions) {
            permissions = permissions.filter(item => item.id !== id)
            return this.__updateCache('remove', permissions)
        } else {
            return false
        }
    }

    async changeAuthType(id: number, newAuthType: number): Promise<boolean> {
        let permissions = this.__get() as Permission[] | undefined

        if (permissions) {
            const permission = permissions.find(item => item.id === id)
            if (permission) {
                permission.authType = newAuthType
                return this.__updateCache('changeAuthType', permissions)
            } else {
                return false
            }
        } else {
            return false
        }
    }

}