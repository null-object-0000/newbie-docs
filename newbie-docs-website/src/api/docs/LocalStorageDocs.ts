import type { OutputBlockData } from "@editorjs/editorjs";
import { Doc, UseDocsApiFunction, DocData } from "@/types/global";
import { BaseUseDocsApi } from "./base";

export class UseLocalStorageDocsApi extends BaseUseDocsApi implements UseDocsApiFunction {
    spaceData: Record<string, DocData>

    constructor(spaceData: Record<string, DocData>) {
        super()

        this.spaceData = spaceData
    }

    async init(space: string): Promise<void> {
        const cache = localStorage.getItem('docs_' + space);
        if (cache) {
            this.__updateCache('__get', space, JSON.parse(cache))
        } else {
            this.__updateCache('__get', space, super.getDefaultDocs(space))
        }

        // 默认展开所有的 doc
        const docs = this.spaceData[space].array
        for (const item of docs) {
            item.expand = true;
        }
        this.__updateCache('__get', space, docs)
    }

    __updateCache(from: string, space: string, docs: Doc[] | undefined): boolean {
        if (docs) {
            docs = Array.isArray(docs) ? docs : super.tree2array(docs) as Doc[]

            for (const item of docs) {
                delete item.child
            }

            this.spaceData[space] = {
                tree: super.array2tree(docs) as Doc,
                array: docs
            }
            localStorage.setItem('docs_' + space, JSON.stringify(docs))
            return true
        } else {
            return false
        }
    }

    __get(space: string, slug?: string): Doc | Doc[] | undefined {
        let docs;
        if (slug === undefined) {
            docs = this.spaceData[space].array
        } else {
            docs = this.spaceData[space].array.find(item => item.slug === slug)
        }

        return docs
    }

    /**
     * TODO 实现
     */
    async dir(space: string): Promise<Doc | undefined> {
        const docs = this.__get(space)
        return super.array2tree(docs)
    }

    async get(space: string, slug?: string): Promise<Doc | undefined> {
        const docs = this.__get(space, slug)
        return super.array2tree(docs)
    }

    async put(space: string, doc: Doc): Promise<boolean> {
        let docs = this.__get(space) as Doc[]

        // 如果指定了 sort 就用指定的，否则默认插入到当前父级 child 中的最后一位
        if (!doc.sort || doc.sort < 0) {
            const parent = docs.find(item => item.slug === doc.parentSlug)
            if (parent) {
                doc.sort = parent.child?.length || 0
            }
        }

        if (await this.exists(space, doc.slug)) {
            docs = docs.filter(item => item.slug !== doc.slug)
        }

        docs.push(doc)

        return this.__updateCache("put", space, docs)
    }

    async exists(space: string, slug: string): Promise<boolean> {
        let docs = this.__get(space) as Doc[]
        return docs.some(item => item.slug === slug)
    }

    async remove(space: string, slug: string): Promise<boolean> {
        let docs = this.__get(space) as Doc[]

        docs = docs.filter(item => item.slug !== slug)

        return this.__updateCache('remove', space, docs)
    }

    async splice(space: string, slug: string, index: number): Promise<boolean> {
        const docs = this.__get(space) as Doc[]

        const doc = await this.get(space, slug)
        if (!doc || !doc.parentSlug) {
            return false
        }

        let child = await super.findChild(docs, doc.parentSlug) as Doc[]
        if (!child) {
            return false
        }

        child = child.filter(item => item.slug !== slug)

        child.splice(index, 0, doc)

        for (let sort = 0; sort < child.length; sort++) {
            const element = child[sort];
            element.sort = sort
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

        let docs = this.__get(space) as Doc[]
        const doc = docs.find(item => item.slug === oldSlug)
        if (doc) {
            doc.slug = newSlug

            const child = await super.findChild(docs, oldSlug)
            if (child) {
                for (const item of child) {
                    item.parentSlug = newSlug
                }
            }
            return this.__updateCache('changeSlug', space, docs)
        } else {
            return false
        }
    }

    async changeParentSlug(space: string, slug: string, parentSlug: string): Promise<boolean> {
        if (slug === parentSlug) {
            return false;
        }

        if (!this.exists(space, slug) || !this.exists(space, parentSlug)) {
            return false;
        }

        let docs = this.__get(space) as Doc[]
        const doc = docs.find(item => item.slug === slug)
        if (doc) {
            doc.parentSlug = parentSlug
            return this.__updateCache('changeParentSlug', space, docs)
        } else {
            return false
        }
    }

    async changeTitle(space: string, slug: string, newTitle: string): Promise<boolean> {
        if (!newTitle || newTitle.length <= 0) {
            return false
        }

        let docs = this.__get(space) as Doc[]
        const doc = docs.find(item => item.slug === slug)
        if (doc) {
            doc.title = newTitle

            return this.__updateCache('changeTitle', space, docs)
        } else {
            return false
        }
    }

    async getTotalDocCount(space: string): Promise<number> {
        let docs = this.__get(space) as Doc[]
        docs = docs.filter(item => item.slug !== 'root' && item.slug !== 'home')

        return docs.length
    }

    async getTotalWordCount(space: string): Promise<number> {
        let docs = this.__get(space) as Doc[]
        docs = docs.filter(item => item.slug !== 'root' && item.slug !== 'home')

        let wordCount = 0
        for (const item of docs) {
            if (item.editor === 'block') {
                const content = item.content as OutputBlockData[]
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
            } else if (item.editor === 'word') {
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