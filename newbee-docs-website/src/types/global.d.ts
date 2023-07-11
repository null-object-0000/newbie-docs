import type { OutputBlockData, EditorConfig } from "@editorjs/editorjs";

export interface Doc {
  id: string;
  parentId: string;
  path: string;
  title: string;
  child?: Doc[];
  parent?: Doc;
  /**
   * 是否已展开
   */
  expand?: boolean;
  blocks?: OutputBlockData[];
  createTime?: number;
  updateTime?: number;
}

export interface ContentViewConfig {
  currentDoc?: Doc;
  editMode: boolean;
  editorType: string;
}

export interface CustomEditorConfig extends EditorConfig {
  headerPlaceholder?: string;
}
