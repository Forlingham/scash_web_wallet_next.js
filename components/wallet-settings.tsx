'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLanguage } from '@/contexts/language-context'
import { Lock, Key, Download, Globe, Shield, HelpCircle, LogOut, Eye, EyeOff, Copy, AlertTriangle, CheckCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

import { decryptWallet, downloadWalletFile, encryptWallet, passwordMD5, VERSION } from '@/lib/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { useWalletStore, useWalletActions, type WalletInfo } from '@/stores/wallet-store'

interface WalletSettingsProps {
  onNavigate: (view: string) => void
  onLockWallet: () => void
}

type SettingsView = 'main' | 'changePassword' | 'backup' | 'security' | 'help'

export function WalletSettings({ onNavigate, onLockWallet }: WalletSettingsProps) {
  const { t } = useLanguage()
  const { toast } = useToast()
  const [currentView, setCurrentView] = useState<SettingsView>('main')
  const [showPassword, setShowPassword] = useState(false)
  const [showMnemonic, setShowMnemonic] = useState(false)
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  })
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [verifyPassword, setVerifyPassword] = useState('')
  const wallet = useWalletStore((state) => state.wallet)
  const { setWallet } = useWalletActions()
  const [mockMnemonic, setMockMnemonic] = useState('')

  // Mock mnemonic for backup

  const handlePasswordChange = () => {
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      toast({
        title: t('common.error'),
        description: t('settings.missingInformation'),
        variant: 'destructive'
      })
      return
    }

    if (passwords.new !== passwords.confirm) {
      toast({
        title: t('common.error'),
        description: t('settings.passwordMismatch'),
        variant: 'destructive'
      })
      return
    }

    if (passwords.new.length < 8) {
      toast({
        title: t('common.error'),
        description: t('settings.passwordTooShort'),
        variant: 'destructive'
      })
      return
    }

    const walletObj = decryptWallet(wallet.encryptedWallet, passwords.current)
    if (!walletObj.isSuccess) {
      toast({
        title: t('common.error'),
        description: t('settings.passwordError'),
        variant: 'destructive'
      })
      return
    }
    const passwordHash = passwordMD5(passwords.new)
    walletObj.wallet!.passwordHash = passwordHash
    const walletEncrypt = encryptWallet(walletObj.wallet!, passwordHash)

    downloadWalletFile(walletEncrypt)

    const walletInfo: WalletInfo = {
      isHasWallet: true,
      address: wallet.address,
      balance: wallet.balance,
      lockBalance: wallet.lockBalance,
      memPoolLockBalance: wallet.memPoolLockBalance,
      usableBalance: wallet.usableBalance,
      encryptedWallet: walletEncrypt
    }

    // 保存到状态管理中 - 自动持久化到 localStorage
    setWallet(walletInfo)

    // Mock password change
    toast({
      title: t('common.success'),
      description: t('settings.passwordChanged')
    })

    setPasswords({ current: '', new: '', confirm: '' })
    setCurrentView('main')
  }

  const handClickReveal = () => {
    setShowPasswordDialog(true)
  }

  const handlePasswordVerify = async () => {
    if (!verifyPassword.trim()) {
      toast({
        title: t('common.error'),
        description: t('settings.inputPassword'),
        variant: 'destructive'
      })
      return
    }

    try {
      const walletObj = decryptWallet(wallet.encryptedWallet, verifyPassword)
      if (!walletObj.isSuccess) {
        toast({
          title: t('common.error'),
          description: t('settings.passwordError'),
          variant: 'destructive'
        })
        return
      }

      setShowMnemonic(true)
      setShowPasswordDialog(false)
      setVerifyPassword('')
      setMockMnemonic(walletObj.wallet!.mnemonic)
    } catch (error) {
      toast({
        title: 'error',
        description: 'An error occurred during the password verification process.',
        variant: 'destructive'
      })
    }
  }

  const copyMnemonic = () => {
    navigator.clipboard.writeText(mockMnemonic)
    toast({
      title: 'Copied to Clipboard',
      description: 'Recovery phrase has been copied to clipboard'
    })
  }

  const downloadBackup = () => {
    downloadWalletFile(wallet.encryptedWallet)

    toast({
      title: 'Backup Downloaded',
      description: 'Your wallet backup has been downloaded successfully'
    })
  }

  const onResetWallet = () => {
    localStorage.clear()
    window.location.reload()
  }

  if (currentView === 'changePassword') {
    return (
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        <div className="text-center mb-6">
          <Key className="h-12 w-12 text-purple-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white">{t('settings.changePassword')}</h2>
          <p className="text-gray-400 text-sm mt-2">{t('settings.changePasswordInfo2')}</p>
        </div>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4 space-y-4">
            <div>
              <Label className="text-gray-300 text-sm">{t('settings.currentPassword')}</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={passwords.current}
                  onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                  className="bg-gray-900 border-gray-600 text-white pr-10"
                  placeholder={t('settings.currentPassword')}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-gray-300 text-sm">{t('settings.newPassword')}</Label>
              <Input
                type={showPassword ? 'text' : 'password'}
                value={passwords.new}
                onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                className="bg-gray-900 border-gray-600 text-white"
                placeholder={t('wallet.passwordInput')}
              />
            </div>

            <div>
              <Label className="text-gray-300 text-sm">{t('settings.confirmNewPassword')}</Label>
              <Input
                type={showPassword ? 'text' : 'password'}
                value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                className="bg-gray-900 border-gray-600 text-white"
                placeholder={t('settings.confirmNewPassword')}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button
            onClick={() => setCurrentView('main')}
            variant="outline"
            className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handlePasswordChange}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
            disabled={!passwords.current || !passwords.new || !passwords.confirm}
          >
            {t('settings.changePassword')}
          </Button>
        </div>
      </div>
    )
  }

  if (currentView === 'backup') {
    return (
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        <div className="text-center mb-6">
          <Download className="h-12 w-12 text-purple-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white">{t('settings.backup')}</h2>
          <p className="text-gray-400 text-sm mt-2">Keep your recovery phrase and wallet file safe</p>
        </div>

        {/* Recovery Phrase */}
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <h3 className="text-white font-medium">{t('wallet.saveRecovery')}</h3>
            </div>

            <div className="relative">
              <div className={`grid grid-cols-3 gap-2 p-4 bg-gray-900 rounded-lg ${!showMnemonic ? 'blur-sm' : ''}`}>
                {mockMnemonic.split(' ').map((word, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-800 rounded text-sm">
                    <span className="text-gray-400 text-xs">{index + 1}.</span>
                    <span className="text-white">{word}</span>
                  </div>
                ))}
              </div>

              {!showMnemonic && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button
                    onClick={handClickReveal}
                    variant="outline"
                    className="border-purple-600 text-purple-400 hover:bg-purple-600 hover:text-white"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {t('wallet.clickReveal')}
                  </Button>
                </div>
              )}
            </div>

            {showMnemonic && (
              <Button
                onClick={copyMnemonic}
                variant="outline"
                className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent"
              >
                <Copy className="h-4 w-4 mr-2" />
                {t('common.copy')}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Download Backup */}
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5 text-green-500" />
              <h3 className="text-white font-medium">{t('settings.backupConfirmTitle')}</h3>
            </div>

            <p className="text-gray-400 text-sm">{t('settings.backupConfirmInfo')}</p>

            <Button onClick={downloadBackup} className="w-full bg-green-600 hover:bg-green-700 text-white">
              <Download className="h-4 w-4 mr-2" />
              {t('settings.backupConfirm')}
            </Button>
          </CardContent>
        </Card>

        <Button onClick={() => setCurrentView('main')} variant="outline" className="w-full border-gray-600 text-gray-300 hover:bg-gray-700">
          {t('common.back')}
        </Button>

        {/* Password Verification Dialog */}
        <AlertDialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
          <AlertDialogContent className="bg-gray-800 border-gray-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white flex items-center gap-2">
                <Lock className="h-5 w-5 text-purple-500" />
                {t('settings.verifyPassword')}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400">{t('settings.verifyPasswordInfo')}</AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="verify-password" className="text-gray-300">
                  {t('settings.password')}
                </Label>
                <Input
                  id="verify-password"
                  type="password"
                  value={verifyPassword}
                  onChange={(e) => setVerifyPassword(e.target.value)}
                  placeholder={t('settings.inputPassword')}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handlePasswordVerify()
                    }
                  }}
                />
              </div>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => {
                  setShowPasswordDialog(false)
                  setVerifyPassword('')
                }}
                className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
              >
                {t('common.cancel')}
              </AlertDialogCancel>
              <AlertDialogAction onClick={handlePasswordVerify} className="bg-purple-600 hover:bg-purple-700 text-white">
                {t('common.verify')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    )
  }

  if (currentView === 'security') {
    return (
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        <div className="text-center mb-6">
          <Shield className="h-12 w-12 text-purple-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white">Security Settings</h2>
          <p className="text-gray-400 text-sm mt-2">Manage your wallet security preferences</p>
        </div>

        {/* Security Status */}
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div>
                  <h3 className="text-white font-medium">Wallet Encrypted</h3>
                  <p className="text-gray-400 text-sm">Your wallet is protected with a password</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div>
                  <h3 className="text-white font-medium">Recovery Phrase Secured</h3>
                  <p className="text-gray-400 text-sm">Your 12-word recovery phrase is available for backup</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Actions */}
        <div className="space-y-3">
          <Button
            onClick={() => setCurrentView('changePassword')}
            className="w-full bg-gray-800 hover:bg-gray-700 text-white border border-gray-600 justify-start"
          >
            <Key className="h-4 w-4 mr-3" />
            Change Password
          </Button>

          <Button
            onClick={() => setCurrentView('backup')}
            className="w-full bg-gray-800 hover:bg-gray-700 text-white border border-gray-600 justify-start"
          >
            <Download className="h-4 w-4 mr-3" />
            Backup Wallet
          </Button>

          <Button onClick={onLockWallet} className="w-full bg-yellow-600 hover:bg-yellow-700 text-white justify-start">
            <Lock className="h-4 w-4 mr-3" />
            Lock Wallet Now
          </Button>
        </div>

        <Button onClick={() => setCurrentView('main')} variant="outline" className="w-full border-gray-600 text-gray-300 hover:bg-gray-700">
          {t('common.back')}
        </Button>
      </div>
    )
  }

  if (currentView === 'help') {
    return (
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        <div className="text-center mb-6">
          <HelpCircle className="h-12 w-12 text-purple-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white">Help & Support</h2>
          <p className="text-gray-400 text-sm mt-2">Get help with your SCASH wallet</p>
        </div>

        {/* Help Topics */}
        <div className="space-y-3">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div
                className="text-gray-400 text-sm prose prose-sm max-w-none prose-invert"
                dangerouslySetInnerHTML={{ __html: t('safety.instructions') }}
              />
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div
                className="text-gray-400 text-sm prose prose-sm max-w-none prose-invert"
                dangerouslySetInnerHTML={{ __html: t('Technical.Overview') }}
              />
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <h3 className="text-white font-medium mb-2">Troubleshooting</h3>
              <p className="text-gray-400 text-sm">
                Find solutions to common issues with transactions, wallet access, and technical problems.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Contact Support */}
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4 space-y-3">
            <h3 className="text-white font-medium">{t('common.contactSupport')}</h3>
            <p className="text-gray-400 text-sm">{t('common.contactSupportDesc')}</p>
            <div className="space-y-2">
              <Button 
                className="w-full bg-gray-700 hover:bg-gray-600 text-white"
                onClick={() => window.open('https://github.com/Forlingham/scash_web_wallet_next.js', '_blank')}
              >
                {t('common.contactSupportGitHub')}
              </Button>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => window.open('https://t.me/scash_webWallet', '_blank')}
              >
                {t('common.contactSupportTelegram')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* App Info */}
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4 text-center">
            <h3 className="text-white font-medium mb-2">{t('wallet.title')}</h3>
            <p className="text-gray-400 text-sm">Version {VERSION}</p>
            <p className="text-gray-500 text-xs mt-1">{t('common.walletInfo')}</p>
          </CardContent>
        </Card>

        <Button onClick={() => setCurrentView('main')} variant="outline" className="w-full border-gray-600 text-gray-300 hover:bg-gray-700">
          {t('common.back')}
        </Button>
      </div>
    )
  }

  // Main settings view
  const settingsItems = [
    {
      icon: Key,
      title: t('settings.changePassword'),
      description: t('settings.changePasswordInfo'),
      action: () => setCurrentView('changePassword')
    },
    {
      icon: Download,
      title: t('settings.backup'),
      description: t('settings.backupInfo'),
      action: () => setCurrentView('backup')
    },
    {
      icon: Shield,
      title: t('settings.lock'),
      description: t('settings.lockInfo'),
      action: () => setCurrentView('security')
    },
    {
      icon: HelpCircle,
      title: t('settings.help'),
      description: t('settings.helpInfo'),
      action: () => setCurrentView('help')
    }
  ]

  return (
    <div className="flex-1 p-4 space-y-4 overflow-y-auto">
      {/* Settings Items */}
      <div className="space-y-3">
        {settingsItems.map((item, index) => (
          <Card key={index} className="bg-gray-800 border-gray-700 hover:bg-gray-750 cursor-pointer transition-colors">
            <CardContent className="px-4">
              <div className="flex items-center gap-4" onClick={item.action}>
                <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                  <item.icon className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-medium">{item.title}</h3>
                  <p className="text-gray-400 text-sm">{item.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 pt-4">
        <Button onClick={onLockWallet} className="w-full bg-yellow-600 hover:bg-yellow-700 text-white">
          <Lock className="h-4 w-4 mr-2" />
          {t('settings.lock')}
        </Button>

        <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full">
              <LogOut className="h-4 w-4 mr-2" />
              {t('settings.reset')}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-gray-900 border-gray-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                {t('settings.resetConfirmTitle')}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-300">
                {t('settings.resetConfirm')}
                <br />
                <span className="text-red-400 font-medium mt-2 block">{t('settings.resetConfirmInfo')}</span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600">
                {t('common.cancel')}
              </AlertDialogCancel>
              <AlertDialogAction onClick={onResetWallet} className="bg-red-600 hover:bg-red-700 text-white">
                {t('common.confirm')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Wallet Info */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="px-4">
          <div className="text-center space-y-3">
            <h3 className="text-white font-medium">{t('common.supportAuthor')}</h3>
            <p className="text-gray-400 text-xs">{t('common.supportAuthorDesc')}</p>
            <div className="space-y-2 text-left">
              {[
                { label: 'BTC', address: 'bc1qnvdrxs23t6ejuxjs6mswx7cez2rn80wrwjd0u8' },
                { label: 'BNB', address: '0xD4dB57B007Ad386C2fC4d7DD146f5977c039Fefc' },
                { label: 'USDT (BEP-20)', address: '0xD4dB57B007Ad386C2fC4d7DD146f5977c039Fefc' },
                { label: 'SCASH', address: 'scash1qy48v7frkutlthqq7uqs8lk5fam24tghjdxqtf5' }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-gray-300 text-xs font-medium mb-1">{item.label}:</p>
                    <p className="text-gray-400 text-xs font-mono break-all">{item.address}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-700"
                    onClick={() => {
                      navigator.clipboard.writeText(item.address)
                      toast({
                        title: t('common.copySuccess'),
                        description: `${item.label} ${t('common.addressCopied')}`,
                        duration: 2000
                      })
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <p className="text-gray-500 text-xs">
              {t('wallet.title')} {VERSION}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
