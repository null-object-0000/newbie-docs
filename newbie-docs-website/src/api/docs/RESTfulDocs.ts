import { Doc } from "@/types/global";
import { UseDocsApiFunction } from "@/types/api";
import axiso, { AxiosError } from "axios";
import { UseLocalStorageDocsApi } from "./LocalStorageDocs";
import { BaseUseDocsApi } from "./base";

const lastLocalPutTimes = {} as Record<string, number>
const lastRemotePutTimes = {} as Record<string, number>
let syncTask: Promise<void> | undefined

export class UseRESTfulDocsApi extends BaseUseDocsApi implements UseDocsApiFunction {
    localStorageDocsApi: UseLocalStorageDocsApi

    constructor(spaceData: Record<string, any>) {
        super()

        this.localStorageDocsApi = new UseLocalStorageDocsApi(spaceData, { localStorageCacheKey: 'newbie_docs_restful' });
    }

    async init(space: string): Promise<void> {
        localStorage.removeItem('newbie_docs_restful_' + space)
        const remoteDocs = await this.get(space)
        this.localStorageDocsApi.__updateCache('init', space, super.tree2array(remoteDocs))

        const submitScheduledTask = async (task: Function, fixedDelay: number) => {
            const promise = new Promise<void>(async () => {
                while (true) {
                    try {
                        await task()
                    } catch (error) {

                    }
                    await new Promise(resolve => setTimeout(resolve, fixedDelay))
                }
            })

            return promise
        }

        if (syncTask === undefined) {
            // 每隔 x 秒同步一次，若有新的 put，则同步
            syncTask = submitScheduledTask(async () => {
                const keys = Object.keys(lastLocalPutTimes)

                for (let i = 0; i < keys.length; i++) {
                    const key = keys[i]
                    const lastLocalPutTime = lastLocalPutTimes[key]
                    const lastRemotePutTime = lastRemotePutTimes[key] || 0

                    const bookSlug = key.split('/')[0]
                    const docSlug = key.split('/')[1]

                    if (lastLocalPutTime - lastRemotePutTime > 1500) {
                        const localDoc = await this.localStorageDocsApi.get(bookSlug, docSlug)
                        if (localDoc) {
                            const result = await this.remotePut(space, localDoc)
                            if (result) {
                                lastRemotePutTimes[key] = Date.now()
                            } else {
                                console.error(`同步失败：${bookSlug}/${docSlug}`)
                            }
                        }
                    }
                }
            }, 500)
        }
    }

    async dir(space: string, forceRemote?: boolean): Promise<Doc | undefined> {
        const results = await this.localStorageDocsApi.dir(space)
        if (results && forceRemote !== true) {
            return results
        }

        const { data: response } = await axiso({
            method: 'get',
            baseURL: import.meta.env.VITE_REST_API_BASE_URL,
            url: '/docs/dir',
            headers: {
                'newbie-docs-book-slug': space
            },
            params: {
                space: space
            }
        })

        if (response && response.code === '0000') {
            return response.result as Doc
        }
    }

    async get(space: string, slug?: string, forceRemote?: boolean): Promise<Doc | undefined> {
        const results = await this.localStorageDocsApi.get(space, slug)
        if (results && forceRemote !== true) {
            return results
        }

        const { data: response } = await axiso({
            method: 'get',
            baseURL: import.meta.env.VITE_REST_API_BASE_URL,
            url: '/docs/get',
            headers: {
                'newbie-docs-book-slug': space
            },
            params: {
                space: space,
                slug
            }
        })

        if (response && response.code === '0000') {
            return response.result as Doc
        } else {
            throw new AxiosError(response.message, response.code)
        }
    }

    async getById(space: string, id: number, forceRemote?: boolean): Promise<Doc | undefined> {
        const results = await this.localStorageDocsApi.getById(space, id)
        if (results && forceRemote !== true) {
            return results
        }

        const { data: response } = await axiso({
            method: 'get',
            baseURL: import.meta.env.VITE_REST_API_BASE_URL,
            url: '/docs/getById',
            headers: {
                'newbie-docs-book-slug': space
            },
            params: {
                space: space,
                id
            }
        })

        if (response && response.code === '0000') {
            return response.result as Doc
        } else {
            throw new AxiosError(response.message, response.code)
        }
    }

