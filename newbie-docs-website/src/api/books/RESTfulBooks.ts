import { Book } from "@/types/global";
import { UseBooksApiFunction } from "@/types/api";
import axiso, { AxiosError } from "axios";

export class UseRESTfulBooksApi implements UseBooksApiFunction {

    async dir(): Promise<Book[] | undefined> {
        const { data: response } = await axiso({
            method: 'get',
            baseURL: import.meta.env.VITE_REST_API_BASE_URL,
            url: '/books/dir'
        })

        if (response && response.code === '0000') {
            return response.result as Book[]
        } else {
            throw new AxiosError(response.message, response.code)
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
        } else {
            throw new AxiosError(response.message, response.code)
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

        const restful = response && response.code === '0000' && response.result > 0
        if (restful) {
            return restful
        } else {
            throw new AxiosError(response.message, response.code)
        }
    }

    async remove(id: number): Promise<boolean> {
        const { data: response } = await axiso({
            method: 'post',
            baseURL: import.meta.env.VITE_REST_API_BASE_URL,
            url: '/books/remove',
            data: {
                id
            }
        })

        const restful = response && response.code === '0000'
        if (restful) {
            return restful
        } else {
            throw new Error(`[${response.code}] ${response.message}`)
        }
    }

    async changeTitle(id: number, newTitle: string): Promise<boolean> {
        const { data: response } = await axiso({
            method: 'post',
            baseURL: import.meta.env.VITE_REST_API_BASE_URL,
            url: '/books/changeTitle',
            data: {
                id,
                newTitle: newTitle
            }
        })

        const restful = response && response.code === '0000'
        if (restful) {
            return restful
        } else {
            throw new Error(`[${response.code}] ${response.message}`)
        }
    }
}