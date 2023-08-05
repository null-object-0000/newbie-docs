import type { OutputBlockData, EditorConfig } from "@editorjs/editorjs";

export interface Book {
  id: number;
  /**
   * 唯一标识
   */
  slug: string;
  title: string;
  description: string;
  createTime: number;
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
  createTime: number;
  updateTime?: number;
  sort: number;
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
  dir?: Doc | null;
  currentDoc?: Doc | null;
  totalDocCount?: number;
  totalWordCount?: number;
}

export interface CustomEditorConfig extends EditorConfig {
  headerPlaceholder?: string;
}

type ApiStorageEnum = "localStorage" | "rest";

export interface UseBooksApiFunction {
  async dir: () => Promise<Book[] | undefined>;
}

export interface UseDocsApiFunction {
  async init: (space: string) => Promise<void>;

  async generateSlug: (length: number) => Promise<string>;

  /**
   * 获取指定空间的所有 doc
   * @param space 空间名
   * @returns 树形结构的 doc，包含子节点，不包含 doc 内容
   */
  async dir: (space: string) => Promise<Doc | undefined>;
  /**
   * 获取指定空间指定 slug 的 doc
   * @param space 空间名
   * @param slug doc slug
   * @returns 树形结构的 doc，包含子节点，包含 doc 内容
   */
  async get: (space: string, slug?: string) => Promise<Doc | undefined>;
  async exists: (space: string, slug: string) => Promise<boolean>;

  async put: (space: string, doc: Doc) => Promise<boolean>;
  async remove: (space: string, slug: string) => Promise<boolean>;
  async splice: (space: string, slug: string, index: number) => Promise<boolean>;

  async changeSlug: (space: string, oldSlug: string, newSlug: string) => Promise<boolean>;
  async changeParentSlug: (space: string, slug: string, parentSlug: string) => Promise<boolean>;
  async changeTitle: (space: string, slug: string, newTitle: string) => Promise<boolean>;

  async findChild(data: Doc | Doc[] | undefined, parentSlug: string): Promise<Doc[] | undefined>;

  async getLevel: (space: string, doc: Doc | string) => Promise<number | undefined>;
  async getTotalDocCount: (space: string) => Promise<number>;
  async getTotalWordCount: (space: string) => Promise<number>;

  array2tree: (docs?: Doc | Doc[]) => Doc | undefined;
  tree2array: (doc?: Doc) => Doc[] | undefined;
}