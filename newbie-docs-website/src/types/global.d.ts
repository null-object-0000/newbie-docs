import type { OutputBlockData, EditorConfig } from "@editorjs/editorjs";

export interface Book {
  id: number;
  /**
   * 唯一标识
   */
  slug: string;
  title: string;
  cover?: string;
  description?: string;
  creaotr: string;
  createTime: number;
  updater?: string;
  updateTime?: number;
  sort?: number;
}

export interface Doc {
  id: number;
  /**
   * 唯一标识
   */
  slug: string;
  parentId?: number,
  parentSlug?: string;
  path: string;
  title: string;
  child?: Doc[];
  content?: OutputBlockData[] | string;
  creator: string;
  createTime: number;
  updater?: string;
  updateTime?: number;
  sort: number;
  /**
   * 编辑器类型（word、block、link）
   */
  editor: string;
}

export interface Permission {
  id: number;
  /**
   * editor、viewer
   */
  authType: string;
  /**
   * book、doc
   */
  dataType: string;
  dataId: number;
  dataFlag: string;
  userId: number;
  userDepartment: string;
}

export interface DocData {
  tree: Doc,
  array: Doc[]
}

export interface ContentViewConfig {
  spaceData: Record<string, DocData>;
  dir?: Doc | null;
  currentDoc?: Doc | null;
  totalDocCount?: number;
  totalWordCount?: number;
}

export interface CustomEditorConfig extends EditorConfig {
  headerPlaceholder?: string;
}

type ApiStorageEnum = "localStorage" | "rest";
