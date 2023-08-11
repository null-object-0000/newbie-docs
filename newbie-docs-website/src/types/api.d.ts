import { Book, Doc, Permission } from "@/types/global";

export interface UsePermissionsApiFunction {
    async get: (params: { authType?: number, dataType: number, ownerType?: number, owner?: string, dataId?: number, dataSlug?: string }) => Promise<Permission | undefined>;
    async list: (params: { authType?: number, dataType: number, dataId?: number, dataSlug?: string }) => Promise<Permission[] | undefined>;

    async put: (permission: Permission) => Promise<boolean>;
    async remove: (id: number) => Promise<boolean>;

    async changeAuthType: (id: number, newAuthType: number) => Promise<boolean>;
}

export interface UseBooksApiFunction {
    async dir: () => Promise<Book[] | undefined>;
    async get: (slug: string) => Promise<Book | undefined>;
    async exists: (slug: String) => Promise<boolean>;

    async put: (book: Book) => Promise<boolean>;
    async remove: (id: number) => Promise<boolean>;

    async changeTitle: (id: number, newTitle: string) => Promise<boolean>;
}

export interface UseDocsApiFunction {
    async init: (space: string) => Promise<void>;

    async generateSlug: (length: number) => Promise<string>;

    /**
     * 获取指定空间的所有 doc
     * @param space 空间名
     * @param forceRemote [RESTfulDocs] 是否强制从远程获取
     * @returns 树形结构的 doc，包含子节点，不包含 doc 内容
     */
    async dir: (space: string, ...any) => Promise<Doc | undefined>;
    /**
     * 获取指定空间指定 slug 的 doc
     * @param space 空间名
     * @param slug doc slug
     * @param forceRemote [RESTfulDocs] 是否强制从远程获取
     * @returns 树形结构的 doc，包含子节点，包含 doc 内容
     */
    async get: (space: string, slug?: string, ...any) => Promise<Doc | undefined>;
    async getById: (space: string, id: number) => Promise<Doc | undefined>;
    async exists: (space: string, slug: string) => Promise<boolean>;

    async put: (space: string, doc: Doc) => Promise<boolean>;
    async remove: (space: string, id: number) => Promise<boolean>;
    /**
     * 在指定空间中将指定 slug 的 doc 移动到指定位置并整理排序
     * @param space 空间名
     * @param id doc id
     * @param index 目标位置
     * @returns 
     */
    async splice: (space: string, id: number, index: number) => Promise<boolean>;

    async changeSlug: (space: string, oldSlug: string, newSlug: string) => Promise<boolean>;
    async changeParentId: (space: string, id: number, parentId: number) => Promise<boolean>;
    async changeTitle: (space: string, id: number, newTitle: string) => Promise<boolean>;

    async findIndex(space: string, id: number): Promise<number | undefined>;

    async findChild(data: Doc | Doc[] | undefined, parentId: number): Promise<Doc[] | undefined>;

    async getLevel: (space: string, doc: Doc | string) => Promise<number | undefined>;
    async getTotalDocCount: (space: string) => Promise<number>;
    async getTotalWordCount: (space: string) => Promise<number>;

    array2tree: (docs?: Doc | Doc[], deepClone = true) => Doc | undefined;
    tree2array: (doc?: Doc, deepClone = true) => Doc[] | undefined;
}