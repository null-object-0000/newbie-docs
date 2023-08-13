import type { OutputBlockData } from "@editorjs/editorjs";
import { Book, Doc, DocData } from "@/types/global";
import { UseDocsApiFunction } from "@/types/api";
import { BaseUseDocsApi } from "./base";
import { useBooksApi } from "../books";

export class UseLocalStorageDocsApi extends BaseUseDocsApi implements UseDocsApiFunction {
    spaceData: Record<string, DocData>
    localStorageCacheKey: string

    constructor(spaceData: Record<string, DocData>, options?: { localStorageCacheKey?: string }) {
        super()

        this.spaceData = spaceData
        this.localStorageCacheKey = options?.localStorageCacheKey || 'newbie_docs'
    }

    async init(space: string): Promise<void> {
        const cache = localStorage.getItem(this.localStorageCacheKey + '_' + space);
        const cacheObj = cache && JSON.parse(cache)
        if (super.isValidDoc(cacheObj)) {
            this.__updateCache('init', space, cacheObj)
        } else {
            const booksApi = useBooksApi('localStorage')
            const book = await booksApi.get(space) as Book
            this.__updateCache('init', space, super.getDefaultDocs(book))
        }

        const docs = this.spaceData[space].array
        this.__updateCache('init', space, docs)
    }

    __updateCache(from: string, space: string, docs: Doc[] | undefined): boolean {
        if (docs) {
            docs = Array.isArray(docs) ? docs : super.tree2array(docs) as Doc[]

            for (const item of docs) {
                delete item.children
            }

            this.spaceData[space] = {
                tree: super.array2tree(docs) as Doc,
                array: docs
            }
            localStorage.setItem(this.localStorageCacheKey + '_' + space, JSON.stringify(docs))
            return true
        } else {
            return false
        }
    }

    async __get(space: string, slug?: string): Promise<Doc | Doc[] | undefined> {
        if (this.spaceData[space]) {
            let cacheDocs = JSON.parse(JSON.stringify(this.spaceData[space].array)) as Doc[]

            let docs;
            if (slug === undefined) {
                docs = cacheDocs
            } else {
                docs = cacheDocs.find(item => item.slug === slug)
            }

            return docs
        }
    }

    async dir(space: string): Promise<Doc | undefined> {
        const docs = await this.__get(space)

        const newDocs = JSON.parse(JSON.stringify(docs)).map((item: Doc) => {
            item.content = ''
            return item
        })

        return super.array2tree(newDocs)
    }

    async get(space: string, slug?: string): Promise<Doc | undefined> {
        const docs = await this.__get(space, slug)
        return super.array2tree(docs)
    }

    async getById(space: string, id: number): Promise<Doc | undefined> {
        const docs = await this.__get(space) as Doc[]
        return docs.find(item => item.id === id)
    }

    async put(space: string, doc: Doc): Promise<boolean> {
        let docs = await this.__get(space) as Doc[]

        // 如果指定了 sort 就用指定的，否则默认插入到当前父级 child 中的最后一位
        if (doc.sort < 0) {
            const children = docs.filter(item => item.parentId === doc.parentId) as Doc[]
            if (children && children.length > 0) {
                doc.sort = children.length || 0
            }
        }

        if (!doc.id || doc.id <= 0) {
            doc.id = Math.ceil(Math.random() * 1000000000)
        }

        // TODO: 这里应该增加一个是否是当前 doc
        if (await this.exists(space, doc.slug)) {
            docs = docs.filter(item => item.slug !== doc.slug)
        }

        docs = docs.filter(item => item.id !== doc.id)
        docs.push(doc)

        return this.__updateCache("put", space, docs)
    }

    async exists(space: string, slug: string): Promise<boolean> {
        let docs = await this.__get(space) as Doc[]
        return docs.some(item => item.slug === slug)
    }

    async remove(space: string, id: number): Promise<boolean> {
        let docs = await this.__get(space) as Doc[]

        docs = docs.filter(item => item.id !== id)

        return this.__updateCache('remove', space, docs)
    }

