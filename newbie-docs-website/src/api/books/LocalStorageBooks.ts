import { Book } from "@/types/global";
import { UseBooksApiFunction } from "@/types/api";
import { UseLocalStorageDocsApi } from "../docs/LocalStorageDocs";

export class UseLocalStorageBooksApi implements UseBooksApiFunction {
    async __get(slug?: string): Promise<Book | Book[] | undefined> {
        const cache = localStorage.getItem('newbie_books');
        let cacheBooks = cache ? JSON.parse(cache) as Book[] : []

        // 这里强行给每个 book 加上 docsCount、wordsCount 属性
        for (const book of cacheBooks) {
            const localStorageDocsApi = new UseLocalStorageDocsApi({})
            book.docsCount = await localStorageDocsApi.getTotalDocCount(book.slug)
            book.wordsCount = await localStorageDocsApi.getTotalWordCount(book.slug)
        }

        let results;
        if (slug === undefined) {
            results = cacheBooks
        } else {
            results = cacheBooks.find(item => item.slug === slug)
        }

        return results
    }

    __updateCache(from: string, books: Book[] | undefined): boolean {
        if (books) {
            localStorage.setItem('newbie_books', JSON.stringify(books))
            return true
        } else {
            return false
        }
    }

    async dir(): Promise<Book[] | undefined> {
        return await this.__get() as Book[] | undefined;
    }

    async get(slug: string): Promise<Book | undefined> {
        return await this.__get(slug) as Book | undefined;
    }

    async exists(slug: String): Promise<boolean> {
        let books = await this.__get() as Book[] | undefined
        if (books) {
            return books.some(item => item.slug === slug)
        } else {
            return false
        }
    }

    async put(book: Book): Promise<boolean> {
        let books = await this.__get() as Book[] | undefined

        if (await this.exists(book.slug)) {
            return false
        }

        if (!book.id || book.id <= 0) {
            book.id = Math.ceil(Math.random() * 1000000000)
        }

        if (books) {
            books.push(book)
            return this.__updateCache('put', books)
        } else {
            return false
        }
    }

    async remove(id: number): Promise<boolean> {
        let books = await this.__get() as Book[] | undefined
        books = books?.filter(item => item.id !== id)
        return this.__updateCache('remove', books)
    }

    async changeTitle(id: number, newTitle: string): Promise<boolean> {
        if (!newTitle || newTitle.length <= 0) {
            return false
        }

        let books = await this.__get() as Book[]
        const doc = books.find(item => item.id === id)
        if (doc) {
            doc.title = newTitle

            return this.__updateCache('changeTitle', books)
        } else {
            return false
        }
    }

}