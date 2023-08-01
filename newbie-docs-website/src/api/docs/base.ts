import { Doc, UseDocsApiFunction } from "@/types/global";

export abstract class BaseUseDocsApi implements UseDocsApiFunction {
    abstract init(space: string): void;
    abstract get(space: string, id?: string): Doc | undefined;
    abstract put(space: string, doc: Doc): boolean;
    abstract exists(space: string, id: string): boolean;
    abstract remove(space: string, id: string): boolean;
    abstract splice(space: string, id: string, index: number): boolean;
    abstract changeId(space: string, oldId: string, newId: string): boolean;
    abstract changeParentId(space: string, id: string, parentId: string): boolean;
    abstract changeTitle(space: string, id: string, newTitle: string): boolean;
    abstract getTotalDocCount(space: string): number;
    abstract getTotalWordCount(space: string): number;

    array2tree(docs?: Doc | Doc[]): Doc | undefined {
        if (!docs || !Array.isArray(docs)) {
            return docs
        }

        const rootDoc = docs.find(doc => doc.id === 'root')
        if (!rootDoc) {
            return
        }

        const processChild = (doc: Doc) => {
            doc.child = docs.filter(item => item.parentId === doc.id).sort((a, b) => a.sort! - b.sort!)

            for (const child of doc.child) {
                processChild(child)
            }
        }

        processChild(rootDoc)

        return rootDoc
    }

    tree2array(docs?: Doc): Doc[] | undefined {
        if (!docs) {
            return
        }

        const result: Doc[] = []

        const processChild = (doc: Doc) => {
            result.push(doc)

            if (doc.child) {
                for (const child of doc.child) {
                    processChild(child)
                }
            }
        }

        processChild(docs)

        for (const doc of result) {
            delete doc.child
        }

        return result
    }

    getDefaultDocs(space: string): Doc[] {
        const tree = {
            id: 'root',
            editor: 'block',
            // TODO: 这里的 title 应该是从后端获取的，暂时写死
            title: "万象开放平台 - 营销产品部",
            path: "/" + space,
            child: [
                {
                    id: 'home',
                    parentId: 'root',
                    editor: 'block',
                    title: "首页",
                    path: `/${space}/home`,
                    child: []
                }
            ]
        }

        return this.tree2array(tree) as Doc[]
    }

    findDocBy(docs: Doc | undefined, key: string, value: any): Doc | undefined {
        if (docs === undefined) {
            return
        }

        // @ts-ignore
        if (docs[key] == value) {
            return docs
        }

        if (docs.child) {
            for (const doc of docs.child) {
                const findDoc = this.findDocBy(doc, key, value)
                if (findDoc) {
                    return findDoc
                }
            }
        }
    }

    findChild(data: Doc | Doc[] | undefined, parentId: string): Doc[] | undefined {
        if (!data) {
            return
        }

        data = Array.isArray(data) ? data : this.tree2array(data) as Doc[]
        return data.filter(doc => doc.parentId === parentId)
    }

    generateId(length: number) {
        const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
        const alphabet = 'abcdefghijklmnopqrstuvwxyz';
        const firstChar = alphabet.charAt(Math.floor(Math.random() * 26)); // 随机选择一个字母作为开头
        let id = firstChar;

        for (let i = 1; i < length; i++) {
            const randomChar = characters.charAt(Math.floor(Math.random() * characters.length));
            id += randomChar;
        }

        return id;
    }

    getLevel(space: string, doc: Doc | string) {
        if (typeof doc === 'string' && doc === 'root') {
            return 1
        }

        const docs = this.get(space)

        if (typeof doc === 'string') {
            doc = this.findDocBy(docs, 'id', doc) as Doc
        }

        if (!doc) {
            return
        }

        let level = 1
        let parentId = doc.parentId
        while (parentId) {
            level++
            const parentDoc = this.findDocBy(docs, 'id', parentId)
            if (!parentDoc) {
                break
            }
            parentId = parentDoc.parentId
        }

        return level
    }
}