import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "./App.vue";
import router from "./router";

import "./assets/base.css";

import ArcoVue from "@arco-design/web-vue";
import ArcoVueIcon from '@arco-design/web-vue/es/icon';
import "@arco-design/web-vue/dist/arco.css";

import mavonEditor from 'mavon-editor'
import 'mavon-editor/dist/css/index.css'

import Blocks from "./components/blocks/index";
import DocsIcons from "./components/icons/index";

import { Book, Doc } from "./types/global";
import { UseLocalStorageDocsApi } from "./api/docs/LocalStorageDocs";

const app = createApp(App);

app.use(createPinia());

app.use(ArcoVue);
app.use(ArcoVueIcon);

app.use(mavonEditor);

Blocks.install(app)
DocsIcons.install(app);

app.use(router);

app.mount("#app");

if (import.meta.env.DEV) {
    const mock = import.meta.glob('@/assets/mock.json') as Record<string, () => Promise<unknown>>
    const { books, docs } = await mock['/src/assets/mock.json']() as { books: Book[], docs: Doc[] }
    console.log("mock", books)

    // mock books 写入 localStorage
    const cacheBooks = localStorage.getItem('newbie_books')
    let cacheBooksArr = cacheBooks ? JSON.parse(cacheBooks) as Book[] : []
    cacheBooksArr = cacheBooksArr.filter(item => !books.some(book => book.id === item.id || book.slug === item.slug))
    cacheBooksArr.push(...books)
    localStorage.setItem('newbie_books', JSON.stringify(cacheBooksArr))

    const docsApi = new UseLocalStorageDocsApi({})

    for (const mockBook of books) {
        const mockDocs = docsApi.getDefaultDocs(mockBook)
        const mockRoot = mockDocs.find(doc => doc.slug === 'root') as Doc
        mockDocs.push(...docs.filter(doc => doc.bookId === mockBook.id).map(doc => {
            doc.parentId = mockRoot.id
            return doc
        }))
        localStorage.setItem(`newbie_docs_${mockBook.slug}`, JSON.stringify(mockDocs))
    }
}