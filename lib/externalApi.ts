import axios from 'axios'

const baseUrl = '/ext'

const axiosTool = axios.create({
  baseURL: baseUrl,
  timeout: 60000
})

// 防抖+节流缓存
const cache = new Map<string, { data: any; timestamp: number }>()
const debounceTimers = new Map<string, NodeJS.Timeout>()

/**
 * 防抖+节流包装函数
 * @param fn 原函数
 * @param debounceMs 防抖时间（毫秒）
 * @param throttleMs 节流缓存时间（毫秒）
 */
function debounceThrottle<T extends (...args: any[]) => Promise<any>>(fn: T, debounceMs: number, throttleMs: number): T {
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args)

    // 检查节流缓存
    const cached = cache.get(key)
    if (cached && Date.now() - cached.timestamp < throttleMs) {
      return Promise.resolve(cached.data)
    }

    // 清除之前的防抖定时器
    const existingTimer = debounceTimers.get(key)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    // 设置新的防抖定时器
    return new Promise((resolve, reject) => {
      const timer = setTimeout(async () => {
        try {
          const result = await fn(...args)
          // 缓存结果
          cache.set(key, { data: result, timestamp: Date.now() })
          debounceTimers.delete(key)
          resolve(result)
        } catch (error) {
          debounceTimers.delete(key)
          reject(error)
        }
      }, debounceMs)

      debounceTimers.set(key, timer)
    })
  }) as T
}

///ext/getaddresstxs/scash1qk9exxence0p6f5yqp2w73cjugyejnqxmzjvdv6/0/50/internal
export interface AddressTxsExt {
  data: (number | string)[][] // 时间 tX  收到金额  发送金额  余额
  recordsTotal: number
  recordsFiltered: number
}
/**
 * 获取地址交易记录（原始函数）
 */
const _getAddressTxsExtApi = (address: string, page: number = 0, pageSize: number = 20) => {
  return axiosTool.get<AddressTxsExt>(`/getaddresstxs/${address}/${page}/${pageSize}/internal`)
}

/**
 * 获取地址交易记录（带防抖+节流）
 * @param address 地址
 * @param page 页码
 * @param pageSize 每页数量
 * @returns 地址交易记录
 */
export const getAddressTxsExtApi = debounceThrottle(_getAddressTxsExtApi, 300, 30000)
