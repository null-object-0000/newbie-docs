import { Doc, ApiStorageEnum, DocData } from "@/types/global";
import { UseDocsApiFunction } from "@/types/api";
import { useDocsEventBus } from "@/events/docs";
import { UseLocalStorageDocsApi } from "./LocalStorageDocs";
import { UseRESTfulDocsApi } from "./RESTfulDocs";

let lastDir: Doc[] = [];
const lastDocContent: Record<string, string> = {};
const lastDocContentChangeTime: Record<string, number> = {};

const checkDirIsChanged = (currentDir: Doc[]) => {
  if (lastDir.length !== currentDir.length) return true;

  const keys = ["id", "slug", "parentId", "path", "title", "sort"]

  for (let i = 0; i < lastDir.length; i++) {
    const lastDoc = lastDir[i];
    const currentDoc = currentDir[i];
    for (let j = 0; j < keys.length; j++) {
      const key = keys[j];
      if (lastDoc[key as keyof Doc] !== currentDoc[key as keyof Doc]) {
        return true;
      }
    }
  }

  return false;
}

const checkDocContentIsChanged = (doc: Doc) => {
  const content = doc.title + doc.content
  if (lastDocContent[doc.slug] !== content) {

    const now = new Date().getTime();

    lastDocContent[doc.slug] = content;
    lastDocContentChangeTime[doc.slug] = now;
    return true;
  } else {
    return false;
  }
}

const emitDirChange = async ({ propKey, docsApi, space }: { propKey: string | symbol, docsApi: UseDocsApiFunction, space: string }) => {
  try {
    const dir = await docsApi.dir(space);
    const dirArray = docsApi.tree2array(dir) as Doc[];
    if (checkDirIsChanged(dirArray)) {
      lastDir = dirArray;
      useDocsEventBus().emitDirChange('docsApiProxy.' + (propKey as string), space, dir as Doc);
    }
  } catch (error) {
    console.error('docsApiProxy error', error)
    return false
  }
}

const emitDocContentChange = async (withDirChange: boolean, { propKey, docsApi, space, id, slug }: { propKey: string | symbol, docsApi: UseDocsApiFunction, space: string, id?: number, slug?: string }) => {
  try {
    let doc = null;
    if (slug && slug.length > 0) {
      doc = await docsApi.get(space, slug) as Doc;
    } else if (id && id > 0) {
      doc = await docsApi.getById(space, id) as Doc;
    }

    if (!doc) return false;

    if (checkDocContentIsChanged(doc)) {
      if (withDirChange) {
        // 主动触发 dir 变更事件
        await emitDirChange({ propKey, docsApi, space });
      }

      const docsEventBus = useDocsEventBus()
      docsEventBus.emitDocContentChange('docsApiProxy.' + (propKey as string), space, doc.slug, doc);
    }
  } catch (error) {
    console.error('docsApiProxy error', error)
    return false
  }
}

const reflecttoEmitTasks = {
  dirChange: {
    methods: ["remove", "splice", "changeSlug", "changeParentId"],
    actions: async ({ args, propKey, docsApi, space }: { args: any[], propKey: string | symbol, docsApi: UseDocsApiFunction, space: string }) => {
      await emitDirChange({ propKey, docsApi, space });
    }
  },
  put: {
    methods: ["put"],
    actions: async ({ args, propKey, docsApi, space }: { args: any[], propKey: string | symbol, docsApi: UseDocsApiFunction, space: string }) => {
      const putDoc = args[1] as Doc;
      await emitDocContentChange(true, { propKey, docsApi, space, slug: putDoc.slug });
    }
  },
  changeTitle: {
    methods: ["changeTitle"],
    actions: async ({ args, propKey, docsApi, space }: { args: any[], propKey: string | symbol, docsApi: UseDocsApiFunction, space: string }) => {
      const id = args[1] as number;
      await emitDocContentChange(true, { propKey, docsApi, space, id });
    }
  },
} as {
  [key: string]: {
    methods: string[],
    actions: ({ args, propKey, docsApi }: { args: any[], propKey: string | symbol, docsApi: UseDocsApiFunction, space: string }) => any,
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

  // 代理 put、remove、splice、changeSlug、changeParentId、changeTitle 方法，每次调用成功后触发 dir 变更事件
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