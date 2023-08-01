import { Doc, UseDocsApiFunction, DocData } from "@/types/global";
import { BaseUseDocsApi } from "./base";

export class UseRestDocsApi extends BaseUseDocsApi implements UseDocsApiFunction {
    constructor(spaceData: Record<string, DocData>) {
        super();
    }

    init(space: string): Promise<void> {
        throw new Error("Method not implemented.");
    }

    get(space: string, id?: string | undefined): Promise<Doc | undefined> {
        throw new Error("Method not implemented.");
    }

    put(space: string, doc: Doc): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

    exists(space: string, id: string): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

    remove(space: string, id: string): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

    splice(space: string, id: string, index: number): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

    changeId(space: string, oldId: string, newId: string): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

    changeParentId(space: string, id: string, parentId: string): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

    changeTitle(space: string, id: string, newTitle: string): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

    getTotalDocCount(space: string): Promise<number> {
        throw new Error("Method not implemented.");
    }
    
    getTotalWordCount(space: string): Promise<number> {
        throw new Error("Method not implemented.");
    }
}