    async put(space: string, doc: Doc, forceRemote?: boolean): Promise<boolean> {
        const isCreate = doc.id === undefined || doc.id === null || doc.id <= 0

        if (isCreate || forceRemote === true) {
            // 新建文档时因为需要获取 id，所以需要先远程 put，再本地 put
            return await this.remotePut(space, doc)
        } else {
            const localStorage = await this.localStorageDocsApi.put(space, doc)
            if (!localStorage) {
                return false
            }

            lastLocalPutTimes[doc.bookSlug + '/' + doc.slug] = Date.now()

            return true
        }
    }

    async remotePut(space: string, doc: Doc): Promise<boolean> {
        const { data: response } = await axiso({
            method: 'post',
            baseURL: import.meta.env.VITE_REST_API_BASE_URL,
            url: '/docs/put',
            headers: {
                'newbie-docs-book-slug': space
            },
            data: {
                id: doc.id,
                slug: doc.slug,
                parentId: doc.parentId,
                title: doc.title,
                editor: doc.editor,
                content: doc.editor == 2 && typeof doc.content !== 'string' ? JSON.stringify(doc.content) : doc.content,
                sort: doc.sort,
            }
        })

        const restful = response && response.code === '0000' && response.result > 0
        if (restful) {
            doc = await this.getById(space, response.result, true) as Doc
            const localStorage = await this.localStorageDocsApi.put(space, doc)
            return restful && localStorage
        } else {
            throw new AxiosError(response.message, response.code)
        }
    }

    async exists(space: string, slug: string): Promise<boolean> {
        const { data: response } = await axiso({
            method: 'get',
            baseURL: import.meta.env.VITE_REST_API_BASE_URL,
            url: '/docs/exists',
            headers: {
                'newbie-docs-book-slug': space
            },
            params: {
                space: space,
                slug: slug
            }
        })

        if (response && response.code === '0000') {
            return response.result as boolean
        } else {
            throw new Error(`[${response.code}] ${response.message}`)
        }
    }

    async remove(space: string, id: number): Promise<boolean> {
        const { data: response } = await axiso({
            method: 'post',
            baseURL: import.meta.env.VITE_REST_API_BASE_URL,
            url: '/docs/remove',
            headers: {
                'newbie-docs-book-slug': space
            },
            data: {
                space,
                id
            }
        })

        const restful = response && response.code === '0000'
        if (restful) {
            const localStorage = await this.localStorageDocsApi.remove(space, id)
            return restful && localStorage
        } else {
            throw new Error(`[${response.code}] ${response.message}`)
        }
    }

    async move(space: string, dropPosition: number, dragDocId: number, dropDocId: number): Promise<boolean> {
        const { data: response } = await axiso({
            method: 'post',
            baseURL: import.meta.env.VITE_REST_API_BASE_URL,
            url: '/docs/move',
            headers: {
                'newbie-docs-book-slug': space
            },
            data: {
                space,
                dropPosition,
                dragDocId,
                dropDocId
            }
        })

        const restful = response && response.code === '0000'
        if (restful) {
            const localStorage = await this.localStorageDocsApi.move(space, dropPosition, dragDocId, dropDocId)
            return restful && localStorage
        } else {
            throw new Error(`[${response.code}] ${response.message}`)
        }
    }

    async changeSlug(space: string, oldSlug: string, newSlug: string): Promise<boolean> {
        const { data: response } = await axiso({
            method: 'post',
            baseURL: import.meta.env.VITE_REST_API_BASE_URL,
            url: '/docs/changeSlug',
            headers: {
                'newbie-docs-book-slug': space
            },
            data: {
                space,
                oldSlug: oldSlug,
                newSlug: newSlug
            }
        })

        const restful = response && response.code === '0000'
        if (restful) {
            const localStorage = await this.localStorageDocsApi.changeSlug(space, oldSlug, newSlug)
            return restful && localStorage
        } else {
            throw new Error(`[${response.code}] ${response.message}`)
        }
    }

    async changeTitle(space: string, id: number, newTitle: string): Promise<boolean> {
        const { data: response } = await axiso({
            method: 'post',
            baseURL: import.meta.env.VITE_REST_API_BASE_URL,
            url: '/docs/changeTitle',
            headers: {
                'newbie-docs-book-slug': space
            },
            data: {
                space,
                id,
                newTitle: newTitle
            }
        })

        const restful = response && response.code === '0000'
        if (restful) {
            const localStorage = await this.localStorageDocsApi.changeTitle(space, id, newTitle)
            return restful && localStorage
        } else {
            throw new Error(`[${response.code}] ${response.message}`)
        }
    }

}