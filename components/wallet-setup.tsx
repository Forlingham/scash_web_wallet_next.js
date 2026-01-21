'use client'

import type React from 'react'

import { LanguageSelector } from '@/components/language-selector'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useLanguage } from '@/contexts/language-context'
import { useToast } from '@/hooks/use-toast'
import {
  ADDRESS_PATH,
  decryptWallet,
  downloadWalletFile,
  encryptWallet,
  getWalletPrivateKey,
  passwordMD5,
  SCASH_NETWORK
} from '@/lib/utils'
import { useWalletActions, useWalletStore, type WalletInfo } from '@/stores/wallet-store'
import * as bip39 from 'bip39'
import * as bitcoin from 'bitcoinjs-lib'
import {
  AlertTriangle,
  Check,
  CheckCircle,
  Copy,
  Download,
  Eye,
  EyeOff,
  FileKey,
  FileText,
  Key,
  Shield,
  Upload,
  Wallet
} from 'lucide-react'
import { useState } from 'react'

interface WalletSetupProps {
  onWalletCreated: () => void
}

type SetupStep =
  | 'welcome'
  | 'create-mnemonic'
  | 'verify-mnemonic'
  | 'set-password'
  | 'download-wallet'
  | 'restore-method'
  | 'restore-mnemonic'
  | 'restore-file'
  | 'restore-password'