    async move(space: string, dropPosition: number, dragDocId: number, dropDocId: number): Promise<boolean> {
        const docs = await this.__get(space) as Doc[]
        // 拖拽节点
        const dragDoc = docs.find(item => item.id === dragDocId)
        // 目标节点
        const dropDoc = docs.find(item => item.id === dropDocId)

        if (!dragDoc || !dropDoc) {
            return false
        }

        let parentChild = docs.filter(item => item.parentId === dropDoc.parentId)
            .sort((a, b) => a.sort - b.sort)

        let targetParentId = -1;
        let targetIndex = -1;
        if (dropPosition === 0) {
            targetParentId = dropDocId
        } else {
            if (dragDoc.parentId != dropDoc.parentId) {
                targetParentId = dropDoc.parentId
            }

            // -1 为上方，1 为下方
            let currentIndex = parentChild.findIndex(item => item.id === dragDocId)
            let aboveIndex = parentChild.findIndex(item => item.id === dropDocId)

            if (currentIndex >= 0 && aboveIndex >= 0) {
                if (currentIndex < aboveIndex) {
                    if (dropPosition === -1) {
                        aboveIndex = aboveIndex - 1
                    }
                } else {
                    if (dropPosition === 1) {
                        aboveIndex = aboveIndex + 1
                    }
                }
            }

            targetIndex = aboveIndex
        }

        if (targetIndex < 0 && targetParentId <= 0) {
            return false
        }

        // 看看是否要改变父级
        if (targetParentId > 0 && dragDoc.parentId !== targetParentId) {
            dragDoc.parentId = targetParentId
        }

        // 看看是否要改变排序
        if (targetIndex >= 0) {
            parentChild = parentChild.filter(item => item.id !== dragDocId).sort((a, b) => a.sort - b.sort)

            parentChild.splice(targetIndex, 0, dragDoc)

            for (let index = 0; index < parentChild.length; index++) {
                const item = parentChild[index];
                item.sort = index
            }
        }

        return this.__updateCache('move', space, docs)
    }

    async changeSlug(space: string, oldSlug: string, newSlug: string): Promise<boolean> {
        if (oldSlug === newSlug) {
            return true;
        }

        if (await this.exists(space, newSlug)) {
            return false;
        }

        let docs = await this.__get(space) as Doc[]
        const doc = docs.find(item => item.slug === oldSlug)
        if (doc) {
            doc.slug = newSlug
            return this.__updateCache('changeSlug', space, docs)
        } else {
            return false
        }
    }

    async changeTitle(space: string, id: number, newTitle: string): Promise<boolean> {
        if (!newTitle || newTitle.length <= 0) {
            return false
        }

        let docs = await this.__get(space) as Doc[]
        const doc = docs.find(item => item.id === id)
        if (doc) {
            doc.title = newTitle

            return this.__updateCache('changeTitle', space, docs)
        } else {
            return false
        }
    }

    async getTotalDocCount(space: string): Promise<number> {
        const cache = localStorage.getItem(this.localStorageCacheKey + '_' + space);
        let docs = cache && JSON.parse(cache) as Doc[] || []
        docs = docs.filter(item => item.slug !== 'root' && item.slug !== 'home')

        return docs.length
    }

    async getTotalWordCount(space: string): Promise<number> {
        const cache = localStorage.getItem(this.localStorageCacheKey + '_' + space);
        let docs = cache && JSON.parse(cache) as Doc[] || []
        docs = docs.filter(item => item.slug !== 'root' && item.slug !== 'home')

        let wordCount = 0
        for (const item of docs) {
            if (item.editor === 2) {
                const content = (item.content ? JSON.parse(item.content) : []) as OutputBlockData[]
                wordCount += content.reduce((prev, current) => {
                    if (current.type === 'list') {
                        const lengths = current.data.items.map((item: { content: string; }) => item.content.length)
                        prev += lengths.reduce((prev: number, current: number) => prev + current, 0)
                    } else if (current.type === 'table') {
                        const lengths = current.data.content.map((item: string[]) => item.reduce((prev: number, current: string) => prev + current.length, 0))
                        prev += lengths.reduce((prev: number, current: number) => prev + current, 0)
                    } else {
                        prev += current.data.text.length
                    }
                    return prev
                }, 0)
            } else if (item.editor === 1) {
                // 去除掉html标签，只保留文字
                const content = item.content as string
                const reg = /<[^>]+>/g
                const text = content.replace(reg, '')
                wordCount += text.length
            }
        }

        return wordCount;
    }

    async tryLock(space: string, id: number): Promise<boolean> {
        return true
    }

    async tryUnlock(space: string, id: number): Promise<boolean> {
        return true
    }
}