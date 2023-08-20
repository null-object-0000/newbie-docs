import { defineStore } from "pinia";
import { useBooksApi } from "@/api/books";
import { useDocsApi } from "@/api/docs";
import { UseDocsApiFunction } from "@/types/api";
import { Book, Doc, DocData, NewbieEditor } from "@/types/global";
import { useDocsEventBus } from "@/events/docs";
import { Notification, NotificationReturn, type NotificationConfig } from '@arco-design/web-vue';
import { AxiosError } from "axios";
import { h } from "vue";
import { IconCheckCircleFill, IconCloseCircleFill, IconLoading } from "@arco-design/web-vue/es/icon";

// ts Window 添加属性
declare global {
    interface Window {
        docEditPutVersion: {
            local: string,
            remote: string,
            preventDefault: (event: Event) => void
        }
    }
}
window.docEditPutVersion = {
    local: '',
    remote: '',
    preventDefault: function (event: Event) {
        console.log('docEditPutVersion', window.docEditPutVersion.local, window.docEditPutVersion.remote)
        if (window.docEditPutVersion.local === window.docEditPutVersion.remote) {
            return;
        } else {
            event.preventDefault();
            // @ts-ignore
            event.returnValue = '';
        }
    }
}

export const useDocsStore = defineStore('docs', {
    state: () => ({
        bookId: -1 as number,
        bookSlug: '' as string,

        book: {} as Book,

        spaceData: {} as Record<string, DocData>,
        dir: {} as Doc,

        doc: {} as Doc,

        docsApi: {} as UseDocsApiFunction,

        docPuting: false as boolean,
        lastDocContent: {} as Record<string, string>,
        historyNotification: [] as NotificationReturn[],

        editor: {} as NewbieEditor,
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


        refreshDocEditor(editor: NewbieEditor) {
            this.editor = editor
        },



        initContnetCache(doc: Doc) {
            this.lastDocContent[doc.slug] = doc.title + doc.content
        },
        clearContentCache(doc: Doc) {
            delete this.lastDocContent[doc.slug]
        },
        checkContnetIsChanged(doc: Doc) {
            const content = doc.title + doc.content
            if (this.lastDocContent[doc.slug] !== content) {
                this.lastDocContent[doc.slug] = content;
                return true;
            } else {
                return false;
            }
        },
        async onContentChange(event: Event, { title, content, forceRemote }: { title?: string, content?: string, forceRemote?: boolean }) {
            const doc = JSON.parse(JSON.stringify(this.doc)) as Doc;
            doc.title = title || doc.title;
            doc.content = content || doc.content;
            doc.updateTime = new Date().getTime()

            if (this.editor && this.editor.type === doc.editor) {
                doc.content = await this.editor.getContent()
            }

            const closeAllHistoryNotification = () => {
                this.historyNotification.forEach((item) => {
                    item.close()
                })
            }

            const putingNotification = () => {
                closeAllHistoryNotification()

                return Notification.info({
                    id: 'newbie-docs-save-notification-' + doc.slug,
                    class: 'newbie-docs-save-notification',
                    icon: () => {
                        return h(IconLoading)
                    },
                    title: '正在保存文档',
                    duration: 0,
                } as NotificationConfig)
            }

            const putSuccessNotification = (more?: boolean) => {
                if (more === true) {
                    // 保留最近的 3 个通知
                    if (this.historyNotification.length > 2) {
                        this.historyNotification.shift()?.close()
                    }

                    const notificationInstance = Notification.success({
                        class: 'newbie-docs-save-notification',
                        title: '文档已保存',
                        duration: 3000,
                    } as NotificationConfig)

                    this.historyNotification.push(notificationInstance)
                } else {
                    closeAllHistoryNotification()

                    return Notification.success({
                        id: 'newbie-docs-save-notification-' + doc.slug,
                        class: 'newbie-docs-save-notification',
                        icon: () => {
                            return h(IconCheckCircleFill)
                        },
                        title: '文档已保存',
                        duration: 3000,
                    } as NotificationConfig)
                }
            }

            const putFailedNotification = () => {
                closeAllHistoryNotification()

                return Notification.error({
                    id: 'newbie-docs-save-notification-' + doc.slug,
                    class: 'newbie-docs-save-notification',
                    icon: () => {
                        return h(IconCloseCircleFill)
                    },
                    title: '文档保存失败',
                    duration: 3000,
                } as NotificationConfig)
            }

            try {
                if (this.docPuting === true) {
                    console.warn('正在保存文档，不需要再次保存')
                    return
                }

                if (!this.checkContnetIsChanged(doc) && window.docEditPutVersion.local === window.docEditPutVersion.remote) {
                    if (forceRemote === true) {
                        putSuccessNotification(true)
                    }

                    console.log('文档内容没有变化，不需要保存')
                    return false;
                }

                if (forceRemote === true) {
                    putingNotification()
                }

                this.docPuting = forceRemote === true

                // 如果本地与远程版本号不一致就强制更新 doc remote version
                if (forceRemote === true && window.docEditPutVersion.local !== window.docEditPutVersion.remote) {
                    const remoteDoc = await this.docsApi.getById(this.bookSlug, doc.id, true) as Doc
                    if (remoteDoc) {
                        window.docEditPutVersion.remote = remoteDoc.version

                        // 如果内容一致，就更新本地版本号
                        if (window.docEditPutVersion.local !== window.docEditPutVersion.remote && remoteDoc.content === doc.content) {
                            window.docEditPutVersion.local = remoteDoc.version
                            console.warn('本地版本号与远程版本号不一致但是此时内容一致，强制更新本地版本号')
                        } else {
                            this.clearContentCache(doc)
                        }
                    }
                }

                try {
                    if (await this.docsApi.put(this.bookSlug, doc, forceRemote)) {
                        if (forceRemote === true) {
                            putSuccessNotification()
                        }
                    } else {
                        if (forceRemote === true) {
                            putFailedNotification()
                        }
                    }
                } catch (error: any) {
                    if (error instanceof AxiosError) {
                        putFailedNotification()
                    } else {
                        throw error
                    }
                } finally {
                    if (forceRemote === true) {
                        setTimeout(() => {
                            this.docPuting = false
                        }, 550);
                    }
                }
            } catch (error) {
                console.error(error)
            }
        }
    },
})