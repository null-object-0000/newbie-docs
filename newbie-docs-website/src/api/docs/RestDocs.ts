import { Doc, UseDocsApiFunction, DocData } from "@/types/global";
import { BaseUseDocsApi } from "./base";

export class UseRestDocsApi extends BaseUseDocsApi implements UseDocsApiFunction {
    constructor(spaceData: Record<string, DocData>) {
        super();
    }

    init(space: string): void {
        return;
    }

    get(space: string, id?: string): Doc | undefined {
        return undefined;
    }

    put(space: string, doc: Doc): boolean {
        return false;
    }

    exists(space: string, id: string): boolean {
        return false;
    }

    remove(space: string, id: string): boolean {
        return false;
    }

    splice(space: string, id: string, index: number): boolean {
        return false;
    }

    changeId(space: string, oldId: string, newId: string): boolean {
        return false;
    }

    changeParentId(space: string, id: string, parentId: string): boolean {
        return false;
    }

    getTotalDocCount(space: string): number {
        return 0;
    }

    getTotalWordCount(space: string): number {
        return 0;
    }
}