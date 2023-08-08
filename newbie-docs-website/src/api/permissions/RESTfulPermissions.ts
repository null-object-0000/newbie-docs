import { Permission } from "@/types/global";
import { UsePermissionsApiFunction } from "@/types/api";
import axiso from "axios";

export class UseRESTfulPermissionsApi implements UsePermissionsApiFunction {
    async get(params: { ownerType: number, owner: string, authType?: number; dataType: number; dataId?: number; dataSlug?: string; }): Promise<Permission | undefined> {
        const { data: response } = await axiso({
            method: 'get',
            baseURL: import.meta.env.VITE_REST_API_BASE_URL,
            url: '/permissions/get',
            params: params
        })

        if (response && response.code === '0000') {
            return response.result as Permission
        }
    }

    async list(params: { ownerType?: number, owner?: string, authType?: number; dataType: number; dataId?: number; dataSlug?: string; }): Promise<Permission[] | undefined> {
        const { data: response } = await axiso({
            method: 'get',
            baseURL: import.meta.env.VITE_REST_API_BASE_URL,
            url: '/permissions/list',
            params: params
        })

        if (response && response.code === '0000') {
            return response.result as Permission[]
        }
    }

    async put(permission: Permission): Promise<boolean> {
        const { data: response } = await axiso({
            method: 'post',
            baseURL: import.meta.env.VITE_REST_API_BASE_URL,
            url: '/permissions/put',
            data: {
                id: permission.id,
                ownerType: permission.ownerType,
                owner: permission.owner,
                authType: permission.authType,
                dataType: permission.dataType,
                dataId: permission.dataId,
                dataSlug: permission.dataSlug
            }
        })

        return response && response.code === '0000' && response.result > 0
    }

    async remove(id: number): Promise<boolean> {
        const { data: response } = await axiso({
            method: 'post',
            baseURL: import.meta.env.VITE_REST_API_BASE_URL,
            url: '/permissions/remove',
            data: {
                id: id
            }
        })

        return response && response.code === '0000'
    }

    async changeAuthType(id: number, newAuthType: number): Promise<boolean> {
        const { data: response } = await axiso({
            method: 'post',
            baseURL: import.meta.env.VITE_REST_API_BASE_URL,
            url: '/permissions/changeAuthType',
            data: {
                id: id,
                newAuthType: newAuthType
            }
        })

        return response && response.code === '0000'
    }

}