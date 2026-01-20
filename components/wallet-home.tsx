'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useLanguage } from '@/contexts/language-context'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Menu,
  Bell,
  Settings,
  Clock,
  X,
  Database,
  Wifi,
  WifiOff,
  MessageSquare,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { calcValue, NAME_TOKEN, onOpenExplorer } from '@/lib/utils'
import { PendingTransaction, Transaction, useWalletActions, useWalletState } from '@/stores/wallet-store'
import { getAddressTxsExtApi } from '@/lib/externalApi'
import { parseDapMessage, formatDapPreview, type DapMessage } from '@/lib/dap'
import Decimal from 'decimal.js'
import { getRawTransactionApi } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

interface WalletHomeProps {
  onNavigate: (view: string) => void
}

export function WalletHome({ onNavigate }: WalletHomeProps) {
  const { wallet, coinPrice, unspent, transactions, pendingTransactions, blockchainInfo, confirmations, isLocked, nodeInfo } =
    useWalletState()
  const { addTransaction, addPendingTransaction, lockWallet } = useWalletActions()
  const { t } = useLanguage()
  const { toast } = useToast()
  const [selectedPeriod, setSelectedPeriod] = useState('30D')
  const [getAddressTxsLoading, setGetAddressTxsLoading] = useState<boolean>(false)
  const [explorerConnectionStatus, setExplorerConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking')
  const [explorerResponseTime, setExplorerResponseTime] = useState<number>(0) // 响应时间（毫秒）

  // 存储每笔交易的 DAP 消息
  const [dapMessages, setDapMessages] = useState<Map<string, DapMessage>>(new Map())
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null) // 展开的交易 ID
  const [isScrolled, setIsScrolled] = useState(false)

  async function getTxs() {
    if (!wallet.address) return
    if (getAddressTxsLoading) return

    const startTime = Date.now() // 记录开始时间

    try {
      setGetAddressTxsLoading(true)
      setExplorerConnectionStatus('checking')

      const res = await getAddressTxsExtApi(wallet.address)

      // 计算响应时间
      const responseTime = Date.now() - startTime
      setExplorerResponseTime(responseTime)
      setExplorerConnectionStatus('connected')

      if (!res.length) return

      // 解析 DAP 消息
      const newDapMessages = new Map<string, DapMessage>()

      for (const tx of res) {
        // 解析 DAP 消息（使用 rawTransaction 中的数据）
        if (tx.rawTransaction) {
          const outputs = tx.rawTransaction.vouts || tx.rawTransaction.receivers || []
          const senderAddress = tx.rawTransaction.senders?.[0]?.address || ''

          const dapMessage = parseDapMessage(outputs, senderAddress, wallet.address)
          if (dapMessage) {
            newDapMessages.set(tx.txid, dapMessage)
          }
        }
      }

      // 更新 DAP 消息
      setDapMessages(newDapMessages)

      for (const tx of res.reverse()) {
        let txInfo: Transaction
        const unspentTx = unspent.find((item) => item.txid === tx.txid)
        const type = ['income', 'mining'].includes(tx.type) ? 'receive' : 'send'
        let amount = 0
        if (type === 'send') {
          amount = new Decimal(tx.netAmount).toNumber()
          amount = amount * -1
        } else {
          amount = tx.netAmount
        }
        if (unspentTx) {
          txInfo = {
            id: tx.txid,
            type: type,
            amount: amount,
            address: '',
            timestamp: new Date(tx.timestamp).getTime(),
            status: unspentTx.isUsable ? 'confirmed' : 'pending',
            height: unspentTx.height
          }
        } else {
          txInfo = {
            id: tx.txid,
            type: type,
            amount: amount,
            address: '',
            timestamp: new Date(tx.timestamp).getTime(),
            status: 'confirmed',
            height: 0
          }
        }

        addTransaction(txInfo)
      }
    } catch (error) {
      console.log(error, 'error')
      setExplorerConnectionStatus('disconnected')
    } finally {
      setGetAddressTxsLoading(false)
    }
  }

  // 根据响应时间获取信号强度和颜色
  const getSignalStrength = () => {
    if (explorerConnectionStatus === 'disconnected') {
      return { strength: 0, color: 'text-red-500', bars: 0, label: t('node.signal.disconnected') }
    }
    if (explorerConnectionStatus === 'checking') {
      return { strength: 0, color: 'text-yellow-500', bars: 0, label: t('explorer.status.checking') }
    }

    // 根据响应时间判断信号质量
    // < 500ms: 极好 (3格)
    // 500-1500ms: 良好 (2格)
    // 1500-3000ms: 一般 (1格)
    // > 3000ms: 较差 (1格，黄色)
    if (explorerResponseTime < 500) {
      return { strength: 3, color: 'text-green-500', bars: 3, label: `${t('node.signal.excellent')} (${explorerResponseTime}ms)` }
    } else if (explorerResponseTime < 1500) {
      return { strength: 2, color: 'text-green-400', bars: 2, label: `${t('node.signal.good')} (${explorerResponseTime}ms)` }
    } else if (explorerResponseTime < 3000) {
      return { strength: 1, color: 'text-yellow-500', bars: 1, label: `${t('node.signal.fair')} (${explorerResponseTime}ms)` }
    } else {
      return { strength: 1, color: 'text-orange-500', bars: 1, label: `${t('node.signal.slow')} (${explorerResponseTime}ms)` }
    }
  }

  // 节点信号强度计算
  const getNodeSignalStrength = () => {
    if (nodeInfo.status === 'disconnected') {
      return { strength: 0, color: 'text-red-500', bars: 0, label: t('node.signal.disconnected') }
    }
    if (nodeInfo.status === 'checking') {
      return { strength: 0, color: 'text-yellow-500', bars: 0, label: t('node.status.checking') }
    }

    if (nodeInfo.responseTime < 500) {
      return { strength: 3, color: 'text-green-500', bars: 3, label: `${t('node.signal.excellent')} (${nodeInfo.responseTime}ms)` }
    } else if (nodeInfo.responseTime < 1500) {
      return { strength: 2, color: 'text-green-400', bars: 2, label: `${t('node.signal.good')} (${nodeInfo.responseTime}ms)` }
    } else if (nodeInfo.responseTime < 3000) {
      return { strength: 1, color: 'text-yellow-500', bars: 1, label: `${t('node.signal.fair')} (${nodeInfo.responseTime}ms)` }
    } else {
      return { strength: 1, color: 'text-orange-500', bars: 1, label: `${t('node.signal.slow')} (${nodeInfo.responseTime}ms)` }
    }
  }

  async function getRawTransaction(pendingTx: PendingTransaction) {
    try {
      const res = await getRawTransactionApi(pendingTx.id)
      if (!res.data.success) return

      if (res.data.rpcData.blockhash) {
        addPendingTransaction({
          ...pendingTx,
          status: 'confirmed'
        })
      }
    } catch (error) {
      console.log(error, 'error')
    }
  }
  async function getPendingTxs() {
    for (const tx of pendingTransactions) {
      if (tx.status === 'pending') {
        await getRawTransaction(tx)
      }
    }
  }

  // 验证登录是否过期
  const onLoginExpired = () => {
    if (!isLocked) {
      const loginTime = localStorage.getItem('loginTime')
      if (!loginTime) {
        localStorage.setItem('loginTime', new Date().getTime().toString())
        return
      }
      const currentTime = new Date().getTime()
      const timeDiff = currentTime - Number(loginTime)
      const time = 1000 * 60 * 60 * 2
      if (timeDiff > time) {
        localStorage.setItem('loginTime', '')
        lockWallet()
      } else {
        localStorage.setItem('loginTime', new Date().getTime().toString())
      }
    }
  }

  useEffect(() => {
    let txsIntervalTime = 1000 * 60 * 3
    if (process.env.NEXT_PUBLIC_BITCOIN_RPC_IS_TESTNET === 'true') {
      txsIntervalTime = 1000 * 30
    }
    getTxs()
    const txsInterval = setTimeout(() => {
      getTxs()
    }, txsIntervalTime)

    getPendingTxs()
    onLoginExpired()

    const handleScroll = () => {
      const container = document.getElementById('wallet-scroll-container')
      const scrollTop = container ? container.scrollTop : 0
      const windowScroll = window.scrollY
      setIsScrolled(scrollTop > 50 || windowScroll > 50)
    }

    const container = document.getElementById('wallet-scroll-container')
    if (container) {
      container.addEventListener('scroll', handleScroll)
    }
    window.addEventListener('scroll', handleScroll)
    
    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll)
      }
      window.removeEventListener('scroll', handleScroll)
      clearTimeout(txsInterval)
    }
  }, [wallet.balance, unspent])

  return (
    <>
      {/* Fixed Header */}
      <div
        className={`absolute top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-md shadow-lg transition-all duration-300 ${
          isScrolled ? 'py-2 border-transparent' : 'py-4 border-b border-purple-500/30'
        }`}
      >
        <div className={`flex justify-between items-center transition-all duration-300 ${isScrolled ? 'px-3' : 'px-4'}`}>
          <div className={`flex items-center gap-3 transition-all duration-300 ${isScrolled ? 'scale-90' : ''}`}>
            <div className="relative">
              <img
                src="https://r2.scash.network/logo.png"
                alt="SCASH Logo"
                className={`rounded-full border-2 border-purple-400/50 shadow-lg transition-all duration-300 ${
                  isScrolled ? 'w-8 h-8' : 'w-10 h-10'
                }`}
              />
              <div
                className={`absolute -top-1 -right-1 bg-green-400 rounded-full border-2 border-gray-900 transition-all duration-300 ${
                  isScrolled ? 'w-2.5 h-2.5' : 'w-3 h-3'
                }`}
              ></div>
            </div>
            <div className={`transition-all duration-300 ${isScrolled ? 'opacity-0 hidden' : ''}`}>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {t('wallet.title')}
              </h1>
              <div className="text-xs text-gray-400">{t('wallet.subtitle')}</div>
            </div>
            <div className={`transition-all duration-300 ${isScrolled ? 'opacity-100' : 'opacity-0 hidden'}`}>
              <h1 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">SCASH Wallet</h1>
            </div>
          </div>
          <div className={`flex items-center gap-3 transition-all duration-300 ${isScrolled ? 'scale-90' : ''}`}>
            <div
              className={`bg-purple-500/10 border border-purple-500/20 rounded-lg transition-all duration-300 ${
                isScrolled ? 'px-2 py-0.5' : 'px-3 py-1.5'
              }`}
            >
              <div
                className={`text-purple-300 font-medium transition-all duration-300 ${
                isScrolled ? 'text-[14px]' : 'text-xs'
              }`}
              >
                {t('wallet.blockHeight')}
              </div>
              <div className={`text-white font-semibold transition-all duration-300 ${isScrolled ? 'text-[10px]' : 'text-sm'}`}>
                {blockchainInfo.headers.toLocaleString()}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-300 hover:text-white hover:bg-purple-500/20 transition-all duration-200"
              onClick={() => onNavigate('settings')}
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Simplified Balance - Shows when scrolled past balance card */}
      <div
        className={`absolute top-[55px] left-0 right-0 z-40 bg-gray-900/98 backdrop-blur-md shadow-lg transition-all duration-300 ${
          isScrolled ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}
      >
        <div className="px-4 py-2.5">
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="bg-green-500/5 rounded-lg p-2 text-center">
              <div className="text-green-400/80 font-medium text-[10px] uppercase tracking-wide">{t('wallet.available')}</div>
              <div className="text-white font-semibold text-sm mt-0.5">{wallet.usableBalance}</div>
            </div>
            <div className="bg-orange-500/5 rounded-lg p-2 text-center">
              <div className="text-orange-400/80 font-medium text-[10px] uppercase tracking-wide">{t('wallet.locked')}</div>
              <div className="text-white font-semibold text-sm mt-0.5">{wallet.lockBalance}</div>
            </div>
            <div className="bg-blue-500/5 rounded-lg p-2 text-center">
              <div className="text-blue-400/80 font-medium text-[10px] uppercase tracking-wide">{t('wallet.memPool')}</div>
              <div className="text-white font-semibold text-sm mt-0.5">{wallet.memPoolLockBalance}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with top padding for fixed header */}
      <div className={`pt-20 flex-1 p-4 space-y-4 overflow-y-auto transition-all duration-300 ${isScrolled ? 'mt-0' : 'mt-10'}`}>
        <Card className="relative bg-gradient-to-br from-purple-900/20 via-gray-800 to-purple-800/30 border-purple-500/30 backdrop-blur-sm overflow-hidden">
          {/* 节点连接状态栏 - 浮动在左上角 */}
          <div className="absolute top-3 left-6 z-20 flex items-center gap-2">
            <div className="relative group">
              {nodeInfo.status === 'disconnected' && <WifiOff className="h-3.5 w-3.5 text-red-500" />}

              {nodeInfo.status === 'checking' && (
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-yellow-500/30 border-t-yellow-500"></div>
              )}

              {nodeInfo.status === 'connected' && (
                <div className="flex items-end gap-0.5">
                  {[1, 2, 3].map((bar) => (
                    <div
                      key={bar}
                      className={`w-1 rounded-sm transition-all ${
                        bar <= getNodeSignalStrength().bars ? getNodeSignalStrength().color.replace('text-', 'bg-') : 'bg-gray-600'
                      }`}
                      style={{ height: `${bar * 3.5}px` }}
                    />
                  ))}
                </div>
              )}
            </div>

            {nodeInfo.status === 'disconnected' && <span className="text-xs text-red-400">{t('node.status.disconnected')}</span>}
            {nodeInfo.status === 'checking' && <span className="text-xs text-yellow-400">{t('node.status.checking')}</span>}
            {nodeInfo.status === 'connected' && (
              <span className="text-xs text-gray-400">
                {t('node.status.connected')}: <span className={getNodeSignalStrength().color}>{getNodeSignalStrength().label}</span>
                <span className="text-gray-500 ml-1">({nodeInfo.endpoint})</span>
              </span>
            )}
          </div>

          {/* 硬币logo背景 */}
          <div className="absolute top-0 right-0 w-20 h-20 opacity-10">
            <img src="https://r2.scash.network/logo.png" alt="Coin Logo" className="w-full h-full object-contain filter brightness-150" />
          </div>

          <CardContent className="px-6 py-5 relative z-10">
            <div className="space-y-4">
              {/* 余额详情 */}
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2 text-center">
                  <div className="text-green-400 font-medium">{t('wallet.available')}</div>
                  <div className="text-white font-semibold">{wallet.usableBalance}</div>
                </div>
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-2 text-center">
                  <div className="text-orange-400 font-medium">{t('wallet.locked')}</div>
                  <div className="text-white font-semibold">{wallet.lockBalance}</div>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2 text-center">
                  <div className="text-blue-400 font-medium">{t('wallet.memPool')}</div>
                  <div className="text-white font-semibold">{wallet.memPoolLockBalance}</div>
                </div>
              </div>

              {/* 总余额 */}
              <div className="text-center space-y-2">
                <div className="relative text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent flex items-end justify-center gap-2">
                  <span>
                    {wallet.balance.toString().split('.')[0] && Number(wallet.balance.toString().split('.')[0]).toLocaleString()}
                    {wallet.balance.toString().includes('.') && (
                      <span className="text-2xl">.{wallet.balance.toString().split('.')[1]}</span>
                    )}
                    <span className="absolute bottom-0 text-sm text-gray-400 font-normal">{NAME_TOKEN}</span>
                  </span>
                </div>
                <div className="text-xl text-gray-300 font-medium">${calcValue(wallet.balance, coinPrice)} USD</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-4 gap-2">
          {/* Trade Button */}
          <button
            className="group flex flex-col items-center justify-center p-3 rounded-xl bg-gradient-to-br from-orange-500/10 to-red-600/5 border border-orange-500/30 hover:border-orange-400/60 hover:from-orange-500/20 hover:to-red-600/10 transition-all duration-300 active:scale-95"
            onClick={() => {
              onNavigate('trade')
            }}
          >
            <div className="relative mb-2">
              <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <ArrowUpDown className="h-5 w-5 text-orange-400" />
              </div>
              <div className="absolute inset-0 rounded-full bg-orange-400/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <span className="text-xs text-orange-400/80 font-medium">{t('action.trade')}</span>
          </button>
          {/* Engrave Button */}
          <button
            className="group flex flex-col items-center justify-center p-3 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-600/5 border border-purple-500/30 hover:border-purple-400/60 hover:from-purple-500/20 hover:to-pink-600/10 transition-all duration-300 active:scale-95"
            onClick={() => {
              onNavigate('engrave')
            }}
          >
            <div className="relative mb-2">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <MessageSquare className="h-5 w-5 text-purple-400" />
              </div>
              <div className="absolute inset-0 rounded-full bg-purple-400/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <span className="text-xs text-purple-400/80 font-medium">{t('action.engrave')}</span>
          </button>

          {/* Receive Button */}
          <button
            className="group flex flex-col items-center justify-center p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/30 hover:border-green-400/60 hover:from-green-500/20 hover:to-green-600/10 transition-all duration-300 active:scale-95"
            onClick={() => {
              onNavigate('receive')
            }}
          >
            <div className="relative mb-2">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <ArrowDown className="h-5 w-5 text-green-400" />
              </div>
              <div className="absolute inset-0 rounded-full bg-green-400/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <span className="text-xs text-green-400/80 font-medium">{t('action.receive')}</span>
          </button>

          {/* Send Button */}
          <button
            className="group flex flex-col items-center justify-center p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-600/5 border border-blue-500/30 hover:border-blue-400/60 hover:from-blue-500/20 hover:to-cyan-600/10 transition-all duration-300 active:scale-95"
            onClick={() => {
              onNavigate('send')
            }}
          >
            <div className="relative mb-2">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <ArrowUp className="h-5 w-5 text-blue-400" />
              </div>
              <div className="absolute inset-0 rounded-full bg-blue-400/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <span className="text-xs text-blue-400/80 font-medium">{t('action.send')}</span>
          </button>
        </div>

        {/* Recent Transactions */}
        <Card className="bg-gray-800 border-gray-700 pt-0">
          <CardContent className="px-4">
            {/* 状态栏 - 区块浏览器连接状态 */}
            <div className="flex items-center gap-2 pt-3 pb-2">
              <div className="relative group">
                {explorerConnectionStatus === 'disconnected' && <WifiOff className="h-3.5 w-3.5 text-red-500" />}

                {explorerConnectionStatus === 'checking' && (
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-yellow-500/30 border-t-yellow-500"></div>
                )}

                {explorerConnectionStatus === 'connected' && (
                  <div className="flex items-end gap-0.5">
                    {/* 信号强度条 */}
                    {[1, 2, 3].map((bar) => (
                      <div
                        key={bar}
                        className={`w-1 rounded-sm transition-all ${
                          bar <= getSignalStrength().bars ? getSignalStrength().color.replace('text-', 'bg-') : 'bg-gray-600'
                        }`}
                        style={{ height: `${bar * 3.5}px` }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* 状态文字提示 - 直接显示在信号后面 */}
              {explorerConnectionStatus === 'disconnected' && (
                <span className="text-xs text-red-400">{t('explorer.status.disconnected')}</span>
              )}
              {explorerConnectionStatus === 'checking' && <span className="text-xs text-yellow-400">{t('explorer.status.checking')}</span>}
              {explorerConnectionStatus === 'connected' && (
                <span className="text-xs text-gray-400">
                  {t('explorer.status.connected')}: <span className={getSignalStrength().color}>{getSignalStrength().label}</span>
                </span>
              )}
            </div>

            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-medium">{t('transactions.recent')}</h3>

              <Button
                variant="ghost"
                size="sm"
                className="text-green-400 hover:text-green-300"
                onClick={() => onOpenExplorer('2', 'address', wallet.address)}
              >
                {t('transactions.openExplorer')}
              </Button>
            </div>

            <div className="space-y-3">
              {pendingTransactions.map((tx) => (
                <div key={tx.id}>
                  {tx.status === 'pending' && (
                    <div className=" p-3 bg-gray-900 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-orange-500`}>
                            <Database className="h-4 w-4 text-white" />
                          </div>

                          <div>
                            <p className="text-white font-medium">
                              {t('transactions.sent')} {NAME_TOKEN}
                            </p>
                            {tx.id && (
                              <p className="text-gray-400 text-sm">
                                {tx.id.slice(0, 6)}····{tx.id.slice(-6)}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-medium text-red-400`}>- {tx.totalOutput}</p>
                          <p className="text-gray-400 text-sm">${calcValue(tx.totalOutput, coinPrice)} USD</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between border-t border-gray-700 mt-2">
                        <div>
                          {/* 交易时间，时间戳转换成 月、日  时分秒 */}
                          <span className="text-gray-400 text-sm">{new Date(tx.timestamp).toLocaleString()}</span>
                          {tx.status === 'pending' && <span className="text-orange-500 text-xs ml-5">{t('transactions.memPool')}</span>}
                        </div>
                        <div>
                          {/* 打开区块浏览器查看详情 */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-green-400 hover:text-green-300"
                            onClick={() => onOpenExplorer('1', 'tx', tx.id)}
                          >
                            {t('transactions.particulars')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {transactions.map((tx) => {
                const dapMessage = dapMessages.get(tx.id)
                const isExpanded = expandedTxId === tx.id

                return (
                  <div key={tx.id} className=" p-3 bg-gray-900 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors">
                    <div className="flex items-center justify-between ">
                      <div className="flex items-center gap-3">
                        {tx.status === 'pending' && (
                          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-orange-500">
                            <Clock className="h-4 w-4 text-white" />
                          </div>
                        )}
                        {tx.status === 'confirmed' && (
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              tx.type === 'receive' ? 'bg-green-500' : 'bg-red-500'
                            }`}
                          >
                            {tx.type === 'receive' ? (
                              <ArrowDown className="h-4 w-4 text-white" />
                            ) : (
                              <ArrowUp className="h-4 w-4 text-white" />
                            )}
                          </div>
                        )}
                        {tx.status === 'failed' && (
                          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-500">
                            <X className="h-4 w-4 text-white" />
                          </div>
                        )}

                        <div>
                          <p className="text-white font-medium">
                            {tx.type === 'receive' ? t('transactions.received') : t('transactions.sent')} {NAME_TOKEN}
                          </p>
                          <p className="text-gray-400 text-sm">
                            {tx.id.slice(0, 6)}····{tx.id.slice(-6)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${tx.type === 'receive' ? 'text-green-400' : 'text-red-400'}`}>
                          {tx.amount > 0 ? '+' + tx.amount : tx.amount}
                        </p>
                        <p className="text-gray-400 text-sm">${calcValue(tx.amount, coinPrice)} USD</p>
                      </div>
                    </div>

                    {/* DAP 消息显示 */}
                    {dapMessage && (
                      <div className="mt-3 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-purple-300 text-xs font-medium mb-1">
                              {dapMessage.isFromSelf
                                ? dapMessage.isPureMessage
                                  ? t('dap.myNote')
                                  : t('dap.transferNote')
                                : dapMessage.isPureMessage
                                  ? t('dap.receivedNote')
                                  : t('dap.senderNote')}
                            </p>
                            <p className="text-gray-300 text-sm break-words">
                              {isExpanded ? dapMessage.content : formatDapPreview(dapMessage.content, 100)}
                            </p>
                            {dapMessage.content.length > 100 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setExpandedTxId(isExpanded ? null : tx.id)
                                }}
                                className="text-purple-400 text-xs hover:text-purple-300 mt-2 flex items-center gap-1"
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="h-3 w-3" /> {t('dap.collapse')}
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="h-3 w-3" /> {t('dap.expand')}
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between border-t border-gray-700 mt-3">
                      <div>
                        {/* 交易时间，时间戳转换成 月、日  时分秒 */}
                        <span className="text-gray-400 text-sm">{new Date(tx.timestamp).toLocaleString()}</span>
                        {tx.status === 'pending' && (
                          <span className="text-orange-500 text-xs ml-5 whitespace-nowrap">
                            {t('transactions.confirmations')}: {confirmations} / {blockchainInfo.headers - tx.height}
                          </span>
                        )}
                      </div>
                      <div>
                        {/* 打开区块浏览器查看详情 */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-green-400 hover:text-green-300"
                          onClick={() => onOpenExplorer('2', 'tx', tx.id)}
                        >
                          {t('transactions.particulars')}
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
