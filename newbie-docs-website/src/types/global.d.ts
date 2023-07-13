import type { OutputBlockData, EditorConfig } from "@editorjs/editorjs";

export interface Doc {
  id: string;
  parentId?: string;
  path: string;
  title: string;
  child: Doc[];
  parent?: Doc;
  /**
   * 是否已展开
   */
  expand?: boolean;
  blocks?: OutputBlockData[];
  createTime?: number;
  updateTime?: number;
  /**
   * 编辑器类型（markdown、word、block）
   */
  editor: string;
}

export interface ContentViewConfig {
  currentDoc?: Doc;
  editMode: boolean;
}

export interface CustomEditorConfig extends EditorConfig {
  headerPlaceholder?: string;
}
