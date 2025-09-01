'use client'

import { useState, useEffect } from 'react'
import { WalletSetup } from '@/components/wallet-setup'
import { WalletDashboard } from '@/components/wallet-dashboard'
import { LanguageProvider, useLanguage } from '@/contexts/language-context'
import { useWalletActions, useWalletStore } from '@/stores/wallet-store'

export function WalletLockScreen({ onUnlock }: { onUnlock: (password: string) => boolean }) {
  const { t } = useLanguage()
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const handleUnlock = () => {
    // Mock password verification
    if (password.length >= 8) {
      const isUnlocked = onUnlock(password)
      if (isUnlocked) {
        setError('')
      } else {
        setError(t('wallet.lock.error'))
      }
    } else {
      setError(t('wallet.lock.error'))
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo.jpg-KmKWTogu9C4GGzSeODyNdvCFtQgBWj.jpeg"
            alt="SCASH Logo"
            className="w-16 h-16 rounded-full mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-white">{t('wallet.lock.title')}</h1>
          <p className="text-gray-400 mt-2">{t('wallet.lock.passwordInfo')}</p>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError('')
              }}
              className="w-full p-4 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
              placeholder="Enter wallet password"
              onKeyPress={(e) => e.key === 'Enter' && handleUnlock()}
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button
            onClick={handleUnlock}
            disabled={!password}
            className="w-full p-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:text-gray-400 text-white rounded-lg font-medium transition-colors"
          >
            {t('wallet.lock.unlock')}
          </button>
        </div>
      </div>
    </div>
  )
}

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
