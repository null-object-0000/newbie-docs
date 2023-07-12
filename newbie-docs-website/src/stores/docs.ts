import { reactive, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Doc } from '@/types/global';

function findDocBy(docs: Doc, key: string, value: any): Doc | undefined {
  if (docs[key] == value) {
    return docs
  }

  if (docs.child) {
    for (const doc of docs.child) {
      const findDoc = findDocBy(doc, key, value)
      if (findDoc) {
        return findDoc
      }
    }
  }
}

export const useDocsStore = defineStore('docs', () => {
  const spaceData: Record<string, Doc> = reactive({})

  const generateId = function (length: number) {
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    const firstChar = alphabet.charAt(Math.floor(Math.random() * 26)); // 随机选择一个字母作为开头
    let id = firstChar;

    for (let i = 1; i < length; i++) {
      const randomChar = characters.charAt(Math.floor(Math.random() * characters.length));
      id += randomChar;
    }

    return id;
  }

  const getDefaultDocs = function (space: string): Doc {
    return {
      id: 'root',
      // TODO: 这里的 title 应该是从后端获取的，暂时写死
      title: "万象开放平台 - 营销产品部",
      path: "/" + space,
      child: [
        {
          id: 'home',
          parentId: space,
          title: "首页",
          path: `/${space}/home`,
          child: []
        }
      ]
    }
  }

  function __updateCache(space: string, docs: Doc) {
    spaceData[space] = docs
    // 去除掉所有的 parent，暂时统一使用 localStorage 存储
    localStorage.setItem('docs_' + space, JSON.stringify(docs))
  }

  function get(space: string): Doc {
    const cache = localStorage.getItem('docs_' + space);

    if (spaceData[space]) {
    } else if (cache) {
      __updateCache(space, JSON.parse(cache))
    } else {
      __updateCache(space, getDefaultDocs(space))
    }

    return spaceData[space]
  }

  function put(space: string, doc: Doc) {
    const docs = get(space)

    // 先递归找下是不是已经有相同 path 了
    const findDoc = findDocBy(docs, 'id', doc.id)
    if (findDoc) {
      const parentDoc = findDocBy(docs, 'id', findDoc.parentId)
      if (!parentDoc) {
        return false
      }

      doc.updateTime = Date.now()

      // 如果父级变了，就需要从当前父级的child里把自己删掉，然后再加到新的父级里
      if (findDoc.parentId !== doc.parentId) {
        parentDoc.child = parentDoc.child.filter(item => item.id !== doc.id)

        const newParentDoc = findDocBy(docs, 'id', doc.parentId)
        if (!newParentDoc) {
          console.log('docs.put', 'newParentDoc not found')
          return false
        }

        Object.assign(findDoc, doc)
        newParentDoc.child.push(doc)
      } else {
        Object.assign(findDoc, doc)
      }
    } else {
      const parentDoc = findDocBy(docs, 'id', doc.parentId)
      if (!parentDoc) {
        return false
      }

      doc.createTime = Date.now()
      parentDoc.child?.push(doc)
    }

    __updateCache(space, docs)
  }

  function remove(space: string, id: string) {
    const docs = get(space)

    const doc = findDocBy(docs, 'id', id)
    if (!doc) {
      return false
    }

    const parentDoc = findDocBy(docs, 'id', doc.parentId)
    if (!parentDoc) {
      return false
    }

    parentDoc.child = parentDoc.child.filter(item => item.id !== id)

    __updateCache(space, docs)
  }

  function changeId(space: string, oldId: string, newId: string) {
    if (oldId === newId) {
      return true;
    }

    const docs = get(space)

    // 先递归找下是不是已经有相同 id 了
    const findDoc = findDocBy(docs, 'id', newId)
    if (findDoc) {
      return false
    }

    const oldDoc = findDocBy(docs, 'id', oldId)
    if (oldDoc) {
      oldDoc.id = newId
      __updateCache(space, docs)
      return true
    } else {
      return false
    }
  }

  return { get, put, remove, changeId, generateId }
})

