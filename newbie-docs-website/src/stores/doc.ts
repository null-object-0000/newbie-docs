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

            this.dir = await this.docsApi.dir(bookSlug, false) as Doc;
            if (!this.dir) {
                return false
            }

            // 先从本地获取 dir，然后异步更新 dir
            this.docsApi.dir(bookSlug, true)
                .then((dir: Doc | undefined) => {
                    if (dir) {
                        this.dir = dir
                    }
                })


            const docsEventBus = useDocsEventBus()
            docsEventBus.onDirChange(bookSlug, async (event, { space, dir }) => {
                this.dir = await this.docsApi.dir(bookSlug, true) as Doc;

                // 找到当前 doc，然后用最新的 dir 更新当前 doc 的 parentId、title、sort
                const array = this.docsApi.tree2array(this.dir) as Doc[]
                array.forEach((doc: Doc) => {
                    if (doc.id === this.doc.id) {
                        // 除了 content 外，其他的都更新
                        const keys = Object.keys(doc)
                        keys.forEach((key: string) => {
                            if (key !== 'content') {
                                // @ts-ignore
                                this.doc[key as keyof Doc] = doc[key as keyof Doc]
                            }
                        })
                    }
                })
            })

            return true
        },
        async refreshCurrentDoc(bookSlug: string, docSlug: string, forceRemote?: boolean): Promise<boolean> {
            // 判断 bookSlug 是否是当前 book
            if (!this.book || this.book.slug !== bookSlug) {
                return false
            }

            if (forceRemote === true) {
                this.doc = await this.docsApi.get(bookSlug, docSlug, true) as Doc;
            } else {
                // 先从本地获取 doc，然后异步更新 doc
                this.doc = await this.docsApi.get(bookSlug, docSlug, false) as Doc;
            }

            if (!this.doc) {
                return false
            }

            if (forceRemote !== true) {
                this.docsApi.get(bookSlug, docSlug, true)
                    .then((doc: Doc | undefined) => {
                        if (doc && this.doc.id === doc.id) {
                            this.doc = doc
                        }
                    })
            }

            return true
        },
    },
})