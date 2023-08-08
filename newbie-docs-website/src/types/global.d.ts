import type { OutputBlockData, EditorConfig } from "@editorjs/editorjs";

export interface Book {
  id?: number;
  /**
   * 唯一标识
   */
  slug: string;
  title: string;
  cover?: string;
  description?: string;
  creator: string;
  createTime: number;
  updater?: string;
  updateTime?: number;
  sort?: number;
}

export interface Doc {
  bookId: number;
  bookSlug: string;

  id?: number;
  /**
   * 唯一标识
   */
  slug: string;
  parentId?: number,
  parentSlug?: string;
  path: string;
  title: string;
  children?: Doc[];
  content?: string;
  creator: string;
  createTime: number;
  updater?: string;
  updateTime?: number;
  sort: number;
  /**
   * 编辑器类型（1 word、2 block、3 link）
   */
  editor: number;
}

export interface Permission {
  id?: number;
  /**
   * 1 adminer、2 editor、3 viewer
   */
  authType: number;
  /**
   * 1 book、2 doc
   */
  dataType: number;
  dataId: number;
  dataSlug: string;
  owner: string;
  /**
   * 1 user、2 department
   */
  ownerType: number;
}

export interface DocData {
  tree: Doc,
  array: Doc[]
}

export interface ContentViewConfig {
  spaceData: Record<string, DocData>;
  dir?: Doc | null;
  currentBook?: Book | null;
  currentDoc?: Doc | null;
  totalDocCount?: number;
  totalWordCount?: number;
}

export interface CustomEditorConfig extends EditorConfig {
  headerPlaceholder?: string;
}

type ApiStorageEnum = "localStorage" | "restful";
