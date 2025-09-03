'use client'

import { LanguageSelector } from '@/components/language-selector'
import { Button } from '@/components/ui/button'
import { WalletAssets } from '@/components/wallet-assets'
import { WalletHome } from '@/components/wallet-home'
import { WalletReceive } from '@/components/wallet-receive'
import { WalletSend } from '@/components/wallet-send'
import { WalletSettings } from '@/components/wallet-settings'
import { useLanguage } from '@/contexts/language-context'
import { useWalletActions, useWalletState } from '@/stores/wallet-store'
import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'

interface WalletDashboardProps {
  onLogout: () => void
}

export function WalletDashboard({ onLogout }: WalletDashboardProps) {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState('home')
  const [currentView, setCurrentView] = useState('home')
  const { pendingTransactions,unspent } = useWalletState()
  const { setUpdateBlockchaininfo, setUpdateBalance, setUpdateBalanceByMemPool } = useWalletActions()

  const initGetWalletInfo = async () => {
    await setUpdateBlockchaininfo()
    await setUpdateBalance()
    if (pendingTransactions.length) {
      setUpdateBalanceByMemPool()
    }    
  }

  useEffect(() => {
    initGetWalletInfo()
    const interval = setInterval(() => {
      initGetWalletInfo()
    }, 1000 * 22)
    return () => clearInterval(interval)
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
      case 'buy':
      case 'sell':
      case 'trade':
        return (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-white mb-2">
                {currentView.charAt(0).toUpperCase() + currentView.slice(1)} Feature
              </h2>
              <p className="text-gray-400 mb-4">This feature will be implemented soon.</p>
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
