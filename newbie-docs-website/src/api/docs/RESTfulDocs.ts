import { Doc } from "@/types/global";
import { UseDocsApiFunction } from "@/types/api";
import axiso from "axios";
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

    async get(space: string, slug?: string): Promise<Doc | undefined> {
        const results = await this.localStorageDocsApi.get(space, slug)
        if (results) {
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
                slug: slug
            }
        })

        if (response && response.code === '0000') {
            return response.result as Doc
        }
    }

    async put(space: string, doc: Doc): Promise<boolean> {
        const isCreate = doc.id === undefined || doc.id === null || doc.id <= 0

        if (isCreate) {
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
                parentSlug: doc.parentSlug,
                title: doc.title,
                editor: doc.editor,
                content: doc.editor == 2 && typeof doc.content !== 'string' ? JSON.stringify(doc.content) : doc.content,
                sort: doc.sort,
            }
        })

        const restful = response && response.code === '0000' && response.result > 0
        if (restful) {
            doc.id = response.result
            const localStorage = await this.localStorageDocsApi.put(space, doc)
            return restful && localStorage
        } else {
            throw new Error(`[${response.code}] ${response.message}`)
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

    async remove(space: string, slug: string): Promise<boolean> {
        const { data: response } = await axiso({
            method: 'post',
            baseURL: import.meta.env.VITE_REST_API_BASE_URL,
            url: '/docs/const',
            headers: {
                'newbie-docs-book-slug': space
            },
            data: {
                space: space,
                slug: slug
            }
        })

        const restful = response && response.code === '0000'
        if (restful) {
            const localStorage = await this.localStorageDocsApi.remove(space, slug)
            return restful && localStorage
        } else {
            throw new Error(`[${response.code}] ${response.message}`)
        }
    }

    async splice(space: string, slug: string, index: number): Promise<boolean> {
        const { data: response } = await axiso({
            method: 'post',
            baseURL: import.meta.env.VITE_REST_API_BASE_URL,
            url: '/docs/splice',
            headers: {
                'newbie-docs-book-slug': space
            },
            data: {
                space: space,
                slug: slug,
                index: index
            }
        })

        const restful = response && response.code === '0000'
        if (restful) {
            const localStorage = await this.localStorageDocsApi.splice(space, slug, index)
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
                space: space,
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

    async changeParentSlug(space: string, slug: string, parentSlug: string): Promise<boolean> {
        const { data: response } = await axiso({
            method: 'post',
            baseURL: import.meta.env.VITE_REST_API_BASE_URL,
            url: '/docs/changeParentSlug',
            headers: {
                'newbie-docs-book-slug': space
            },
            data: {
                space: space,
                slug: slug,
                parentSlug: parentSlug
            }
        })

        const restful = response && response.code === '0000'
        if (restful) {
            const localStorage = await this.localStorageDocsApi.changeParentSlug(space, slug, parentSlug)
            return restful && localStorage
        } else {
            throw new Error(`[${response.code}] ${response.message}`)
        }
    }

    async changeTitle(space: string, slug: string, newTitle: string): Promise<boolean> {
        const { data: response } = await axiso({
            method: 'post',
            baseURL: import.meta.env.VITE_REST_API_BASE_URL,
            url: '/docs/changeTitle',
            headers: {
                'newbie-docs-book-slug': space
            },
            data: {
                space: space,
                slug: slug,
                newTitle: newTitle
            }
        })

        const restful = response && response.code === '0000'
        if (restful) {
            const localStorage = await this.localStorageDocsApi.changeTitle(space, slug, newTitle)
            return restful && localStorage
        } else {
            throw new Error(`[${response.code}] ${response.message}`)
        }
    }

    async findIndex(space: string, slug: string): Promise<number | undefined> {
        const { data: response } = await axiso({
            method: 'get',
            baseURL: import.meta.env.VITE_REST_API_BASE_URL,
            url: '/docs/findIndex',
            headers: {
                'newbie-docs-book-slug': space
            },
            params: {
                space: space,
                slug: slug
            }
        })

        if (response && response.code === '0000') {
            return response.result as number
        }
    }

    async getTotalDocCount(space: string): Promise<number> {
        const { data: response } = await axiso({
            method: 'get',
            baseURL: import.meta.env.VITE_REST_API_BASE_URL,
            url: '/docs/getTotalDocCount',
            headers: {
                'newbie-docs-book-slug': space
            },
            params: {
                space: space
            }
        })

        if (response && response.code === '0000') {
            return response.result as number
        } else {
            throw new Error(`[${response.code}] ${response.message}`)
        }
    }

    async getTotalWordCount(space: string): Promise<number> {
        const { data: response } = await axiso({
            method: 'get',
            baseURL: import.meta.env.VITE_REST_API_BASE_URL,
            url: '/docs/getTotalWordCount',
            headers: {
                'newbie-docs-book-slug': space
            },
            params: {
                space: space
            }
        })

        if (response && response.code === '0000') {
            return response.result as number
        } else {
            throw new Error(`[${response.code}] ${response.message}`)
        }
    }
}