import { defineStore } from "pinia";
import { useBooksApi } from "@/api/books";
import { useDocsApi } from "@/api/docs";
import { UseBooksApiFunction, UseDocsApiFunction, UsePermissionsApiFunction } from "@/types/api";
import { Book, Doc, DocData } from "@/types/global";
import { useDocsEventBus } from "@/events/docs";

export const useDocsStore = defineStore('docs', {
    state: () => ({
        book: {},
        bookPermissionAuthType: 0,

        spaceData: {},
        dir: {},

        doc: {} as Doc,

        booksApi: {} as UseBooksApiFunction,
        docsApi: {} as UseDocsApiFunction,
        permissionsApi: {} as UsePermissionsApiFunction,
    } as {
        book: Book,
        bookPermissionAuthType: number,

        spaceData: Record<string, DocData>,
        dir: Doc,

        doc: Doc,

        booksApi: UseBooksApiFunction,
        docsApi: UseDocsApiFunction,
        permissionsApi: UsePermissionsApiFunction,
    }),

    actions: {
        async refreshCurrentBook(bookSlug: string): Promise<boolean> {
            // 判断 bookSlug 是否有变化
            if (this.book && this.book.slug === bookSlug) {
                return true
            }

            this.booksApi = useBooksApi('localStorage')
            this.book = await this.booksApi.get(bookSlug) as Book
            if (!this.book) {
                return false
            }

            this.docsApi = useDocsApi('localStorage', this.spaceData)
            await this.docsApi.init(bookSlug)

            this.dir = await this.docsApi.dir(bookSlug) as Doc;
            if (!this.dir) {
                return false
            }

            const docsEventBus = useDocsEventBus()
            docsEventBus.onDirChange(bookSlug, async (event, { space, dir }) => {
                this.dir = await this.docsApi.dir(bookSlug, true) as Doc;
            })
            docsEventBus.onAnyDocContentChange(bookSlug, async (event, { space, slug, doc }) => {
                this.book = await this.booksApi.get(bookSlug) as Book
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