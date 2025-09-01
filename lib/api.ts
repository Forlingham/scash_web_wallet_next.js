import axiosTool from './axiosReq'

// 防抖相关
const debounceTimers = new Map<string, NodeJS.Timeout>()

// 记录创建的地址,用于统计使用app人数
export function onUserCreateApi(address: string) {
  return axiosTool.post('/rpc/onUserCreate', {
    address
  })
}

export interface BlockchainInfo {
  chain: string
  blocks: number
  headers: number
  bestblockhash: string
  difficulty: number
  time: number
  mediantime: number
  verificationprogress: number
  initialblockdownload: boolean
  chainwork: string
  size_on_disk: number
  pruned: boolean
  warnings: string
  coinPrice: string
}
/**
 * 获取区块链信息
 * @param debounceMs 防抖延迟时间，默认300ms
 * @returns 区块链信息
 */
export function getBlockchainInfoApi(debounceMs: number = 300): Promise<ApiData<RpcRes<BlockchainInfo>>> {
  const key = 'getblockchaininfo'

  return new Promise((resolve, reject) => {
    // 清除之前的定时器
    if (debounceTimers.has(key)) {
      clearTimeout(debounceTimers.get(key)!)
    }

    // 设置新的防抖定时器
    const timer = setTimeout(async () => {
      try {
        const result = await axiosTool.post<RpcRes<BlockchainInfo>>('/rpc/getblockchaininfo', {})
        debounceTimers.delete(key)
        resolve(result)
      } catch (error) {
        debounceTimers.delete(key)
        reject(error)
      }
    }, debounceMs)

    debounceTimers.set(key, timer)
  })
}

export interface Scantxoutset {
  success: boolean
  txouts: number
  height: number
  bestblock: string
  unspents: Unspent[]
  total_amount: number
}

export interface Unspent {
  txid: string
  vout: number
  scriptPubKey: string
  desc: string
  amount: number
  coinbase: boolean
  height: number

  // 自己通过前端计算的
  isUsable?: boolean
  // 是否在内存池中，在的话就不可以使用
  isHasMemPool?: boolean
}
/**
 * 获取地址的未花费交易输出
 * @param address 地址
 * @returns 未花费交易输出
 */
export function getScantxoutsetApi(address: string, debounceMs: number = 300): Promise<ApiData<RpcRes<Scantxoutset>>> {
  const key = `scantxoutset_${address}`

  return new Promise((resolve, reject) => {
    // 清除之前的定时器
    if (debounceTimers.has(key)) {
      clearTimeout(debounceTimers.get(key)!)
    }

    // 设置新的防抖定时器
    const timer = setTimeout(async () => {
      try {
        const result = await axiosTool.post<RpcRes<Scantxoutset>>('/rpc/scantxoutset', {
          address
        })
        debounceTimers.delete(key)
        resolve(result)
      } catch (error) {
        debounceTimers.delete(key)
        reject(error)
      }
    }, debounceMs)

    debounceTimers.set(key, timer)
  })
}

interface BaseFee {
  feerate: number
  blocks: number
}
/**
 * 获取基础手续费
 * @param confTarget 确认目标，默认 6
 * @returns 基础手续费
 */
export function getBaseFeeApi(confTarget: number = 6, debounceMs: number = 300): Promise<ApiData<RpcRes<BaseFee>>> {
  const key = `estimatesmartfee_${confTarget}`

  return new Promise((resolve, reject) => {
    // 清除之前的定时器
    if (debounceTimers.has(key)) {
      clearTimeout(debounceTimers.get(key)!)
    }

    // 设置新的防抖定时器
    const timer = setTimeout(async () => {
      try {
        const result = await axiosTool.post<RpcRes<BaseFee>>('/rpc/estimatesmartfee', {
          confTarget
        })
        debounceTimers.delete(key)
        resolve(result)
      } catch (error) {
        debounceTimers.delete(key)
        reject(error)
      }
    }, debounceMs)

    debounceTimers.set(key, timer)
  })
}

export interface RawTransaction {
  txid: string
  hash: string
  blockhash?: string
  confirmations?: number
  time?: number
  blocktime?: number
}
/**
 * 获取交易详情（带防抖）
 * @param txid 交易哈希
 * @param debounceMs 防抖延迟时间，默认300ms
 * @returns 交易详情
 */
export function getRawTransactionApi(txid: string, debounceMs: number = 300): Promise<ApiData<RpcRes<RawTransaction>>> {
  return new Promise((resolve, reject) => {
    // 清除之前的防抖定时器
    if (debounceTimers.has(txid)) {
      clearTimeout(debounceTimers.get(txid)!)
    }

    // 设置新的防抖定时器
    const timer = setTimeout(async () => {
      try {
        // 创建实际的API请求
        const result = await axiosTool.post<RpcRes<RawTransaction>>('/rpc/getrawtransaction', {
          txid
        })

        // 清理防抖定时器
        debounceTimers.delete(txid)

        resolve(result)
      } catch (error) {
        // 请求失败时清理防抖定时器
        debounceTimers.delete(txid)
        reject(error)
      }
    }, debounceMs)

    debounceTimers.set(txid, timer)
  })
}

// export class SendRawTransactionDto {
//   @IsNotEmpty()
//   @Length(45, 45)
//   address: string
//   txid: string
//   @IsNotEmpty()
//   @Length(100, 10000)
//   rawtx: string
//   @IsNotEmpty()
//   totalInput: number
//   @IsNotEmpty()
//   totalOutput: number
//   @IsNotEmpty()
//   change: number
//   @IsNotEmpty()
//   feeRate: number
//   @IsNotEmpty()
//   appFee: number
// }

type SendRawTransactionDto = {
  address: string
  txid: string
  rawtx: string
  totalInput: number
  totalOutput: number
  change: number
  feeRate: number
  appFee: number
}

/**
 * 广播交易
 * @param rawtx 原始交易数据
 * @returns 交易哈希
 */
export function onBroadcastApi(
  sendRawTransactionDto: SendRawTransactionDto,
  debounceMs: number = 300
): Promise<ApiData<RpcRes<{ txid: string }>>> {
  const key = `broadcast_${sendRawTransactionDto.rawtx.slice(0, 20)}`

  return new Promise((resolve, reject) => {
    // 清除之前的定时器
    if (debounceTimers.has(key)) {
      clearTimeout(debounceTimers.get(key)!)
    }

    // 设置新的防抖定时器
    const timer = setTimeout(async () => {
      try {
        const result = await axiosTool.post<RpcRes<{ txid: string }>>('/rpc/broadcast', sendRawTransactionDto)
        debounceTimers.delete(key)
        resolve(result)
      } catch (error) {
        debounceTimers.delete(key)
        reject(error)
      }
    }, debounceMs)

    debounceTimers.set(key, timer)
  })
}
