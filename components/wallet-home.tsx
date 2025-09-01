'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useLanguage } from '@/contexts/language-context'
import { ArrowDown, ArrowUp, ArrowUpDown, Menu, Bell, Settings, Clock, X, Database } from 'lucide-react'
import { calcValue, NAME_TOKEN, onOpenExplorer } from '@/lib/utils'
import { PendingTransaction, Transaction, useWalletActions, useWalletState } from '@/stores/wallet-store'
import { AddressTxsExt, getAddressTxsExtApi } from '@/lib/externalApi'
import Decimal from 'decimal.js'
import { getRawTransactionApi } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

interface WalletHomeProps {
  onNavigate: (view: string) => void
}

export function WalletHome({ onNavigate }: WalletHomeProps) {
  const { wallet, coinPrice, unspent, transactions, pendingTransactions, blockchainInfo, confirmations, isLocked } = useWalletState()
  const { addTransaction, addPendingTransaction, lockWallet } = useWalletActions()
  const { t } = useLanguage()
  const { toast } = useToast()
  const [selectedPeriod, setSelectedPeriod] = useState('30D')
  const [getAddressTxsLoading, setGetAddressTxsLoading] = useState<boolean>(false)

  async function getTxs() {
    if (!wallet.address) return
    if (getAddressTxsLoading) return
    try {
      setGetAddressTxsLoading(true)
      const res = await getAddressTxsExtApi(wallet.address)
      if (!res.data.data) return

      for (const tx of res.data.data.reverse()) {
        let txInfo: Transaction
        const unspentTx = unspent.find((item) => item.txid === tx[1])
        const type = tx[3] ? 'send' : 'receive'
        let amount = 0
        if (type === 'send') {
          amount = new Decimal(tx[3]).minus(tx[2]).toNumber()
          amount = amount * -1
        } else {
          amount = tx[2] as number
        }
        if (unspentTx) {
          txInfo = {
            id: tx[1] as string,
            type: type,
            amount: amount,
            address: '',
            timestamp: tx[0] as number,
            status: unspentTx.isUsable ? 'confirmed' : 'pending',
            height: unspentTx.height
          }
        } else {
          txInfo = {
            id: tx[1] as string,
            type: type,
            amount: amount,
            address: '',
            timestamp: tx[0] as number,
            status: 'confirmed',
            height: 0
          }
        }
        addTransaction(txInfo)
      }
    } catch (error) {
      console.log(error, 'error')
    } finally {
      setGetAddressTxsLoading(false)
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
    getTxs()
    getPendingTxs()
    onLoginExpired()
  }, [wallet.balance, unspent])

  return (
    <>
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-md border-b border-purple-500/30 shadow-lg">
        <div className="flex justify-between items-center p-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src="/logo.jpg" alt="SCASH Logo" className="w-10 h-10 rounded-full border-2 border-purple-400/50 shadow-lg" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-900 animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {t('wallet.title')}
              </h1>
              <div className="text-xs text-gray-400">{t('wallet.subtitle')}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg px-3 py-1.5">
              <div className="text-purple-300 text-xs font-medium">{t('wallet.blockHeight')}</div>
              <div className="text-white text-sm font-semibold">{blockchainInfo.headers.toLocaleString()}</div>
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

      {/* Main Content with top padding for fixed header */}
      <div className="pt-20 flex-1 p-4 space-y-4 overflow-y-auto mt-10">
        <Card className="relative bg-gradient-to-br from-purple-900/20 via-gray-800 to-purple-800/30 border-purple-500/30 backdrop-blur-sm overflow-hidden">
          {/* 硬币logo背景 */}
          <div className="absolute top-0 right-0 w-20 h-20 opacity-10">
            <img src="/logo.png" alt="Coin Logo" className="w-full h-full object-contain filter brightness-150" />
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
                    <span className="absolute bottom-0  text-sm text-gray-400 font-normal">{NAME_TOKEN}</span>
                  </span>
                </div>
                <div className="text-xl text-gray-300 font-medium">${calcValue(wallet.balance, coinPrice)} USD</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center gap-4 sm:gap-8">
          <div className="text-center">
            <Button
              size="lg"
              className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gray-800 hover:bg-gray-700 border border-gray-600 touch-manipulation"
              onClick={() => {
                onNavigate('receive')
              }}
            >
              <ArrowDown className="h-6 w-6 text-white" />
            </Button>
            <p className="text-xs sm:text-sm text-gray-300 mt-2">{t('action.receive')}</p>
          </div>

          <div className="text-center">
            <Button
              size="lg"
              className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gray-800 hover:bg-gray-700 border border-gray-600 touch-manipulation"
              onClick={() => {
                onNavigate('send')
              }}
            >
              <ArrowUp className="h-6 w-6 text-white" />
            </Button>
            <p className="text-xs sm:text-sm text-gray-300 mt-2">{t('action.send')}</p>
          </div>

          <div className="text-center">
            <Button
              size="lg"
              className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gray-800 hover:bg-gray-700 border border-gray-600 touch-manipulation"
              onClick={() => {
                onNavigate('trade')
              }}
            >
              <ArrowUpDown className="h-6 w-6 text-white" />
            </Button>
            <p className="text-xs sm:text-sm text-gray-300 mt-2">{t('action.trade')}</p>
          </div>
        </div>

        {/* <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-medium">Ravencoin</h3>
              <Button variant="ghost" size="sm" className="text-green-400 hover:text-green-300">
                {t('transactions.seeAll')}
              </Button>
            </div>

            <div className="mb-4">
              <p className="text-gray-400 text-sm">0.01 USD/RVN</p>
            </div>

   
            <div className="flex gap-2 mb-4">
              {['1H', '24H', '7D', '30D', '1Y'].map((period) => (
                <Button
                  key={period}
                  variant={period === selectedPeriod ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedPeriod(period)}
                  className={period === selectedPeriod ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}
                >
                  {period}
                </Button>
              ))}
            </div>

     
            <div className="h-32 bg-gray-900 rounded-lg flex items-end justify-between p-4 relative overflow-hidden">
              <div className="text-green-400 text-sm absolute top-4 left-4">$0.0163</div>
              <div className="text-green-400 text-sm absolute bottom-4 right-4">$0.0130</div>

           
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 120">
                <path d="M20,80 Q50,60 80,70 T140,50 T200,65 T260,45 T300,55" stroke="#10b981" strokeWidth="2" fill="none" />
                <path d="M20,80 Q50,60 80,70 T140,50 T200,65 T260,45 T300,55 L300,120 L20,120 Z" fill="url(#gradient)" opacity="0.3" />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </CardContent>
        </Card> */}

        {/* Recent Transactions */}
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="px-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <h3 className="text-white font-medium">{t('transactions.recent')}</h3>
                {/* getAddressTxsLoading */}
                {getAddressTxsLoading && (
                  <div className="ml-4">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  </div>
                )}
              </div>

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

              {transactions.map((tx) => (
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

                  <div className="flex items-center justify-between border-t border-gray-700 mt-2">
                    <div>
                      {/* 交易时间，时间戳转换成 月、日  时分秒 */}
                      <span className="text-gray-400 text-sm">{new Date(tx.timestamp * 1000).toLocaleString()}</span>
                      {tx.status === 'pending' && (
                        <span className="text-orange-500 text-xs ml-5">
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
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
