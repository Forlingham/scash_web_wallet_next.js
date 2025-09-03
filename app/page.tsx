'use client'

import { useState, useEffect } from 'react'
import { WalletSetup } from '@/components/wallet-setup'
import { WalletDashboard } from '@/components/wallet-dashboard'
import { LanguageProvider, useLanguage } from '@/contexts/language-context'
import { useWalletActions, useWalletStore } from '@/stores/wallet-store'
import { WalletLockScreen } from '@/components/WalletLockScreen'

export default function Home() {
  const { wallet, isLocked } = useWalletStore()
  const { setWallet, setLoading, setError, lockWallet, unlockWallet } = useWalletActions()
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    if (wallet.address) {
      setIsLoading(false)
    }
    if (!wallet.address) {
      setIsLoading(false)
    }
  }, [wallet])

  const handleWalletCreated = () => {
    console.log('create')
  }

  const handleLogout = () => {
    lockWallet()
  }

  const handleUnlock = (password: string) => {
    return unlockWallet(password)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  return (
    <LanguageProvider>
      <div className="min-h-screen bg-gray-900">
        {!wallet.address ? (
          <WalletSetup onWalletCreated={handleWalletCreated} />
        ) : isLocked ? (
          <WalletLockScreen onUnlock={handleUnlock} />
        ) : (
          <WalletDashboard onLogout={handleLogout} />
        )}
      </div>
    </LanguageProvider>
  )
}
