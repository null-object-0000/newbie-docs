import type { OutputBlockData, EditorConfig } from "@editorjs/editorjs";

export class User {
  isLogin: boolean;

  id: string;
  username: string;
  avatar: string;
  department: string;

  isAdminer: boolean;
}

export class Book {
  id: number;
  /**
   * 唯一标识
   */
  slug: string;
  title: string;
  cover?: string;
  description?: string;

  docsCount: number;
  wordsCount: number;

  creator: string;
  createTime: number;
  updater?: string;
  updateTime?: number;
  sort?: number;

  loginUserAuthType?: number;
}

export class Doc {
  bookId: number;
  bookSlug: string;

  id: number;
  /**
   * 唯一标识
   */
  slug: string;
  parentId: number;
  path: string;
  title: string;
  children?: Doc[];
  content: string;

  wordsCount: number;

  creator: string;
  createTime: number | string;
  updater?: string;
  updateTime?: number | string;
  sort: number;
  /**
   * 编辑器类型（1 word、2 block、3 markdown、4 link）
   */
  editor: number;

  loginUserAuthType?: number;
}

export class Permission {
  id: number;
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

export class DocData {
  tree: Doc;
  array: Doc[];
}

export class ContentViewConfig {
  spaceData: Record<string, DocData>;
  currentDoc?: Doc | null;
}

export interface CustomEditorConfig extends EditorConfig {
  headerPlaceholder?: string;
}

type ApiStorageEnum = "localStorage" | "restful";
