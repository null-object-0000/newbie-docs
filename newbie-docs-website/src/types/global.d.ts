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
  init: (space: string) => void;

  generateId: (length: number) => string;

  get: (space: string, id?: string) => Doc | undefined;
  put: (space: string, doc: Doc) => boolean;
  exists: (space: string, id: string) => boolean;
  remove: (space: string, id: string) => boolean;
  splice: (space: string, id: string, index: number) => boolean;

  findChild(data: Doc | Doc[] | undefined, parentId: string): Doc[] | undefined;

  changeId: (space: string, oldId: string, newId: string) => boolean;
  changeParentId: (space: string, id: string, parentId: string) => boolean;
  changeTitle: (space: string, id: string, newTitle: string) => boolean;

  getLevel(space: string, doc: Doc | string);
  getTotalDocCount: (space: string) => number;
  getTotalWordCount: (space: string) => number;
}