import { defineStore } from "pinia";
import { useBooksApi } from "@/api/books";
import { useDocsApi } from "@/api/docs";
import { UseDocsApiFunction } from "@/types/api";
import { Book, Doc, DocData } from "@/types/global";
import { useDocsEventBus } from "@/events/docs";

export const useDocsStore = defineStore('docs', {
    state: () => ({
        book: {},

        spaceData: {},
        dir: {},

        doc: {},

        docsApi: {},
    } as {
        book: Book,

        spaceData: Record<string, DocData>,
        dir: Doc,

        doc: Doc,

        docsApi: UseDocsApiFunction,
    }),

    actions: {
        async refreshCurrentBook(bookSlug: string): Promise<boolean> {
            // 判断 bookSlug 是否有变化
            if (this.book && this.book.slug === bookSlug) {
                return true
            }

            const booksApi = useBooksApi('localStorage')
            this.book = await booksApi.get(bookSlug) as Book
            if (!this.book) {
                return false
            }

            this.docsApi = useDocsApi('localStorage', this.spaceData)
            await this.docsApi.init(bookSlug)

            this.dir = await this.docsApi.dir(bookSlug, true) as Doc;
            if (!this.dir) {
                return false
            }

            const docsEventBus = useDocsEventBus()
            docsEventBus.onDirChange(bookSlug, async (event, { space, dir }) => {
                this.dir = await this.docsApi.dir(bookSlug, true) as Doc;

                // 找到当前 doc，然后用最新的 dir 更新当前 doc 的 parentId、parentSlug、title、sort
                const array = this.docsApi.tree2array(this.dir) as Doc[]
                array.forEach((doc: Doc) => {
                    if (doc.slug === this.doc.slug) {
                        this.doc.parentId = doc.parentId
                        this.doc.parentSlug = doc.parentSlug
                        this.doc.title = doc.title
                        this.doc.sort = doc.sort
                    }
                })
            })

            return true
        },
        async refreshCurrentDoc(bookSlug: string, docSlug: string): Promise<boolean> {
            // 判断 bookSlug 是否是当前 book
            if (!this.book || this.book.slug !== bookSlug) {
                return false
            }

            this.doc = await this.docsApi.get(bookSlug, docSlug) as Doc;
            if (!this.doc) {
                return false
            }

            return true
        },
    },
})