export function WalletSetup({ onWalletCreated }: WalletSetupProps) {
  const { t } = useLanguage()
  const { toast } = useToast()

  const { setWallet, setLoading, setError } = useWalletActions()
  const wallet = useWalletStore((state) => state.wallet)
  const isLoading = useWalletStore((state) => state.isLoading)
  const error = useWalletStore((state) => state.error)

  const [step, setStep] = useState<SetupStep>('welcome')
  const [showMnemonic, setShowMnemonic] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [generatedMnemonic, setGeneratedMnemonic] = useState('')
  const [verificationWords, setVerificationWords] = useState<{ word: string; index: number }[]>([])
  const [userVerification, setUserVerification] = useState<string[]>([])
  const [walletFile, setWalletFile] = useState<File | null>(null)
  const [walletInfo, setWalletInfo] = useState<WalletInfo>()
  const [uploadedWalletEncrypted, setUploadedWalletEncrypted] = useState<string>()

  const handleCreateWallet = () => {
    setShowMnemonic(false)
    const newMnemonic = bip39.generateMnemonic()
    setGeneratedMnemonic(newMnemonic)
    setStep('create-mnemonic')
  }

  const handleVerifyMnemonic = () => {
    const words = generatedMnemonic.split(' ')
    const randomIndices = [] as number[]
    while (randomIndices.length < 3) {
      const randomIndex = Math.floor(Math.random() * words.length)
      if (!randomIndices.includes(randomIndex)) {
        randomIndices.push(randomIndex)
      }
    }

    const verification = randomIndices.map((index) => ({
      word: words[index],
      index: index + 1
    }))

    setVerificationWords(verification)
    setUserVerification(new Array(3).fill(''))
    setStep('verify-mnemonic')
  }

  const handleVerificationSubmit = () => {
    const isCorrect = verificationWords.every((item, index) => userVerification[index]?.toLowerCase().trim() === item.word.toLowerCase())

    if (isCorrect) {
      setStep('set-password')
    } else {
      toast({
        title: t('wallet.verificationFailed'),
        description: t('wallet.verificationFailedInfo'),
        variant: 'destructive'
      })
    }
  }

  const handlePasswordSubmit = () => {
    if (password.length < 8) {
      toast({
        title: t('wallet.passwordTooShort'),
        description: t('wallet.passwordMinLength'),
        variant: 'destructive'
      })
      return
    }

    if (password !== confirmPassword) {
      toast({
        title: t('wallet.passwordsDontMatch'),
        description: t('wallet.passwordsDontMatchInfo'),
        variant: 'destructive'
      })
      return
    }

    const passwordHash = passwordMD5(password)

    const child = getWalletPrivateKey(generatedMnemonic)
    const path = ADDRESS_PATH
    const { address } = bitcoin.payments.p2wpkh({
      pubkey: Buffer.from(child.publicKey),
      network: SCASH_NETWORK
    })

    if (!address) {
      toast({
        title: t('wallet.addressGenerationFailed'),
        description: t('wallet.addressGenerationFailedInfo'),
        variant: 'destructive'
      })
      return
    }

    const walletForFile: WalletFile = {
      mnemonic: generatedMnemonic,
      path,
      address,
      privateKey: child.toWIF(),
      passwordHash
    }

    const encryptedWallet = encryptWallet(walletForFile, passwordHash)

    const walletInfoData: WalletInfo = {
      isHasWallet: true,
      address: address!,
      balance: 0,
      lockBalance: 0,
      memPoolLockBalance: 0,
      usableBalance: 0,
      encryptedWallet: encryptedWallet
    }

    setWalletInfo(walletInfoData)

    setStep('download-wallet')
  }

  const handleDownloadWallet = () => {
    if (!walletInfo || !walletInfo.encryptedWallet) {
      toast({
        title: 'Error',
        description: 'Wallet not encrypted',
        variant: 'destructive'
      })
      return
    }

    downloadWalletFile(walletInfo.encryptedWallet)

    setWallet(walletInfo)

    toast({
      title: t('wallet.walletCreatedSuccessfully'),
      description: t('wallet.walletDownloadedSuccessfully')
    })

    onWalletCreated()
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setWalletFile(file)
    }
  }

  const handleRestoreFromFile = () => {
    if (!walletFile) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const walletData = JSON.parse(e.target?.result as string) as WalletFileData
        if (walletData && walletData.data && walletData.encrypted && walletData.timestamp) {
          setUploadedWalletEncrypted(walletData.data)

          setStep('restore-password')
        } else {
          toast({
            title: t('wallet.invalidWalletFile'),
            description: t('wallet.invalidWalletFileInfo'),
            variant: 'destructive'
          })
        }
      } catch (error) {
        toast({
          title: t('wallet.invalidWalletFile'),
          description: t('wallet.invalidWalletFileInfo'),
          variant: 'destructive'
        })
      }
    }
    reader.readAsText(walletFile)
  }

  const onRestorePassword = () => {
    if (!password) {
      toast({
        title: t('wallet.enterPassword'),
        variant: 'destructive'
      })
      return
    }

    if (!uploadedWalletEncrypted) {
      toast({
        title: t('wallet.invalidWalletFile'),
        description: t('wallet.invalidWalletFileInfo'),
        variant: 'destructive'
      })
      return
    }

    try {
      const decryptedWallet = decryptWallet(uploadedWalletEncrypted, password)

      if (!decryptedWallet.isSuccess) {
        toast({
          title: 'Invalid Password',
          description: 'The password you entered is incorrect.',
          variant: 'destructive'
        })
        return
      }

      const walletInfoData: WalletInfo = {
        isHasWallet: true,
        address: decryptedWallet.wallet!.address,
        balance: 0,
        lockBalance: 0,
        memPoolLockBalance: 0,
        usableBalance: 0,
        encryptedWallet: uploadedWalletEncrypted
      }

      setWalletInfo(walletInfoData)
      setWallet(walletInfoData)
      onWalletCreated()
    } catch (error) {
      toast({
        title: 'Invalid Password',
        description: 'The password you entered is incorrect.',
        variant: 'destructive'
      })
      return
    }
  }

  const handleRestoreFromMnemonic = () => {
    const cleanedMnemonic = generatedMnemonic
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase()

    const words = cleanedMnemonic.split(' ').filter((word) => word.length > 0)

    if (words.length !== 12) {
      toast({
        title: t('wallet.invalidMnemonic'),
        description: t('wallet.invalidMnemonicInfo'),
        variant: 'destructive'
      })
      return
    }

    setGeneratedMnemonic(words.join(' '))
    setStep('set-password')
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copied to Clipboard',
      description: 'Mnemonic phrase has been copied to clipboard.'
    })
  }

  const renderStepIndicator = () => {
    const steps = ['create-mnemonic', 'verify-mnemonic', 'set-password', 'download-wallet']
    const currentIndex = steps.indexOf(step)
    const isRestore = ['restore-method', 'restore-mnemonic', 'restore-file', 'restore-password'].includes(step)

    if (isRestore || step === 'welcome' || step === 'restore-method') return null

    return (
      <div className="flex items-center justify-center gap-1.5 mb-6">
        {steps.map((s, i) => {
          const isCompleted = i < currentIndex
          const isCurrent = i === currentIndex

          return (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  isCompleted
                    ? 'bg-green-500/20'
                    : isCurrent
                    ? 'bg-purple-500/20'
                    : 'bg-gray-700/50'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : isCurrent ? (
                  <div className="w-3 h-3 rounded-full bg-purple-500 animate-pulse" />
                ) : (
                  <div className="w-3 h-3 rounded-full bg-gray-500" />
                )}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`w-12 h-0.5 mx-1 transition-all ${
                    isCompleted ? 'bg-green-500/50' : 'bg-gray-600'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const renderWelcomeStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-purple-500/30 blur-2xl rounded-full"></div>
          <Wallet className="relative w-20 h-20 text-white mx-auto" />
        </div>
        <h2 className="text-2xl font-bold text-white">{t('wallet.title')}</h2>
        <p className="text-gray-400">{t('wallet.createNewInfo')}</p>
      </div>

      <div className="space-y-3">
        <Button
          onClick={handleCreateWallet}
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <Wallet className="w-5 h-5 mr-2" />
          {t('wallet.createNew')}
        </Button>

        <Button
          onClick={() => setStep('restore-method')}
          variant="outline"
          className="w-full py-4 border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500 rounded-xl font-medium transition-all"
        >
          <Shield className="w-5 h-5 mr-2" />
          {t('wallet.restoreExisting')}
        </Button>
      </div>
    </div>
  )

  const renderCreateMnemonicStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8 text-yellow-400" />
        </div>
        <h3 className="text-xl font-bold text-white">{t('wallet.saveRecovery')}</h3>
        <p className="text-gray-400 text-sm">{t('wallet.writeDown')}</p>
      </div>

      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
        <div className="relative">
          <div className={`grid grid-cols-3 gap-3 p-4 bg-gray-900/80 backdrop-blur rounded-xl border border-gray-700/50 overflow-x-auto ${!showMnemonic ? 'blur-sm' : ''}`}>
            {generatedMnemonic.split(' ').map((word, index) => (
              <div key={index} className="relative flex items-center justify-center py-2 mt-3 bg-gray-800/80 rounded-lg border border-gray-700/50 min-w-0">
                <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-900 text-gray-500 text-xs font-mono px-2 py-0 rounded-full border border-gray-700/50 shadow-sm">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="text-white font-medium text-sm whitespace-nowrap">{word}</span>
              </div>
            ))}
          </div>

          {!showMnemonic && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Button
                onClick={() => setShowMnemonic(true)}
                variant="outline"
                className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/20 hover:border-yellow-400 bg-gray-900/90 px-6 py-3 rounded-xl"
              >
                <Eye className="w-5 h-5 mr-2" />
                {t('wallet.clickReveal')}
              </Button>
            </div>
          )}
        </div>
      </div>

      {showMnemonic && (
        <div className="flex gap-3">
          <Button
            onClick={() => copyToClipboard(generatedMnemonic)}
            variant="outline"
            size="lg"
            className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500 rounded-xl"
          >
            <Copy className="w-5 h-5 mr-2" />
            {t('common.copy')}
          </Button>
          <Button
            onClick={handleVerifyMnemonic}
            size="lg"
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/25"
          >
            {t('wallet.savedIt')}
          </Button>
        </div>
      )}

      <Button
        onClick={() => setStep('welcome')}
        variant="ghost"
        className="w-full text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-xl"
      >
        {t('common.back')}
      </Button>
    </div>
  )

  const renderVerifyMnemonicStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8 text-blue-400" />
        </div>
        <h3 className="text-xl font-bold text-white">{t('wallet.verifyPhrase')}</h3>
        <p className="text-gray-400 text-sm">{t('wallet.enterWords')}</p>
      </div>

      <div className="space-y-4">
        {verificationWords.map((item, index) => (
          <div key={index} className="space-y-2">
            <Label className="text-gray-400 text-sm ml-1">
              Word #{item.index}
            </Label>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <Input
                value={userVerification[index] || ''}
                onChange={(e) => {
                  const newVerification = [...userVerification]
                  newVerification[index] = e.target.value
                  setUserVerification(newVerification)
                }}
                className="relative bg-gray-900/80 border-gray-600 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-lg py-3 pl-4 pr-4"
                placeholder="Enter word"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <Button
          onClick={() => setStep('create-mnemonic')}
          variant="outline"
          size="lg"
          className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500 rounded-xl"
        >
          {t('common.back')}
        </Button>
        <Button
          onClick={handleVerificationSubmit}
          size="lg"
          className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/25"
          disabled={userVerification.some((word) => !word.trim())}
        >
          {t('common.verify')}
        </Button>
      </div>
    </div>
  )

  const renderSetPasswordStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto">
          <Key className="w-8 h-8 text-purple-400" />
        </div>
        <h3 className="text-xl font-bold text-white">{t('wallet.setPassword')}</h3>
        <p className="text-gray-400 text-sm">{t('wallet.passwordInfo')}</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-gray-400 text-sm ml-1">{t('wallet.password')}</Label>
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative flex items-center">
              <Key className="absolute left-4 w-5 h-5 text-gray-400" />
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="relative bg-gray-900/80 border-gray-600 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 rounded-lg py-3 pl-12 pr-12"
                placeholder="••••••••"
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

        <div className="space-y-2">
          <Label className="text-gray-400 text-sm ml-1">{t('wallet.confirmPassword')}</Label>
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative flex items-center">
              <Key className="absolute left-4 w-5 h-5 text-gray-400" />
              <Input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="relative bg-gray-900/80 border-gray-600 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 rounded-lg py-3 pl-12 pr-4"
                placeholder="••••••••"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={() => setStep(generatedMnemonic ? 'verify-mnemonic' : 'restore-mnemonic')}
          variant="outline"
          size="lg"
          className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500 rounded-xl"
        >
          {t('common.back')}
        </Button>
        <Button
          onClick={handlePasswordSubmit}
          size="lg"
          className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/25"
          disabled={!password || !confirmPassword}
        >
          {t('common.next')}
        </Button>
      </div>
    </div>
  )

  const renderDownloadWalletStep = () => (
    <div className="space-y-6 text-center">
      <div className="space-y-4">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-10 h-10 text-green-400" />
        </div>
        <h3 className="text-xl font-bold text-white">{t('wallet.downloadWallet')}</h3>
        <p className="text-gray-400 text-sm">{t('wallet.downloadInfo')}</p>
      </div>

      <div className="p-4 bg-gray-900/80 rounded-xl border border-gray-700/50">
        <div className="flex items-center justify-center gap-3 text-sm text-gray-400">
          <FileKey className="w-5 h-5" />
          <span>{t('wallet.walletFileReady')}</span>
        </div>
      </div>

      <Button
        onClick={handleDownloadWallet}
        size="lg"
        className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl font-semibold shadow-lg shadow-green-500/25 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
      >
        <Download className="w-5 h-5 mr-2" />
        {t('wallet.downloadButton')}
      </Button>

      <p className="text-xs text-gray-500">{t('wallet.needFile')}</p>
    </div>
  )

  const renderRestoreMethodStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto">
          <Shield className="w-8 h-8 text-blue-400" />
        </div>
        <h3 className="text-xl font-bold text-white">{t('wallet.restoreMethod')}</h3>
        <p className="text-gray-400 text-sm">{t('wallet.chooseMethod')}</p>
      </div>

      <div className="space-y-3">
        <Button
          onClick={() => {
            setStep('restore-mnemonic')
            setGeneratedMnemonic('')
          }}
          size="lg"
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/25 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <FileText className="w-5 h-5 mr-2" />
          {t('wallet.useRecovery')}
        </Button>

        <Button
          onClick={() => setStep('restore-file')}
          variant="outline"
          size="lg"
          className="w-full py-4 border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500 rounded-xl transition-all"
        >
          <Upload className="w-5 h-5 mr-2" />
          {t('wallet.uploadWalletFile')}
        </Button>
      </div>

      <Button
        onClick={() => setStep('welcome')}
        variant="ghost"
        className="w-full text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-xl"
      >
        {t('common.back')}
      </Button>
    </div>
  )

  const renderRestoreMnemonicStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto">
          <FileText className="w-8 h-8 text-purple-400" />
        </div>
        <h3 className="text-xl font-bold text-white">{t('wallet.enterRecovery')}</h3>
        <p className="text-gray-400 text-sm">{t('wallet.enter12Words')}</p>
      </div>

      <div className="space-y-2">
        <Label className="text-gray-400 text-sm ml-1">{t('wallet.recoveryPhrase')}</Label>
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <Textarea
            value={generatedMnemonic}
            onChange={(e) => setGeneratedMnemonic(e.target.value)}
            className="relative bg-gray-900/80 border-gray-600 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 rounded-xl min-h-[120px] p-4 resize-none"
            placeholder="word1 word2 word3 ... word12"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={() => {
            setStep('restore-method')
            setGeneratedMnemonic('')
          }}
          variant="outline"
          size="lg"
          className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500 rounded-xl"
        >
          {t('common.back')}
        </Button>
        <Button
          onClick={handleRestoreFromMnemonic}
          size="lg"
          className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/25"
          disabled={!generatedMnemonic.trim()}
        >
          {t('common.next')}
        </Button>
      </div>
    </div>
  )

  const renderRestoreFileStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
          <FileKey className="w-8 h-8 text-green-400" />
        </div>
        <h3 className="text-xl font-bold text-white">{t('wallet.uploadWalletFile')}</h3>
        <p className="text-gray-400 text-sm">{t('wallet.selectFile')}</p>
      </div>

      <div className="space-y-2">
        <Label className="text-gray-400 text-sm ml-1">{t('wallet.walletFile')}</Label>
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative">
            <Input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="relative bg-gray-900/80 border-gray-600 text-white file:bg-green-600 file:text-white file:border-0 file:rounded-lg file:px-4 file:py-2 file:mr-3 cursor-pointer rounded-xl p-1"
            />
          </div>
        </div>
      </div>

      {walletFile && (
        <div className="flex items-center gap-3 p-4 bg-gray-900/80 rounded-xl border border-green-500/30">
          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
          <span className="text-white font-medium">{walletFile.name}</span>
          <span className="text-gray-400 text-sm ml-auto">{(walletFile.size / 1024).toFixed(1)} KB</span>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          onClick={() => setStep('restore-method')}
          variant="outline"
          size="lg"
          className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500 rounded-xl"
        >
          {t('common.back')}
        </Button>
        <Button
          onClick={handleRestoreFromFile}
          size="lg"
          className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl font-semibold shadow-lg shadow-green-500/25"
          disabled={!walletFile}
        >
          {t('wallet.restoreWallet')}
        </Button>
      </div>
    </div>
  )

  const renderRestorePasswordStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto">
          <Key className="w-8 h-8 text-purple-400" />
        </div>
        <h3 className="text-xl font-bold text-white">{t('wallet.enterPassword')}</h3>
        <p className="text-gray-400 text-sm">{t('wallet.passwordUsed')}</p>
      </div>

      <div className="space-y-2">
        <Label className="text-gray-400 text-sm ml-1">{t('wallet.password')}</Label>
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative flex items-center">
            <Key className="absolute left-4 w-5 h-5 text-gray-400" />
            <Input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="relative bg-gray-900/80 border-gray-600 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 rounded-lg py-3 pl-12 pr-12"
              placeholder="••••••••"
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

      <div className="flex gap-3">
        <Button
          onClick={() => setStep('restore-file')}
          variant="outline"
          size="lg"
          className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500 rounded-xl"
        >
          {t('common.back')}
        </Button>
        <Button
          onClick={onRestorePassword}
          size="lg"
          className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/25"
          disabled={!password}
        >
          {t('wallet.unlockWallet')}
        </Button>
      </div>
    </div>
  )

  const renderCurrentStep = () => {
    switch (step) {
      case 'welcome':
        return renderWelcomeStep()
      case 'create-mnemonic':
        return renderCreateMnemonicStep()
      case 'verify-mnemonic':
        return renderVerifyMnemonicStep()
      case 'set-password':
        return renderSetPasswordStep()
      case 'download-wallet':
        return renderDownloadWalletStep()
      case 'restore-method':
        return renderRestoreMethodStep()
      case 'restore-mnemonic':
        return renderRestoreMnemonicStep()
      case 'restore-file':
        return renderRestoreFileStep()
      case 'restore-password':
        return renderRestorePasswordStep()
      default:
        return null
    }
  }

  return (
    <div className="h-dvh bg-gradient-to-br from-gray-900 via-purple-900/10 to-gray-900 flex flex-col overflow-hidden">
      <div className="flex justify-between items-center p-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <img src="https://r2.scash.network/logo.png" alt="SCASH Logo" className="w-10 h-10 rounded-xl shadow-lg shadow-purple-500/20" />
          <h1 className="text-xl font-bold text-white">{t('wallet.title')}</h1>
        </div>
        <LanguageSelector />
      </div>

      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        <div className="w-full max-w-md">
          {renderStepIndicator()}

          <div className="bg-gray-800/40 backdrop-blur-xl rounded-3xl p-8 border border-gray-700/50 shadow-2xl">
            {renderCurrentStep()}
          </div>
        </div>
      </div>
    </div>
  )
}
