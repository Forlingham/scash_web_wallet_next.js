'use client'

import { LanguageSelector } from '@/components/language-selector'
import { Button } from '@/components/ui/button'
import { WalletAssets } from '@/components/wallet-assets'
import { WalletEngrave } from '@/components/wallet-engrave'
import { WalletHome } from '@/components/wallet-home'
import { WalletReceive } from '@/components/wallet-receive'
import { WalletSend } from '@/components/wallet-send'
import { WalletSettings } from '@/components/wallet-settings'
import { useLanguage } from '@/contexts/language-context'
import { useWalletActions, useWalletState } from '@/stores/wallet-store'
import { ArrowLeft, Coins, ArrowUpRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface WalletDashboardProps {
  onLogout: () => void
}

export function WalletDashboard({ onLogout }: WalletDashboardProps) {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState('home')
  const [currentView, setCurrentView] = useState('home')
  const { pendingTransactions, unspent, coinPrice } = useWalletState()
  const { setUpdateBlockchaininfo, setUpdateBalance, setUpdateBalanceByMemPool, setUpdateCoinPrice } = useWalletActions()

  const initGetWalletInfo = async () => {
    await setUpdateBlockchaininfo()
    await setUpdateBalance()
    await setUpdateCoinPrice()
    if (pendingTransactions.length) {
      setUpdateBalanceByMemPool()
    }
  }

  const updateGetWalletInfo = async () => {
    await setUpdateBalance()
    if (pendingTransactions.length) {
      setUpdateBalanceByMemPool()
    }
  }

  const walletPollIntervalRef = useRef<number | null>(null)
  const chainPollIntervalRef = useRef<number | null>(null)
  const idleTimeoutRef = useRef<number | null>(null)
  const isIdleRef = useRef<boolean>(false)

  const startPolling = () => {
    let pollInterval = 1000 * 50
    if (process.env.NEXT_PUBLIC_BITCOIN_RPC_IS_TESTNET === 'true') {
      pollInterval = 1000 * 10
    }
    let chainPollInterval = 1000 * 60 * 3
    if (process.env.NEXT_PUBLIC_BITCOIN_RPC_IS_TESTNET === 'true') {
      chainPollInterval = 1000 * 30
    }

    if (walletPollIntervalRef.current == null) {
      walletPollIntervalRef.current = window.setInterval(() => {
        updateGetWalletInfo()
      }, pollInterval)
    }
    if (chainPollIntervalRef.current == null) {
      chainPollIntervalRef.current = window.setInterval(() => {
        setUpdateBlockchaininfo()
      }, chainPollInterval)
    }
  }

  const stopPolling = () => {
    if (process.env.NEXT_PUBLIC_BITCOIN_RPC_IS_TESTNET === 'true') {
      return
    }
    if (walletPollIntervalRef.current != null) {
      clearInterval(walletPollIntervalRef.current)
      walletPollIntervalRef.current = null
    }
    if (chainPollIntervalRef.current != null) {
      clearInterval(chainPollIntervalRef.current)
      chainPollIntervalRef.current = null
    }
  }

  const resetIdleTimer = () => {
    if (idleTimeoutRef.current != null) {
      clearTimeout(idleTimeoutRef.current)
    }
    idleTimeoutRef.current = window.setTimeout(
      () => {
        isIdleRef.current = true
        stopPolling()
      },
      1000 * 60 * 4
    )
  }

  const handleActivity = () => {
    if (isIdleRef.current) {
      updateGetWalletInfo()
      setUpdateBlockchaininfo()
      startPolling()
    }
    isIdleRef.current = false
    resetIdleTimer()
  }

  useEffect(() => {
    initGetWalletInfo()
    startPolling()
    resetIdleTimer()
    window.addEventListener('click', handleActivity, { passive: true })
    window.addEventListener('scroll', handleActivity, { passive: true })
    window.addEventListener('keydown', handleActivity)
    window.addEventListener('touchstart', handleActivity, { passive: true })
    return () => {
      stopPolling()
      if (idleTimeoutRef.current != null) {
        clearTimeout(idleTimeoutRef.current)
      }
      window.removeEventListener('click', handleActivity)
      window.removeEventListener('scroll', handleActivity)
      window.removeEventListener('keydown', handleActivity)
      window.removeEventListener('touchstart', handleActivity)
    }
  }, [])

  const handleNavigation = (view: string) => {
    setCurrentView(view)
    if (['home', 'assets', 'buy', 'sell', 'trade'].includes(view)) {
      setActiveTab(view)
    }
  }

  const handleLockWallet = () => {
    onLogout()
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'home':
        return <WalletHome onNavigate={handleNavigation} />
      case 'assets':
        return <WalletAssets onNavigate={handleNavigation} />
      case 'receive':
        return <WalletReceive onNavigate={handleNavigation} />
      case 'send':
        return <WalletSend onNavigate={handleNavigation} />
      case 'settings':
        return <WalletSettings onNavigate={handleNavigation} onLockWallet={handleLockWallet} />
      case 'engrave':
        return <WalletEngrave onNavigate={handleNavigation} />
      case 'buy':
      case 'sell':
      case 'trade':
        return (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">交易所</h2>
              <p className="text-gray-400 mb-6">选择一个交易所开始交易 SCASH/USDT</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl mx-auto mb-6">
                <a
                  href="https://www.ourbit.com/zh-CN/exchange/SCASH_USDT"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-xl border border-purple-500/30 bg-gray-800/40 p-4 shadow-sm hover:shadow-xl hover:border-purple-400/50 transition-all hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-md bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center">
                      <Coins className="h-5 w-5 text-purple-200" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-white font-semibold">ourbit</div>
                      <div className="text-xs text-gray-400">SCASH/USDT</div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-purple-300 group-hover:text-purple-200" />
                  </div>
                </a>
              </div>
              <Button
                onClick={() => handleNavigation('home')}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Back to Home
              </Button>
            </div>
          </div>
        )
      default:
        return <WalletHome onNavigate={handleNavigation} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {currentView !== 'home' && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-md border-b border-purple-500/30 shadow-lg overflow-visible">
          <div className="flex justify-between items-center p-4 container mx-auto overflow-visible">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-300 hover:text-white hover:bg-purple-500/20 transition-all duration-200"
                onClick={() => handleNavigation('home')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {currentView === 'receive' && t('receive.title')}
                  {currentView === 'send' && t('action.send')}
                  {currentView === 'engrave' && t('send.engrave')}
                  {currentView === 'assets' && t('nav.assets')}
                  {currentView === 'settings' && t('settings.title')}
                  {['buy', 'sell', 'trade'].includes(currentView) &&
                    (currentView === 'buy' ? '购买' : currentView === 'sell' ? '出售' : '交易')}
                </h1>
                <div className="text-xs text-gray-400">{t('common.walletFunction')}</div>
              </div>
            </div>
            <div className="relative flex items-center gap-2">
              <LanguageSelector />
            </div>
          </div>
        </div>
      )}

      <div className={currentView !== 'home' ? 'pt-20' : ''}>{renderCurrentView()}</div>
    </div>
  )
}
