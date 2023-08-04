import { Doc, UseDocsApiFunction } from "@/types/global";

export abstract class BaseUseDocsApi implements UseDocsApiFunction {
    abstract init(space: string): Promise<void>;
    abstract dir(space: string): Promise<Doc | undefined>;
    abstract get(space: string, slug?: string): Promise<Doc | undefined>;
    abstract put(space: string, doc: Doc): Promise<boolean>;
    abstract exists(space: string, slug: string): Promise<boolean>;
    abstract remove(space: string, slug: string): Promise<boolean>;
    abstract splice(space: string, slug: string, index: number): Promise<boolean>;
    abstract changeSlug(space: string, oldSlug: string, newSlug: string): Promise<boolean>;
    abstract changeParentSlug(space: string, slug: string, parentSlug: string): Promise<boolean>;
    abstract changeTitle(space: string, slug: string, newTitle: string): Promise<boolean>;
    abstract getTotalDocCount(space: string): Promise<number>;
    abstract getTotalWordCount(space: string): Promise<number>;

    isValidDoc(docs?: Doc | Doc[]): boolean {
        if (!docs) {
            return false
        }

        if (!Array.isArray(docs)) {
            docs = [docs]
        }

        for (const doc of docs) {
            const result = doc.id && doc.id > 0 && typeof doc.id === 'number'
                && doc.slug && doc.slug.length > 0 && typeof doc.slug === 'string'
                && doc.title && doc.title.length > 0 && typeof doc.title === 'string'
                && doc.sort !== undefined && typeof doc.sort === 'number'
                && doc.createTime !== undefined && typeof doc.createTime === 'number'

            if (result !== true) {
                console.log('doc is invalid', JSON.stringify(doc))
                return false
            }

            if (!doc.child || doc.child.length <= 0) {
                return true
            }

            for (const child of doc.child) {
                if (!this.isValidDoc(child)) {
                    return false
                }
            }
        }

        return true
    }

    array2tree(docs?: Doc | Doc[]): Doc | undefined {
        if (!docs || !Array.isArray(docs)) {
            return docs
        }


        docs = JSON.parse(JSON.stringify(docs)) as Doc[]

        const rootDoc = docs.find(doc => doc.slug === 'root')
        if (!rootDoc) {
            return
        }

        const processChild = (doc: Doc) => {
            docs = docs as Doc[]
            doc.child = docs.filter(item => item.parentSlug === doc.slug).sort((a, b) => a.sort! - b.sort!)

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

        docs = JSON.parse(JSON.stringify(docs)) as Doc

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
        const rootId = Math.ceil(Math.random() * 1000000000)
        const rootSlug = 'root'

        const tree = {
            id: rootId,
            slug: rootSlug,
            editor: 'block',
            // TODO: 这里的 title 应该是从后端获取的，暂时写死
            title: "万象开放平台 - 营销产品部",
            path: "/" + space,
            sort: 0,
            createTime: new Date().getTime(),
            child: [
                {
                    id: Math.ceil(Math.random() * 1000000000),
                    slug: 'home',
                    parentId: rootId,
                    parentSlug: rootSlug,
                    editor: 'block',
                    title: "首页",
                    path: `/${space}/home`,
                    sort: 0,
                    createTime: new Date().getTime(),
                    child: []
                }
            ]
        } as Doc

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

    async findChild(data: Doc | Doc[] | undefined, parentSlug: string): Promise<Doc[] | undefined> {
        if (!data) {
            return
        }

        data = Array.isArray(data) ? data : this.tree2array(data) as Doc[]
        return data.filter(doc => doc.parentSlug === parentSlug)
    }

    async generateSlug(length: number): Promise<string> {
        const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
        const alphabet = 'abcdefghijklmnopqrstuvwxyz';
        const firstChar = alphabet.charAt(Math.floor(Math.random() * 26)); // 随机选择一个字母作为开头
        let slug = firstChar;

        for (let i = 1; i < length; i++) {
            const randomChar = characters.charAt(Math.floor(Math.random() * characters.length));
            slug += randomChar;
        }

        return slug;
    }

    async getLevel(space: string, doc: Doc | string): Promise<number | undefined> {
        if (typeof doc === 'string' && doc === 'root') {
            return 1
        }

        const docs = await this.get(space)

        if (typeof doc === 'string') {
            doc = this.findDocBy(docs, 'slug', doc) as Doc
        }

        if (!doc) {
            return
        }

        let level = 1
        let parentSlug = doc.parentSlug
        while (parentSlug) {
            level++
            const parentDoc = this.findDocBy(docs, 'slug', parentSlug)
            if (!parentDoc) {
                break
            }
            parentSlug = parentDoc.parentSlug
        }

        return level
    }
}