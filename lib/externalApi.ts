import axios from 'axios'
import { analyzeTransaction } from './utils'

let baseUrl = 'https://explorer.scash.network/api/explorer'
if (process.env.NEXT_PUBLIC_BITCOIN_RPC_IS_TESTNET === 'true') {
  baseUrl = '/api/explorer'
}

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
    }) as ReturnType<T>
  }) as T
}

/**
 * 获取地址交易记录（原始函数）- 返回完整数据用于 DAP 解析
 */
const _getAddressTxsExtApi = async (address: string) => {
  const res = await axiosTool.get<PageType<TransactionType> & AddressTransactionsType>(`/address/${address}/txs`)
  const transactions = res.data.list

  // 同时返回分析后的交易和原始交易数据（用于 DAP 解析）
  const analyzedTransactions = transactions.map((tx) => analyzeTransaction(tx, address))

  // 返回带原始数据的交易信息
  const transactionsWithRaw = analyzedTransactions.map((analyzed, index) => ({
    ...analyzed,
    rawTransaction: transactions[index] // 保留原始交易数据，包含 vouts
  }))

  return transactionsWithRaw
}

/**
 * 获取地址交易记录（带防抖+节流）
 * @param address 地址
 * @param page 页码
 * @param pageSize 每页数量
 * @returns 地址交易记录（包含原始数据）
 */
export const getAddressTxsExtApi = debounceThrottle(_getAddressTxsExtApi, 300, 30000)
