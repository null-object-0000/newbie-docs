import { Book } from "@/types/global";
import { UseBooksApiFunction } from "@/types/api";
import axiso from "axios";

export class UseRESTfulBooksApi implements UseBooksApiFunction {

    async dir(): Promise<Book[] | undefined> {
        const { data: response } = await axiso({
            method: 'get',
            baseURL: import.meta.env.VITE_REST_API_BASE_URL,
            url: '/books/dir'
        })

        if (response && response.code === '0000') {
            return response.result as Book[]
        }
    }

    async get(slug: string): Promise<Book | undefined> {
        const { data: response } = await axiso({
            method: 'get',
            baseURL: import.meta.env.VITE_REST_API_BASE_URL,
            url: '/books/get',
            params: {
                slug: slug
            }
        })

        if (response && response.code === '0000') {
            return response.result as Book
        }
    }

    async exists(slug: String): Promise<boolean> {
        const { data: response } = await axiso({
            method: 'get',
            baseURL: import.meta.env.VITE_REST_API_BASE_URL,
            url: '/books/exists',
            params: {
                slug: slug
            }
        })

        if (response && response.code === '0000') {
            return response.result as boolean
        } else {
            throw new Error(`[${response.code}] ${response.message}`)
        }
    }

    async put(book: Book): Promise<boolean> {
        const { data: response } = await axiso({
            method: 'post',
            baseURL: import.meta.env.VITE_REST_API_BASE_URL,
            url: '/books/put',
            data: {
                id: book.id,
                slug: book.slug,
                title: book.title,
                description: book.description,
                cover: book.cover,
            }
        })

        return response && response.code === '0000' && response.result > 0
    }

    async remove(slug: string): Promise<boolean> {
        const { data: response } = await axiso({
            method: 'post',
            baseURL: import.meta.env.VITE_REST_API_BASE_URL,
            url: '/books/remove',
            data: {
                slug: slug
            }
        })

        return response && response.code === '0000'
    }

    async changeTitle(slug: string, newTitle: string): Promise<boolean> {
        const { data: response } = await axiso({
            method: 'post',
            baseURL: import.meta.env.VITE_REST_API_BASE_URL,
            url: '/books/changeTitle',
            data: {
                slug: slug,
                newTitle: newTitle
            }
        })

        return response && response.code === '0000'
    }
}