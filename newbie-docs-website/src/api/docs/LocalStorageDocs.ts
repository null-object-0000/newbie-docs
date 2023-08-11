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
        if (!doc.sort || doc.sort < 0) {
            const parent = docs.find(item => item.id === doc.parentId)
            if (parent) {
                doc.sort = parent.children?.length || 0
            }
        }

        if (!doc.id || doc.id <= 0) {
            doc.id = Math.ceil(Math.random() * 1000000000)
        }
        if (doc.sort <= 0) {
            const totalDocCount = await this.getMaxSort(space, doc.parentId) as number
            doc.sort = totalDocCount + 1
        }

        if (await this.exists(space, doc.slug)) {
            docs = docs.filter(item => item.slug !== doc.slug)
        }

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

    async splice(space: string, id: number, index: number): Promise<boolean> {
        const docs = await this.__get(space) as Doc[]

        const doc = await this.getById(space, id)
        if (!doc || !doc.parentId) {
            return false
        }

        let child = await super.findChild(docs, doc.parentId) as Doc[]
        if (!child) {
            return false
        }

        child = child.filter(item => item.id !== id)

        child = child.sort((a, b) => a.sort - b.sort)

        child.splice(index, 0, doc)

        for (let index = 0; index < child.length; index++) {
            const element = child[index];
            element.sort = index

            for (const item of docs) {
                if (element.id === item.id) {
                    item.sort = index
                }
            }
        }

        return this.__updateCache('splice', space, docs)
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

    async changeParentId(space: string, id: number, parentId: number): Promise<boolean> {
        if (id === parentId) {
            return false;
        }

        // TODO: 检查是否存在
        // if (!this.exists(space, id) || !this.exists(space, parentId)) {
        //     return false;
        // }

        let docs = await this.__get(space) as Doc[]
        const doc = docs.find(item => item.id === id)
        if (doc) {
            doc.parentId = parentId
            return this.__updateCache('changeParentId', space, docs)
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

    async findIndex(space: string, id: number): Promise<number | undefined> {
        let docs = await this.__get(space) as Doc[]
        let current = await this.getById(space, id) as Doc
        let child = current && current.parentId ? await super.findChild(docs, current.parentId) as Doc[] : undefined

        if (!current || !child) {
            return
        }

        child = child.sort((a, b) => a.sort - b.sort)
        return child.findIndex((item) => item.id === id)
    }

    async getMaxSort(space: string, parentId: number): Promise<number> {
        let docs = await this.__get(space) as Doc[]
        let child = await super.findChild(docs, parentId) as Doc[]
        if (!child) {
            return 0
        }

        child = child.sort((a, b) => a.sort - b.sort)
        return child[child.length - 1].sort
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
}