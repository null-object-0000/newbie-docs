import { Doc, ApiStorageEnum, UseDocsApiFunction, DocData } from "@/types/global";
import { useDocsEventBus } from "@/events/docs";
import { UseLocalStorageDocsApi } from "./LocalStorageDocs";
import { UseRESTfulDocsApi } from "./RESTfulDocs";

const checkDirIsChanged = (lastDir: Doc[], currentDir: Doc[]) => {
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

export function useDocsApi(storage: ApiStorageEnum, spaceData: Record<string, DocData>): UseDocsApiFunction {
  const docsEventBus = useDocsEventBus();
  let docsApi = {} as UseDocsApiFunction;
  switch (storage) {
    case "localStorage":
      docsApi = new UseLocalStorageDocsApi(spaceData);
    // case "rest":
    // docsApi = new UseRESTfulDocsApi(spaceData);
    default:
      docsApi = new UseLocalStorageDocsApi(spaceData);
  }

  // 代理 put、remove、splice、changeSlug、changeParentSlug、changeTitle 方法，每次调用成功后触发 dir 变更事件
  let lastDir: Doc[] = [];
  const proxy = new Proxy(docsApi, {
    get(target, propKey, receiver) {
      const targetMethod = Reflect.get(target, propKey, receiver);
      if (typeof targetMethod === "function" && ["put", "remove", "splice", "changeSlug", "changeParentSlug", "changeTitle"].includes(propKey as string)) {
        return async function (...args: any[]) {
          try {
            const result = await targetMethod.apply(docsApi, args);
            if (result) {
              const space = args[0];
              const dir = await docsApi.dir(space);
              const dirArray = docsApi.tree2array(dir) as Doc[];
              if (checkDirIsChanged(lastDir, dirArray)) {
                lastDir = dirArray;
                console.log('docsApiProxy dir change', space, dir)
                docsEventBus.emitDirChange('docsApiProxy.' + (propKey as string), space, dir as Doc);
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