interface ApiData<T> {
  message: string
  code: number
  data: T
}

interface RpcRes<T> {
  success: boolean
  rpcData: T
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
