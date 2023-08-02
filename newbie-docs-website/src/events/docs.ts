import { Doc } from "@/types/global";
import { UseEventBusReturn, useEventBus } from "@vueuse/core";

export const useDocsEventBus = () => {
    return {
        __getDirChangeEventBus(space: string): UseEventBusReturn<{ event: Event, space: string; dir: Doc; }, any> {
            return useEventBus<{ event: Event, space: string, dir: Doc }>(`docs-dir-change-${space}`)
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
        }
    }
}