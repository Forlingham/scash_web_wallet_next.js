'use client'

import { LanguageProvider, useLanguage } from '@/contexts/language-context'
import { useState } from 'react'
import { AlertTriangle, Shield, Lock, Eye, EyeOff } from 'lucide-react'

interface WalletLockScreenProps {
  onUnlock: (password: string) => boolean
}

export function WalletLockScreen({ onUnlock }: WalletLockScreenProps) {
  const { t } = useLanguage()
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [showResetDialog, setShowResetDialog] = useState(false)

  const handleUnlock = () => {
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

  const handleResetWallet = () => {
    localStorage.clear()
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-purple-500/30 blur-2xl rounded-full"></div>
            <img
              src="https://r2.scash.network/logo.png"
              alt="SCASH Logo"
              className="relative w-24 h-24 rounded-2xl mx-auto mb-6 shadow-2xl shadow-purple-500/20"
            />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{t('wallet.lock.title')}</h1>
          <p className="text-gray-400">{t('wallet.lock.passwordInfo')}</p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50 shadow-2xl">
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 ml-1">{t('wallet.passwordInput')}</label>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                <div className="relative flex items-center">
                  <Lock className="absolute left-4 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setError('')
                    }}
                    className="w-full py-4 pl-12 pr-12 bg-gray-900/80 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-all"
                    placeholder="••••••••"
                    onKeyPress={(e) => e.key === 'Enter' && handleUnlock()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 p-1 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={handleUnlock}
              disabled={!password}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-xl font-semibold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {t('wallet.lock.unlock')}
            </button>
          </div>
        </div>

        <div className="text-center space-y-4">
          <button
            onClick={() => setShowResetDialog(true)}
            className="text-gray-400 hover:text-red-400 text-sm transition-colors flex items-center justify-center gap-2 mx-auto"
          >
            <Shield className="w-4 h-4" />
            {t('settings.reset')}
          </button>
        </div>

        {showResetDialog && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-2xl p-6 max-w-sm w-full border border-gray-700 shadow-2xl">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-8 h-8 text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-white">{t('settings.resetConfirmTitle')}</h3>
                <p className="text-gray-400 text-sm">
                  {t('settings.resetConfirm')}
                  <br />
                  <span className="text-red-400 font-medium mt-2 block">{t('settings.resetConfirmInfo')}</span>
                </p>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowResetDialog(false)}
                  className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleResetWallet}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-medium transition-colors"
                >
                  {t('common.confirm')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
