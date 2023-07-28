import type { OutputBlockData } from "@editorjs/editorjs";
import { Doc, UseDocsApiFunction, DocData } from "@/types/global";
import { BaseUseDocsApi } from "./base";

export class UseLocalStorageDocsApi extends BaseUseDocsApi implements UseDocsApiFunction {
    spaceData: Record<string, DocData>

    constructor(spaceData: Record<string, DocData>) {
        super()

        this.spaceData = spaceData
    }

    init(space: string): void {
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

    __get(space: string, id?: string): Doc | Doc[] | undefined {
        let docs;
        if (id === undefined) {
            docs = this.spaceData[space].array
        } else {
            docs = this.spaceData[space].array.find(item => item.id === id)
        }

        return docs
    }

    get(space: string, id?: string): Doc | undefined {
        const docs = this.__get(space, id)
        return super.array2tree(docs)
    }

    put(space: string, doc: Doc): boolean {
        let docs = this.__get(space) as Doc[]

        // 如果指定了 sort 就用指定的，否则默认插入到当前父级 child 中的最后一位
        if (!doc.sort || doc.sort < 0) {
            const parent = docs.find(item => item.id === doc.parentId)
            if (parent) {
                doc.sort = parent.child?.length || 0
            }
        }

        if (this.exists(space, doc.id)) {
            docs = docs.filter(item => item.id !== doc.id)
        }

        docs.push(doc)

        return this.__updateCache("put", space, docs)
    }

    exists(space: string, id: string): boolean {
        let docs = this.__get(space) as Doc[]
        return docs.some(item => item.id === id)
    }

    remove(space: string, id: string): boolean {
        let docs = this.__get(space) as Doc[]

        docs = docs.filter(item => item.id !== id)

        return this.__updateCache('remove', space, docs)
    }

    splice(space: string, id: string, index: number): boolean {
        const docs = this.__get(space) as Doc[]

        const doc = this.get(space, id)
        if (!doc || !doc.parentId) {
            return false
        }

        let child = super.findChild(docs, doc.parentId) as Doc[]
        if (!child) {
            return false
        }

        child = child.filter(item => item.id !== id)

        child.splice(index, 0, doc)

        for (let sort = 0; sort < child.length; sort++) {
            const element = child[sort];
            element.sort = sort
        }

        return this.__updateCache('splice', space, docs)
    }

    changeId(space: string, oldId: string, newId: string): boolean {
        if (oldId === newId) {
            return true;
        }

        if (this.exists(space, newId)) {
            return false;
        }

        let docs = this.__get(space) as Doc[]
        const doc = docs.find(item => item.id === oldId)
        if (doc) {
            doc.id = newId

            const child = super.findChild(docs, oldId)
            if (child) {
                for (const item of child) {
                    item.parentId = newId
                }
            }
            return this.__updateCache('changeId', space, docs)
        } else {
            return false
        }
    }

    changeParentId(space: string, id: string, parentId: string): boolean {
        if (id === parentId) {
            return false;
        }

        if (!this.exists(space, id) || !this.exists(space, parentId)) {
            return false;
        }

        let docs = this.__get(space) as Doc[]
        const doc = docs.find(item => item.id === id)
        if (doc) {
            doc.parentId = parentId
            return this.__updateCache('changeParentId', space, docs)
        } else {
            return false
        }
    }

    getTotalDocCount(space: string): number {
        let docs = this.__get(space) as Doc[]
        docs = docs.filter(item => item.id !== 'root' && item.id !== 'home')

        return docs.length
    }

    getTotalWordCount(space: string): number {
        let docs = this.__get(space) as Doc[]
        docs = docs.filter(item => item.id !== 'root' && item.id !== 'home')

        console.log('docs', docs)

        let wordCount = 0
        for (const item of docs) {
            if (item.editor === 'block') {
                const content = item.content as OutputBlockData[]
                wordCount += content.reduce((prev, current) => {
                    if (current.type === 'list') {
                        const lengths = current.data.items.map((item: { content: string; }) => item.content.length)
                        prev += lengths.reduce((prev: number, current: number) => prev + current, 0)
                    } else {
                        prev += current.data.text.length
                    }
                    return prev
                }, 0)
            } else if (item.editor === 'word') {
                const content = item.content as string
                wordCount += content.length
            }
        }

        return wordCount;
    }
}