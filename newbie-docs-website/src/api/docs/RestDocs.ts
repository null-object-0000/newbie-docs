import { Doc, UseDocsApiFunction, DocData } from "@/types/global";
import { BaseUseDocsApi } from "./base";

export class UseRestDocsApi extends BaseUseDocsApi implements UseDocsApiFunction {
    init(space: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
    dir(space: string): Promise<Doc | undefined> {
        throw new Error("Method not implemented.");
    }
    get(space: string, slug?: string | undefined): Promise<Doc | undefined> {
        throw new Error("Method not implemented.");
    }
    put(space: string, doc: Doc): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    exists(space: string, slug: string): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    remove(space: string, slug: string): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    splice(space: string, slug: string, index: number): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    changeSlug(space: string, oldSlug: string, newSlug: string): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    changeParentSlug(space: string, slug: string, parentSlug: string): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    changeTitle(space: string, slug: string, newTitle: string): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    getTotalDocCount(space: string): Promise<number> {
        throw new Error("Method not implemented.");
    }
    getTotalWordCount(space: string): Promise<number> {
        throw new Error("Method not implemented.");
    }
  
}