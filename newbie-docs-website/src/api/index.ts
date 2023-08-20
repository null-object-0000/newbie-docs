import axios, { AxiosError } from "axios";
import { v4 as uuidv4 } from 'uuid'

export const useFilesApi = () => {
    const uploadFile = async (file: File): Promise<string> => {
        const uuid = uuidv4()
        const formdata = new FormData();
        formdata.append('key', `${uuid}/${file.name}`);
        formdata.append('file', file);

        const { data: response } = await axios({
            method: 'post',
            url: import.meta.env.VITE_REST_API_BASE_URL + import.meta.env.VITE_UPLOAD_FILE_API_URL,
            data: formdata,
            headers: { 'Content-Type': 'multipart/form-data' }
        })

        if (response && response.code === '0000') {
            return response.result
        } else {
            throw new AxiosError(response.message, response.code)
        }
    }

    const uploadImage = async (imgfile: File): Promise<string> => {
        const formdata = new FormData();
        formdata.append('file', imgfile);

        const { data: response } = await axios({
            method: 'post',
            url: import.meta.env.VITE_REST_API_BASE_URL + import.meta.env.VITE_UPLOAD_IMAGE_API_URL,
            data: formdata,
            headers: { 'Content-Type': 'multipart/form-data' }
        })

        if (response && response.code === '0000') {
            return response.result
        } else {
            throw new AxiosError(response.message, response.code)
        }
    }

    return {
        uploadFile,
        uploadImage
    }
}