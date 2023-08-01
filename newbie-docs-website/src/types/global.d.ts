import type { OutputBlockData, EditorConfig } from "@editorjs/editorjs";

export interface Doc {
  id: string;
  parentId?: string;
  path: string;
  title: string;
  child?: Doc[];
  parent?: Doc;
  /**
   * 是否已展开
   */
  expand?: boolean;
  content?: OutputBlockData[] | string;
  createTime?: number;
  updateTime?: number;
  sort?: number;
  /**
   * 编辑器类型（word、block、link）
   */
  editor: string;
}

export interface DocData {
  tree: Doc,
  array: Doc[]
}

export interface ContentViewConfig {
  spaceData: Record<string, DocData>;
  currentDoc?: Doc | null;
}

export interface CustomEditorConfig extends EditorConfig {
  headerPlaceholder?: string;
}

type DocsStorageEnum = "localStorage" | "rest";

export interface UseDocsApiFunction {
  async init: (space: string) => Promise<void>;

  async generateId: (length: number) => Promise<string>;

  async get: (space: string, id?: string) => Promise<Doc | undefined>;
  async put: (space: string, doc: Doc) => Promise<boolean>;
  async exists: (space: string, id: string) => Promise<boolean>;
  async remove: (space: string, id: string) => Promise<boolean>;
  async splice: (space: string, id: string, index: number) => Promise<boolean>;

  async findChild(data: Doc | Doc[] | undefined, parentId: string): Promise<Doc[] | undefined>;

  async changeId: (space: string, oldId: string, newId: string) => Promise<boolean>;
  async changeParentId: (space: string, id: string, parentId: string) => Promise<boolean>;
  async changeTitle: (space: string, id: string, newTitle: string) => Promise<boolean>;

  async getLevel: (space: string, doc: Doc | string) => Promise<number | undefined>;
  async getTotalDocCount: (space: string) => Promise<number>;
  async getTotalWordCount: (space: string) => Promise<number>;
}