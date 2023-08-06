import { Book, Doc, Permission } from "@/types/global";

export interface UsePermissionsApiFunction {
    async get: (params: { authType?: string, dataType: string, ownerType: string, owner: string, dataId?: number, dataFlag?: string }) => Promise<Permission | undefined>;
    async list: (params: { authType?: string, dataType: string, dataId?: number, dataFlag?: string }) => Promise<Permission[] | undefined>;

    async put: (permission: Permission) => Promise<boolean>;
    async remove: (id: number) => Promise<boolean>;

    async changeAuthType: (id: number, newAuthType: string) => Promise<boolean>;
}

export interface UseBooksApiFunction {
    async dir: () => Promise<Book[] | undefined>;
    async get: (slug: string) => Promise<Book | undefined>;
    async exists: (slug: String) => Promise<boolean>;

    async put: (book: Book) => Promise<boolean>;
    async remove: (slug: string) => Promise<boolean>;

    async changeTitle: (slug: string, newTitle: string) => Promise<boolean>;
}

export interface UseDocsApiFunction {
    async init: (space: string) => Promise<void>;

    async generateSlug: (length: number) => Promise<string>;

    /**
     * 获取指定空间的所有 doc
     * @param space 空间名
     * @returns 树形结构的 doc，包含子节点，不包含 doc 内容
     */
    async dir: (space: string) => Promise<Doc | undefined>;
    /**
     * 获取指定空间指定 slug 的 doc
     * @param space 空间名
     * @param slug doc slug
     * @returns 树形结构的 doc，包含子节点，包含 doc 内容
     */
    async get: (space: string, slug?: string) => Promise<Doc | undefined>;
    async exists: (space: string, slug: string) => Promise<boolean>;

    async put: (space: string, doc: Doc) => Promise<boolean>;
    async remove: (space: string, slug: string) => Promise<boolean>;
    /**
     * 在指定空间中将指定 slug 的 doc 移动到指定位置并整理排序
     * @param space 空间名
     * @param slug doc slug
     * @param index 目标位置
     * @returns 
     */
    async splice: (space: string, slug: string, index: number) => Promise<boolean>;

    async changeSlug: (space: string, oldSlug: string, newSlug: string) => Promise<boolean>;
    async changeParentSlug: (space: string, slug: string, parentSlug: string) => Promise<boolean>;
    async changeTitle: (space: string, slug: string, newTitle: string) => Promise<boolean>;

    async findIndex(space: string, slug: string): Promise<number | undefined>;

    async findChild(data: Doc | Doc[] | undefined, parentSlug: string): Promise<Doc[] | undefined>;

    async getLevel: (space: string, doc: Doc | string) => Promise<number | undefined>;
    async getTotalDocCount: (space: string) => Promise<number>;
    async getTotalWordCount: (space: string) => Promise<number>;

    array2tree: (docs?: Doc | Doc[]) => Doc | undefined;
    tree2array: (doc?: Doc) => Doc[] | undefined;
}