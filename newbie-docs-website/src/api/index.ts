import axios, { AxiosError } from "axios";

export const useFilesApi = () => {
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
        uploadImage
    }
}