import { Doc, ApiStorageEnum, DocData } from "@/types/global";
import { UseDocsApiFunction } from "@/types/api";
import { useDocsEventBus } from "@/events/docs";
import { UseLocalStorageDocsApi } from "./LocalStorageDocs";
import { UseRESTfulDocsApi } from "./RESTfulDocs";

let lastDir: Doc[] = [];
let lastDocContent: Record<string, string> = {};
let lastDocContentChangeTime: Record<string, number> = {};

const checkDirIsChanged = (currentDir: Doc[]) => {
  if (lastDir.length !== currentDir.length) return true;

  const keys = ["id", "slug", "parentId", "parentSlug", "path", "title", "sort"]

  for (let i = 0; i < lastDir.length; i++) {
    const lastDoc = lastDir[i];
    const currentDoc = currentDir[i];
    for (let j = 0; j < keys.length; j++) {
      const key = keys[j];
      // @ts-ignore
      if (lastDoc[key] !== currentDoc[key]) {
        return true;
      }
    }
  }

  return false;
}

const checkDocContentIsChanged = (doc: Doc) => {
  if (lastDocContent[doc.slug] !== doc.content) {
    // 同一个文档，3s 内只触发一次

    const now = new Date().getTime();
    if (now - (lastDocContentChangeTime[doc.slug] || 0) < 3000) {
      return false;
    }

    lastDocContent[doc.slug] = doc.content as string;
    lastDocContentChangeTime[doc.slug] = now;
    return true;
  } else {
    return false;
  }
}

const reflecttoEmitTasks = {
  dirChange: {
    methods: ["put", "remove", "splice", "changeSlug", "changeParentSlug", "changeTitle"],
    actions: async ({ args, propKey, docsApi, space }: { args: any[], propKey: string | symbol, docsApi: UseDocsApiFunction, space: string }) => {
      try {
        const dir = await docsApi.dir(space);
        const dirArray = docsApi.tree2array(dir) as Doc[];
        if (checkDirIsChanged(dirArray)) {
          lastDir = dirArray;
          console.log('docsApiProxy dir change', space, dir)
          useDocsEventBus().emitDirChange('docsApiProxy.' + (propKey as string), space, dir as Doc);
        }
      } catch (error) {
        console.error('docsApiProxy error', error)
        return false
      }
    }
  },
  put: {
    methods: ["put"],
    actions: async ({ args, propKey, docsApi, space }: { args: any[], propKey: string | symbol, docsApi: UseDocsApiFunction, space: string }) => {
      try {
        const putDoc = args[1] as Doc;
        const doc = await docsApi.get(space, putDoc.slug) as Doc;
        if (checkDocContentIsChanged(doc)) {
          console.log('docsApiProxy doc content change', space, doc)
          useDocsEventBus().emitAnyDocContentChange('docsApiProxy.' + (propKey as string), space, doc.slug, doc);
        }
      } catch (error) {
        console.error('docsApiProxy error', error)
        return false
      }
    }
  },
  remove: {
    methods: ["remove"],
    actions: async ({ args, propKey, docsApi, space }: { args: any[], propKey: string | symbol, docsApi: UseDocsApiFunction, space: string }) => {
      try {
        const slug = args[1] as string;
        const doc = await docsApi.get(space, slug) as Doc;
        if (checkDocContentIsChanged(doc)) {
          console.log('docsApiProxy doc content change', space, doc)
          useDocsEventBus().emitAnyDocContentChange('docsApiProxy.' + (propKey as string), space, doc.slug, doc);
        }
      } catch (error) {
        console.error('docsApiProxy error', error)
        return false
      }
    }
  },
} as {
  [key: string]: {
    methods: string[],
    actions: ({ args, propKey, docsApi }: { args: any[], propKey: string | symbol, docsApi: UseDocsApiFunction, space: string }) => any
  }
}

export function useDocsApi(storage: ApiStorageEnum, spaceData: Record<string, DocData>): UseDocsApiFunction {
  let docsApi = {} as UseDocsApiFunction;

  const configStorage = import.meta.env.VITE_API_STORAGE as ApiStorageEnum
  if (configStorage) {
    storage = configStorage
  }

  switch (storage) {
    case "localStorage":
      docsApi = new UseLocalStorageDocsApi(spaceData);
      break;
    case "restful":
      docsApi = new UseRESTfulDocsApi(spaceData);
      break;
  }

  // 代理 put、remove、splice、changeSlug、changeParentSlug、changeTitle 方法，每次调用成功后触发 dir 变更事件
  const proxy = new Proxy(docsApi, {
    get(target, propKey, receiver) {
      const targetMethod = Reflect.get(target, propKey, receiver);

      let toReflect = false;
      for (const task of Object.keys(reflecttoEmitTasks)) {
        if (typeof targetMethod === "function" && reflecttoEmitTasks[task].methods.includes(propKey as string)) {
          toReflect = true;
          break;
        }
      }

      if (toReflect) {
        return async function (...args: any[]) {
          try {
            const result = await targetMethod.apply(docsApi, args);
            if (result) {
              const space = args[0];
              for (const task of Object.keys(reflecttoEmitTasks)) {
                if (reflecttoEmitTasks[task].methods.includes(propKey as string)) {
                  await reflecttoEmitTasks[task].actions({ args, propKey, docsApi, space });
                }
              }
            }
            return result;
          } catch (error) {
            console.error('docsApiProxy error', error)
            return false
          }
        };
      } else {
        return targetMethod;
      }
    },
  });

  return proxy;
}