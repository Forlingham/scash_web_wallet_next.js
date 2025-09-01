import { BlockchainInfo, getBaseFeeApi, getBlockchainInfoApi, getScantxoutsetApi, Unspent } from '@/lib/api'
import { decryptWallet } from '@/lib/utils'
import Decimal from 'decimal.js'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

// 钱包信息接口
interface WalletInfo {
  isHasWallet: boolean
  address: string
  balance: number
  lockBalance: number
  // 内存池中锁定的余额
  memPoolLockBalance: number
  usableBalance: number
  encryptedWallet: string
}

// 交易记录接口
interface Transaction {
  id: string
  type: 'send' | 'receive'
  amount: number
  address: string
  timestamp: number
  status: 'pending' | 'confirmed' | 'failed'
  height: number
}

// 内存池中的交易接口
export interface PendingTransaction {
  id: string
  rawtx: string
  totalInput: number
  totalOutput: number
  change: number
  feeRate: number
  timestamp: number
  pickUnspents: Unspent[]
  sendListConfirm: SendList[]
  status: 'pending' | 'confirmed' | 'failed'
}

// 钱包状态接口
interface WalletState {
  blockchainInfo: BlockchainInfo
  // 状态
  wallet: WalletInfo
  //可用的交易
  unspent: Unspent[]
  // 交易记录
  transactions: Transaction[]
  pendingTransactions: PendingTransaction[]
  isInitialized: boolean
  isLoading: boolean
  error: string | null
  isLocked: boolean
  coinPrice: string
  // 确认数
  confirmations: number
  // 基础交易手续费
  baseFee: number

  // Actions - 类似 Pinia 的 actions
  setWallet: (wallet: WalletInfo) => void
  updateBalance: (balance: number) => void
  addTransaction: (transaction: Transaction) => void
  addPendingTransaction: (transaction: PendingTransaction) => void
  setUnspent: (unspent: Unspent[]) => void
  lockWallet: () => void
  unlockWallet: (password: string) => boolean
  clearWallet: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  // Getters - 类似 Pinia 的 getters
  // getFormattedBalance: () => string
  // getRecentTransactions: (limit?: number) => Transaction[]
  // isWalletConnected: () => boolean

  getBaseFee: (isRemote?: boolean) => Promise<{
    isSuccess: boolean
    status: 'local' | 'remote' | 'error'
    fee: number
  }>
  // 定时跟新数据的一些方法
  unSetUpdate: () => void
  setUpdateBlockchaininfo: () => Promise<void>
  setUpdateBalance: () => Promise<void>

  setUpdateBalanceByMemPool: () => void
}

