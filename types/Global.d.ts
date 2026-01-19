interface ApiData<T> {
  message: string
  code: number
  data: T
}

interface RpcRes<T> {
  success: boolean
  rpcData: T
  nodeInfo?: {
    endpoint: string
    responseTime: number
  }
  error?: {
    error: {
      code: number
      message: string
    }
  }
}

type WalletFile = {
  mnemonic: string
  path: string
  address: string
  privateKey: string
  passwordHash: string
}

type WalletFileData = {
  version: string
  encrypted: boolean
  data: string
  timestamp: number
}

interface SendList {
  address: string
  amount: string
}

interface PageType<T> {
  list: T[]
  pagination: Pagination
}

interface TransactionType {
  txid: string
  blockHeight: number
  size: number
  weight: number
  senders: Sender[]
  receivers: Sender[]
  changeOutputs: any[]
  totalAmount: number
  fee: number
  timestamp: string
  confirmations: number
  vouts?: TransactionVout[] // 添加输出信息
}

interface TransactionVout {
  value: number
  n: number
  scriptPubKey?: {
    hex?: string
    address?: string
    type?: string
  }
  addresses?: string[]
}

interface AddressTransactionsType {
  address: string
}
