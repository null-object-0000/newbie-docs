import { defineStore } from "pinia";
import { useBooksApi } from "@/api/books";
import { useDocsApi } from "@/api/docs";
import { UseDocsApiFunction } from "@/types/api";
import { Book, Doc, DocData } from "@/types/global";
import { useDocsEventBus } from "@/events/docs";
import { Notification, type NotificationConfig } from '@arco-design/web-vue';
import { AxiosError } from "axios";

export const useDocsStore = defineStore('docs', {
    state: () => ({
        bookId: -1,
        bookSlug: '',

        book: {},

        spaceData: {},
        dir: {},

        doc: {},

        docsApi: {},
    } as {
        bookId: number,
        bookSlug: string,

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
            const book = await booksApi.get(bookSlug) as Book
            if (!book) {
                return false
            }

            this.bookId = book.id
            this.bookSlug = book.slug
            this.book = book

            this.docsApi = useDocsApi('localStorage', this.spaceData)
            await this.docsApi.init(bookSlug)

            // 先从本地获取 dir，然后异步更新 dir
            const dir = await this.docsApi.dir(bookSlug, false) as Doc;
            if (!dir || !dir.children || dir.children.length <= 0) {
                return false
            }

            this.dir = dir

            this.docsApi.dir(bookSlug, true)
                .then((dir: Doc | undefined) => {
                    if (dir && dir.children && dir.children.length > 0) {
                        this.dir = dir
                    }
                }).catch((error: Error) => {
                    if (error instanceof AxiosError) {
                        Notification.error({
                            title: '请注意当前预览内容可能不是最新的，远程获取最新文档目录失败，请稍后再试',
                            style: {
                                top: '50px',
                            },
                            duration: 5000,
                        } as NotificationConfig)
                    }

                    console.error(error)
                })


            const docsEventBus = useDocsEventBus()
            docsEventBus.onDirChange(bookSlug, async (event, { space, dir }) => {
                dir = await this.docsApi.dir(bookSlug, true) as Doc;

                // 找到当前 doc，然后用最新的 dir 更新当前 doc 的 parentId、title、sort
                const array = this.docsApi.tree2array(dir, false) as Doc[]
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

                if (dir && dir.children && dir.children.length > 0) {
                    this.dir = dir
                }
            })

            return true
        },
        async refreshCurrentDoc(bookSlug: string, docSlug: string, forceRemote?: boolean): Promise<boolean> {
            // 判断 bookSlug 是否是当前 book
            if (!this.book || this.book.slug !== bookSlug) {
                return false
            }

            try {
                let doc;
                if (forceRemote === true) {
                    doc = await this.docsApi.get(bookSlug, docSlug, true) as Doc;
                } else {
                    // 先从本地获取 doc，然后异步更新 doc
                    doc = await this.docsApi.get(bookSlug, docSlug, false) as Doc;
                }

                if (!doc) {
                    return false
                } else {
                    this.doc = doc
                }

                if (forceRemote !== true) {
                    this.docsApi.get(bookSlug, docSlug, true)
                        .then((doc: Doc | undefined) => {
                            if (doc && this.doc.id === doc.id) {
                                this.doc = doc
                            }
                        }).catch((error: Error) => {
                            if (error instanceof AxiosError) {
                                Notification.error({
                                    title: '请注意当前预览内容可能不是最新的，远程获取最新文档内容失败，请稍后再试',
                                    style: {
                                        top: '50px',
                                    },
                                    duration: 5000,
                                } as NotificationConfig)
                            }

                            console.error(error)
                        })
                }

                return true
            } catch (error) {
                console.error(error)
                return false
            }
        },
    },
})