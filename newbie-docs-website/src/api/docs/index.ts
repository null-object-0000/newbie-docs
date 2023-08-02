import { Doc, ApiStorageEnum, UseDocsApiFunction, DocData } from "@/types/global";
import { useDocsEventBus } from "@/events/docs";
import { UseLocalStorageDocsApi } from "./LocalStorageDocs";
import { UseRestDocsApi } from "./RestDocs";

export function useDocsApi(storage: ApiStorageEnum, spaceData: Record<string, DocData>): UseDocsApiFunction {
  const docsEventBus = useDocsEventBus();
  let docsApi = {} as UseDocsApiFunction;
  switch (storage) {
    case "localStorage":
      docsApi = new UseLocalStorageDocsApi(spaceData);
    // case "rest":
    // docsApi = new UseRestDocsApi(spaceData);
    default:
      docsApi = new UseLocalStorageDocsApi(spaceData);
  }

  // 代理 put、remove、splice、changeSlug、changeParentSlug、changeTitle 方法，每次调用成功后触发 dir 变更事件
  const proxy = new Proxy(docsApi, {
    get(target, propKey, receiver) {
      const targetMethod = Reflect.get(target, propKey, receiver);
      if (typeof targetMethod === "function" && ["put", "remove", "splice", "changeSlug", "changeParentSlug", "changeTitle"].includes(propKey as string)) {
        return async function (...args: any[]) {
          try {
            const result = await targetMethod.apply(docsApi, args);
            if (result) {
              const space = args[0];
              const docs = await docsApi.dir(space);
              docsEventBus.emitDirChange('docsApiProxy.' + (propKey as string), space, docs as Doc);
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