// 创建钱包状态存储 - 类似 Pinia 的 defineStore
export const useWalletStore = create<WalletState>()(
  // 持久化中间件 - 类似 Pinia 的 persist
  persist(
    // Immer 中间件用于不可变状态更新
    immer((set, get) => ({
      blockchainInfo: {
        chain: '',
        blocks: 0,
        headers: 0,
        bestblockhash: '',
        difficulty: 0,
        time: 0,
        mediantime: 0,
        verificationprogress: 0,
        initialblockdownload: false,
        chainwork: '',
        size_on_disk: 0,
        pruned: false,
        warnings: '',
        coinPrice: '0'
      },
      // 初始状态
      wallet: {
        isHasWallet: false,
        address: '',
        balance: 0,
        lockBalance: 0,
        memPoolLockBalance: 0,
        usableBalance: 0,
        encryptedWallet: ''
      },
      unspent: [],
      transactions: [],
      pendingTransactions: [],
      isInitialized: false,
      isLoading: false,
      error: null,
      isLocked: false,
      coinPrice: '0',
      confirmations: 1,
      baseFee: 0,

      // Actions
      setWallet: (wallet: WalletInfo) => {
        set((state) => {
          state.wallet = wallet
          state.error = null
        })
      },

      updateBalance: (balance: number) => {
        set((state) => {
          if (state.wallet) {
            state.wallet.balance = balance
          }
        })
      },

      addTransaction: (transaction: Transaction) => {
        set((state) => {
          // 检查是否已存在相同的交易
          const existingTransaction = state.transactions.find((tx) => tx.id === transaction.id)
          if (existingTransaction) {
            // 如果已存在，更新状态而不是添加
            Object.assign(existingTransaction, transaction)
            return
          }

          state.transactions.unshift(transaction)
          // 只保留最近 100 条交易记录
          if (state.transactions.length > 100) {
            state.transactions = state.transactions.slice(0, 100)
          }
        })
      },

      addPendingTransaction: (transaction: PendingTransaction) => {
        set((state) => {
          // 检查是否已存在相同的交易
          const existingTransaction = state.pendingTransactions.find((tx) => tx.id === transaction.id)
          if (existingTransaction) {
            // 如果已存在，更新状态而不是添加
            Object.assign(existingTransaction, transaction)
            return
          }
          state.pendingTransactions.push(transaction)
        })
      },

      setUnspent: (unspent: Unspent[]) => {
        set((state) => {
          unspent.forEach((item) => {
            const existingTransaction = state.unspent.find((tx) => tx.txid === item.txid)
            if (existingTransaction) {
              Object.assign(existingTransaction, item)
            } else {
              state.unspent.push(item)
            }
          })
          // state.unspent = unspent
        })
      },

      lockWallet: () => {
        set((state) => {
          state.isLocked = true
        })
      },

      unlockWallet: (password: string) => {
        // 这里应该实现密码验证逻辑
        // 暂时简单返回 true
        if (!password) {
          return false
        }
        const walletObj = decryptWallet(get().wallet.encryptedWallet, password)
        if (!walletObj) {
          return false
        }

        set((state) => {
          state.isLocked = false
        })
        return true
      },

      clearWallet: () => {
        set((state) => {
          state.wallet = {
            isHasWallet: false,
            address: '',
            balance: 0,
            lockBalance: 0,
            memPoolLockBalance: 0,
            usableBalance: 0,
            encryptedWallet: ''
          }
          state.transactions = []

          state.error = null
        })
      },

      setLoading: (loading: boolean) => {
        set((state) => {
          state.isLoading = loading
        })
      },

      setError: (error: string | null) => {
        set((state) => {
          state.error = error
        })
      },

      // Getters
      getFormattedBalance: () => {
        const wallet = get().wallet
        if (!wallet) return '0.00000000'
        return (wallet.balance / 100000000).toFixed(8) // 转换为 BTC 单位
      },

      getRecentTransactions: (limit = 10) => {
        return get().transactions.slice(0, limit)
      },

      isWalletConnected: () => {
        const wallet = get().wallet
        const isLocked = get().isLocked
        return wallet.address !== '' && !isLocked
      },

      // 获取基础交易手续费
      getBaseFee: async (isRemote = false) => {
        const localFee = get().baseFee
        if (localFee && !isRemote) {
          return {
            isSuccess: true,
            status: 'local',
            fee: localFee
          }
        }
        try {
          const res = await getBaseFeeApi()
          if (res.data.success) {
            const fee = res.data.rpcData.feerate
            set((state) => {
              state.baseFee = fee
            })
            return {
              isSuccess: true,
              status: 'remote',
              fee: fee
            }
          }
          return {
            isSuccess: false,
            status: 'error',
            fee: 0
          }
        } catch (error) {
          console.log('获取基础交易手续费 错误：', error)
          return {
            isSuccess: false,
            status: 'error',
            fee: 0
          }
        }
      },

      // 定时跟新数据的一些方法
      unSetUpdate: () => {
        setTimeout(() => {
          get().setUpdateBlockchaininfo()
          get().setUpdateBalance()
        }, 10 * 1000)
      },

      // 获取当前节点状态
      setUpdateBlockchaininfo: async () => {
        try {
          const res = await getBlockchainInfoApi()
          if (res.data.success) {
            set((state) => {
              state.blockchainInfo = res.data.rpcData

              state.coinPrice = res.data.rpcData.coinPrice
            })
          }
        } catch (error) {
          console.log('获取当前节点状态 错误：', error)
        }
      },

      // 获取当前账号余额，和可用的交易
      setUpdateBalance: async () => {
        const address = get().wallet.address
        if (!address) return
        try {
          const res = await getScantxoutsetApi(address)
          if (res.data.success) {
            const resData = res.data.rpcData
            const currentHeight = resData.height

            // 计算可用余额
            const unspents = resData.unspents
            for (const unspent of unspents) {
              unspent.isHasMemPool = false
              if (unspent.height < currentHeight - get().confirmations) {
                unspent.isUsable = true
              } else {
                unspent.isUsable = false
              }
            }
            // const wallet = get().wallet
            // 计算可用余额
            const usableBalance = unspents.reduce((acc, cur) => {
              if (cur.isUsable) {
                acc = acc.plus(new Decimal(cur.amount))
              }
              return acc
            }, new Decimal(0))

            const lockBalance = new Decimal(resData.total_amount).minus(usableBalance)

            set((state) => {
              state.wallet.balance = resData.total_amount
              state.wallet.usableBalance = usableBalance.toNumber()
              state.wallet.lockBalance = lockBalance.toNumber()
            })
            get().setUnspent(unspents)
          }
        } catch (error) {
          console.log('获取当前账号余额 错误：', error)
        }
      },

      // 通过内存池中的记录来锁定交易
      setUpdateBalanceByMemPool: () => {
        set((state) => {
          for (const tx of state.pendingTransactions) {
            if (tx.status === 'pending') {
              for (const pickUnspent of tx.pickUnspents) {
                const unspent = state.unspent.find((item) => item.txid === pickUnspent.txid)
                if (unspent) {
                  unspent.isHasMemPool = true // 在 set 内部写，immer 允许直接改
                }
              }
            }
          }

          state.wallet.usableBalance = state.unspent
            .reduce((acc, cur) => {
              if (cur.isUsable && !cur.isHasMemPool) {
                return acc.plus(new Decimal(cur.amount))
              }
              return acc
            }, new Decimal(0))
            .toNumber()

          state.wallet.memPoolLockBalance = state.unspent
            .reduce((acc, cur) => {
              if (cur.isHasMemPool) {
                return acc.plus(new Decimal(cur.amount))
              }
              return acc
            }, new Decimal(0))
            .toNumber()
        })
      }
    })),
    {
      name: 'wallet-storage', // 本地存储的 key
      storage: createJSONStorage(() => localStorage), // 使用 localStorage
      // 只持久化部分状态，排除敏感信息
      partialize: (state) => ({
        wallet: state.wallet,
        pendingTransactions: state.pendingTransactions,
        transactions: state.transactions,
        isInitialized: state.isInitialized,
        isLocked: state.isLocked,
        coinPrice: state.coinPrice
      })
    }
  )
)

