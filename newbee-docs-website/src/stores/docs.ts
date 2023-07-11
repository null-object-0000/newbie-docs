import { reactive, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Doc } from '@/types/global';

function findDocByPath(docs: Doc, path: string): Doc | undefined {
  if (docs.path === path) {
    return docs
  }

  if (docs.child) {
    for (const doc of docs.child) {
      const findDoc = findDocByPath(doc, path)
      if (findDoc) {
        return findDoc
      }
    }
  }
}

function removeParent(docs: Doc) {
  if (docs.child) {
    for (const doc of docs.child) {
      delete doc.parent
      removeParent(doc)
    }
  }

  delete docs.parent

  return docs
}

export const useDocsStore = defineStore('docs', () => {
  const defaultDocs: Doc = reactive({
    title: "万象开放平台 - 营销产品部",
    path: "/alle",
    child: [
      {
        title: "CodeX Docs",
        path: "/alle/codex-docs",
        blocks: [{ "id": "q4zsynkCku", "type": "header", "data": { "text": "@飞书管理员，你的快速上手指南", "level": 2 } }, { "id": "B-9NtN3k49", "type": "paragraph", "data": { "text": "欢迎来到飞书，这是一份为你准备的管理员快速上手指南！" } }, { "id": "LHEj2qZzeF", "type": "header", "data": { "text": "✨ 了解飞书 ", "level": 1 } }, { "id": "Ms5cUv8bmx", "type": "paragraph", "data": { "text": "飞书是一站式企业协作与管理平台，整合即时消息、日历、邮箱、会议、云文档等功能，通过下面这个视频，带你 1 分钟看懂飞书。" } }, { "id": "umm_TYTx0S", "type": "warning", "data": { "title": "Tip:", "message": "真实工作场景中，飞书如何帮助企业提效？在下方模板中心，看「飞书多维表格」轻松重塑「项目管理」！" } }, { "id": "XVOfq7E7zH", "type": "header", "data": { "text": "📘 任务中心", "level": 1 } }, { "id": "AD59nY31RT", "type": "paragraph", "data": { "text": "不知从哪开始体验飞书？" } }, { "id": "0D4giB2xYP", "type": "paragraph", "data": { "text": "我们准备了<b>管理员任务</b>，带你快速完成企业基础配置，邀请同事一起用上飞书！" } }, { "id": "yvNQuS-epV", "type": "header", "data": { "text": "今日任务", "level": 3 } }, { "id": "Ki9LWFUPPO", "type": "checklist", "data": { "items": [{ "text": "访问管理后台，在后台可以修改企业信息，管理组织架构", "checked": false }, { "text": "创建部门，把组织架构迁入飞书，还能批量创建", "checked": false }, { "text": "邀请同事加入企业，共享飞书高效协作", "checked": false }, { "text": "提交飞书企业认证，立刻解锁企业通讯录人数上限", "checked": false }] } }, { "id": "Njke-lR_hH", "type": "warning", "data": { "title": "Tip:", "message": "恭喜你！看到这里，你也体验了：在文档中完成轻量级任务管理。" } }, { "id": "CbAaqelPYf", "type": "header", "data": { "text": "一周任务", "level": 3 } }, { "id": "aVja7r1-AJ", "type": "paragraph", "data": { "text": "接下来一周，你可以通过以下任务，了解更多飞书使用方式，探索更多功能。" } }, { "id": "RRJNpUd7Zx", "type": "paragraph", "data": { "text": "试着用于飞书的基础人事管理应用，并邀请更多同事加入吧！" } }, { "id": "j8a6kM1pk8", "type": "raw", "data": { "html": "<b>加粗文本</b><br><br><i>斜体文本</i><br><br><code>电脑自动输出</code><br><br>这是 <sub> 下标</sub> 和 <sup> 上标</sup>" } }],
        child: [
          {
            title: "Getting started",
            path: "/alle/getting-started",
          },
          {
            title: "Configuration",
            path: "/alle/configuration",
            blocks: [{ "id": "q4zsynkCku", "type": "header", "data": { "text": "@飞书管理员，你的快速上手指南", "level": 2 } }, { "id": "B-9NtN3k49", "type": "paragraph", "data": { "text": "欢迎来到飞书，这是一份为你准备的管理员快速上手指南！" } }, { "id": "LHEj2qZzeF", "type": "header", "data": { "text": "✨ 了解飞书 ", "level": 1 } }, { "id": "Ms5cUv8bmx", "type": "paragraph", "data": { "text": "飞书是一站式企业协作与管理平台，整合即时消息、日历、邮箱、会议、云文档等功能，通过下面这个视频，带你 1 分钟看懂飞书。" } }, { "id": "umm_TYTx0S", "type": "warning", "data": { "title": "Tip:", "message": "真实工作场景中，飞书如何帮助企业提效？在下方模板中心，看「飞书多维表格」轻松重塑「项目管理」！" } }, { "id": "XVOfq7E7zH", "type": "header", "data": { "text": "📘 任务中心", "level": 1 } }, { "id": "AD59nY31RT", "type": "paragraph", "data": { "text": "不知从哪开始体验飞书？" } }, { "id": "0D4giB2xYP", "type": "paragraph", "data": { "text": "我们准备了<b>管理员任务</b>，带你快速完成企业基础配置，邀请同事一起用上飞书！" } }, { "id": "yvNQuS-epV", "type": "header", "data": { "text": "今日任务", "level": 3 } }, { "id": "Ki9LWFUPPO", "type": "checklist", "data": { "items": [{ "text": "访问管理后台，在后台可以修改企业信息，管理组织架构", "checked": false }, { "text": "创建部门，把组织架构迁入飞书，还能批量创建", "checked": false }, { "text": "邀请同事加入企业，共享飞书高效协作", "checked": false }, { "text": "提交飞书企业认证，立刻解锁企业通讯录人数上限", "checked": false }] } }, { "id": "Njke-lR_hH", "type": "warning", "data": { "title": "Tip:", "message": "恭喜你！看到这里，你也体验了：在文档中完成轻量级任务管理。" } }, { "id": "CbAaqelPYf", "type": "header", "data": { "text": "一周任务", "level": 3 } }, { "id": "aVja7r1-AJ", "type": "paragraph", "data": { "text": "接下来一周，你可以通过以下任务，了解更多飞书使用方式，探索更多功能。" } }, { "id": "RRJNpUd7Zx", "type": "paragraph", "data": { "text": "试着用于飞书的基础人事管理应用，并邀请更多同事加入吧！" } }, { "id": "j8a6kM1pk8", "type": "raw", "data": { "html": "<b>加粗文本</b><br><br><i>斜体文本</i><br><br><code>电脑自动输出</code><br><br>这是 <sub> 下标</sub> 和 <sup> 上标</sup>" } }],
          },
          {
            title: "Kubernetes deployment",
            path: "/alle/k8s-deployment",
          },
          {
            title: "Yandex Metrica",
            path: "/alle/yandex-metrica",
          },
          {
            title: "UI controls",
            path: "/alle/ui-controls",
          },
        ],
      },
      {
        title: "Features",
        path: "/alle/features",
      },
      {
        title: "Contribution",
        path: "/alle/contribution",
      },
    ],
  });

  const spaceData: Record<string, Doc> = reactive({})

  let i = ref(0)
  function get(space: string): Doc {
    i.value++
    const cache = localStorage.getItem('docs_' + space);

    if (spaceData[space]) {
      return spaceData[space]
    } else if (cache) {
      spaceData[space] = JSON.parse(cache)
      return spaceData[space]
    } else {
      localStorage.setItem('docs_' + space, JSON.stringify(defaultDocs))
      spaceData[space] = defaultDocs
      return defaultDocs
    }
  }

  function put(space: string, doc: Doc) {
    const docs = get(space)

    // 先递归找下是不是已经有相同 path 了
    const findDoc = findDocByPath(docs, doc.path)
    if (findDoc) {
      doc.updateTime = Date.now()
      Object.assign(findDoc, doc)
    } else {
      doc.createTime = Date.now()
      docs.child?.push(doc)
    }

    // 去除掉所有的 parent，暂时统一使用 localStorage 存储
    localStorage.setItem('docs_' + space, JSON.stringify(removeParent(docs)))
  }

  return { get, put }
})

