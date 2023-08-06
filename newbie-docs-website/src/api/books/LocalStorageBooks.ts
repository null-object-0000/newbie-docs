import { Book } from "@/types/global";
import { UseBooksApiFunction } from "@/types/api";

export class UseLocalStorageBooksApi implements UseBooksApiFunction {
    __get(slug?: string): Book | Book[] | undefined {
        const cache = localStorage.getItem('newbie_books');
        const cacheObj = cache ? JSON.parse(cache) as Book[] : []

        let docs;
        if (slug === undefined) {
            docs = cacheObj
        } else {
            docs = cacheObj.find(item => item.slug === slug)
        }

        return docs
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
        return this.__get() as Book[] | undefined;
    }

    async get(slug: string): Promise<Book | undefined> {
        return this.__get(slug) as Book | undefined;
    }

    async exists(slug: String): Promise<boolean> {
        let books = this.__get() as Book[] | undefined
        if (books) {
            return books.some(item => item.slug === slug)
        } else {
            return false
        }
    }

    async put(book: Book): Promise<boolean> {
        let books = this.__get() as Book[] | undefined

        if (await this.exists(book.slug)) {
            return false
        }


        if (books) {
            books.push(book)
            return this.__updateCache('put', books)
        } else {
            return false
        }
    }

    async remove(slug: string): Promise<boolean> {
        let books = this.__get() as Book[] | undefined
        books = books?.filter(item => item.slug !== slug)
        return this.__updateCache('remove', books)
    }

}