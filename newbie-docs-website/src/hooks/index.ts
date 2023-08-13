import { Ref, ref } from "vue"

/**
 * @param minInterval 打开 loading 后最小显示时间，单位 ms
 * @param delayTime 延迟 55ms 打开 loading，若在 55ms 内关闭 loading，则不打开 loading
 */
export const useLoading = ({ minInterval, delayTime } = { minInterval: 550, delayTime: 10 }) => {
    const status = ref(false)
    const realStatus = ref(false)
    const lastTrueTime = ref(0)
    const openLoadingTimeout = ref() as Ref<number | undefined>;

    const getStatus = (real?: boolean) => real ? realStatus.value : status.value

    const setStatus = async (value: boolean) => {
        realStatus.value = value

        if (value === true) {
            if (delayTime > 0) {
                openLoadingTimeout.value = setTimeout(() => {
                    lastTrueTime.value = new Date().getTime();
                    status.value = true;
                }, delayTime)
            } else {
                lastTrueTime.value = new Date().getTime();
                status.value = true;
            }
        } else if (value === false) {
            clearTimeout(openLoadingTimeout.value)

            // 关闭 loading时，如果距离上次打开 loading 的时间小于最小间隔时间，则等待
            const time = new Date().getTime() - lastTrueTime.value
            if (time < minInterval) {
                await new Promise(resolve => setTimeout(resolve, minInterval - time))
            }
            status.value = value
        }
    }

    return {
        get: getStatus,
        set: setStatus
    }
}