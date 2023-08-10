import { Doc } from "@/types/global";
import { UseEventBusReturn, useEventBus } from "@vueuse/core";

export const useDocsEventBus = () => {
    return {
        __getDirChangeEventBus(space: string): UseEventBusReturn<{ event: Event, space: string; dir: Doc; }, any> {
            return useEventBus<{ event: Event, space: string, dir: Doc }>(`docs-dir-change-${space}`)
        },

        __getAnyDocContentChangeEventBus(space: string): UseEventBusReturn<{ event: Event, space: string; slug: string; doc: Doc; }, any> {
            return useEventBus<{ event: Event, space: string, slug: string, doc: Doc }>(`docs-any-doc-content-change-${space}`)
        },

        __getDocChangeEventBus(space: string, slug?: string): UseEventBusReturn<{ event: Event, space: string; slug: string; doc: Doc; }, any> {
            return useEventBus<{ event: Event, space: string, slug: string, doc: Doc }>(`docs-doc-change-${space}-${slug}`)
        },

        emitDirChange(type: string, space: string, dir: Doc): void {
            const eventBus = this.__getDirChangeEventBus(space)
            const event = new Event(type)
            eventBus.emit({ event, space, dir })
        },

        onDirChange(space: string, callback: (event: Event, { space, dir }: { space: string, dir: Doc }) => void): void {
            const eventBus = this.__getDirChangeEventBus(space)
            eventBus.on(({ event, space, dir }) => {
                callback(event, { space, dir })
            })
        },

        emitDocChange(type: string, space: string, slug: string, doc: Doc): void {
            const eventBus = this.__getDocChangeEventBus(space, slug)
            const event = new Event(type)
            eventBus.emit({ event, space, slug, doc })
        },

        emitAnyDocContentChange(type: string, space: string, slug: string, doc: Doc): void {
            const eventBus = this.__getAnyDocContentChangeEventBus(space)
            const event = new Event(type)
            eventBus.emit({ event, space, slug, doc })
        },

        /**
         * 监听指定空间的指定文档变化（仅标题和内容变化才会触发）
         */
        onDocChange(space: string, slug: string, callback: (event: Event, { space, slug, doc }: { space: string, slug: string, doc: Doc }) => void): void {
            const eventBus = this.__getDocChangeEventBus(space, slug)
            eventBus.on(({ event, space, slug, doc }) => {
                callback(event, { space, slug, doc })
            })
        },
        /**
         * 监听指定空间的任意文档变化（仅标题和内容变化才会触发）
         */
        onAnyDocContentChange(space: string, callback: (event: Event, { space, slug, doc }: { space: string, slug: string, doc: Doc }) => void): void {
            const eventBus = this.__getAnyDocContentChangeEventBus(space)
            eventBus.on(({ event, space, slug, doc }) => {
                callback(event, { space, slug, doc })
            })
        },
    }
}