import { Book, Doc } from "@/types/global";
import { UseDocsApiFunction } from "@/types/api";

export abstract class BaseUseDocsApi implements UseDocsApiFunction {
    abstract init(space: string): Promise<void>;
    abstract dir(space: string): Promise<Doc | undefined>;
    abstract get(space: string, slug?: string): Promise<Doc | undefined>;
    abstract getById(space: string, id?: number): Promise<Doc | undefined>;
    abstract put(space: string, doc: Doc): Promise<boolean>;
    abstract exists(space: string, slug: string): Promise<boolean>;
    abstract remove(space: string, id: number): Promise<boolean>;
    abstract move(space: string, id: number, targetIndex: number, targetParentId: number): Promise<boolean>;
    abstract changeSlug(space: string, oldSlug: string, newSlug: string): Promise<boolean>;
    abstract changeTitle(space: string, id: number, newTitle: string): Promise<boolean>;

    abstract tryLock(space: string, id: number): Promise<boolean>;
    abstract tryUnlock(space: string, id: number): Promise<boolean>;

    isValidDoc(docs?: Doc | Doc[]): boolean {
        if (!docs) {
            return false
        }

        if (!Array.isArray(docs)) {
            docs = [docs]
        }

        for (const doc of docs) {
            const result = doc.id && doc.id > 0 && typeof doc.id === 'number'
                && doc.bookId && doc.bookId > 0 && typeof doc.bookId === 'number'
                && doc.bookSlug && doc.bookSlug.length > 0 && typeof doc.bookSlug === 'string'
                && doc.slug && doc.slug.length > 0 && typeof doc.slug === 'string'
                && doc.parentId !== undefined && typeof doc.parentId === 'number'
                && doc.title && doc.title.length > 0 && typeof doc.title === 'string'
                && doc.sort !== undefined && typeof doc.sort === 'number'
                && doc.createTime !== undefined && typeof doc.createTime === 'number'

            if (result !== true) {
                console.warn('doc is invalid', JSON.stringify(doc))
                return false
            }

            if (!doc.children || doc.children.length <= 0) {
                return true
            }

            for (const child of doc.children) {
                if (!this.isValidDoc(child)) {
                    return false
                }
            }
        }

        return true
    }

    array2tree(docs?: Doc | Doc[], deepClone = true): Doc | undefined {
        if (!docs || !Array.isArray(docs)) {
            return docs
        }

        if (deepClone === true) {
            docs = JSON.parse(JSON.stringify(docs)) as Doc[]
        }

        const rootDoc = docs.find(doc => doc.slug === 'root')
        if (!rootDoc) {
            return
        }

        const processChild = (doc: Doc) => {
            docs = docs as Doc[]
            doc.children = docs.filter(item => item.parentId === doc.id).sort((a, b) => a.sort! - b.sort!)

            for (const child of doc.children) {
                processChild(child)
            }
        }

        processChild(rootDoc)

        return rootDoc
    }

    tree2array(docs?: Doc, deepClone = true): Doc[] | undefined {
        if (!docs) {
            return
        }

        if (deepClone === true) {
            docs = JSON.parse(JSON.stringify(docs)) as Doc
        }

        const result: Doc[] = []

        const processChild = (doc: Doc) => {
            result.push(doc)

            if (doc.children) {
                for (const child of doc.children) {
                    processChild(child)
                }
            }
        }

        processChild(docs)

        for (const doc of result) {
            delete doc.children
        }

        return result
    }

    getDefaultDocs(book: Book): Doc[] {
        const rootId = Math.ceil(Math.random() * 1000000000)
        const rootSlug = 'root'

        const tree = {
            bookId: book.id,
            bookSlug: book.slug,

            id: rootId,
            slug: rootSlug,
            parentId: 0,
            editor: 1,
            wordsCount: 0,
            content: '',
            title: book.title,
            path: "/" + book.slug,
            sort: 0,
            creator: 'system',
            createTime: new Date().getTime(),
            children: [
                {
                    bookId: book.id,
                    bookSlug: book.slug,

                    id: Math.ceil(Math.random() * 1000000000),
                    slug: 'home',
                    parentId: rootId,
                    editor: 1,
                    wordsCount: 0,
                    content: '',
                    title: "首页",
                    path: `/${book.slug}/home`,
                    sort: 0,
                    creator: 'system',
                    createTime: new Date().getTime(),
                    children: []
                }
            ]
        } as Doc

        return this.tree2array(tree) as Doc[]
    }

    findDocBy(docs: Doc | undefined, key: string, value: any): Doc | undefined {
        if (docs === undefined) {
            return
        }

        if (docs[key as keyof Doc] == value) {
            return docs
        }

        if (docs.children) {
            for (const doc of docs.children) {
                const findDoc = this.findDocBy(doc, key, value)
                if (findDoc) {
                    return findDoc
                }
            }
        }
    }

    async findChild(data: Doc | Doc[] | undefined, parentId: number): Promise<Doc[] | undefined> {
        if (!data) {
            return
        }

        data = Array.isArray(data) ? data : this.tree2array(data) as Doc[]
        return data.filter(doc => doc.parentId === parentId)
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

}