// 导出类型
export type { WalletInfo, Transaction, WalletState }

// 钱包操作的 hooks - 类似 Pinia 的组合式 API
export const useWalletActions = () => {
  const store = useWalletStore()

  return {
    setWallet: store.setWallet,
    updateBalance: store.updateBalance,
    addTransaction: store.addTransaction,
    addPendingTransaction: store.addPendingTransaction,
    lockWallet: store.lockWallet,
    unlockWallet: store.unlockWallet,
    clearWallet: store.clearWallet,
    setLoading: store.setLoading,
    setError: store.setError,

    getBaseFee: store.getBaseFee,

    unSetUpdate: store.unSetUpdate,
    setUpdateBlockchaininfo: store.setUpdateBlockchaininfo,
    setUpdateBalance: store.setUpdateBalance,
    setUpdateBalanceByMemPool: store.setUpdateBalanceByMemPool
  }
}

// 钱包状态的 hooks - 使用单独的选择器避免无限循环
export const useWalletState = () => {
  const blockchainInfo = useWalletStore((state) => state.blockchainInfo)
  const wallet = useWalletStore((state) => state.wallet)
  const unspent = useWalletStore((state) => state.unspent)
  const transactions = useWalletStore((state) => state.transactions)
  const pendingTransactions = useWalletStore((state) => state.pendingTransactions)
  const confirmations = useWalletStore((state) => state.confirmations)
  const coinPrice = useWalletStore((state) => state.coinPrice)
  const isInitialized = useWalletStore((state) => state.isInitialized)
  const isLoading = useWalletStore((state) => state.isLoading)
  const error = useWalletStore((state) => state.error)
  const isLocked = useWalletStore((state) => state.isLocked)
  // const recentTransactions = useWalletStore((state) => state.getRecentTransactions())
  // const formattedBalance = useWalletStore((state) => state.getFormattedBalance())
  // const isConnected = useWalletStore((state) => state.isWalletConnected())

  return {
    blockchainInfo,
    wallet,
    unspent,
    transactions,
    pendingTransactions,
    confirmations,
    coinPrice,
    isInitialized,
    isLoading,
    error,
    isLocked,
    // recentTransactions,
    // formattedBalance,
    // isConnected
  }
}
