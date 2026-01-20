'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLanguage } from '@/contexts/language-context'
import { ArrowLeft, Lock, ExternalLink, MessageSquare } from 'lucide-react'
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
import { useToast } from '@/hooks/use-toast'
import {
  calcDapFee,
  calcValue,
  decryptWallet,
  NAME_TOKEN,
  SCASH_NETWORK,
  signTransaction,
  ARR_FEE_ADDRESS,
  onOpenExplorer,
  sleep
} from '@/lib/utils'
import { PendingTransaction, useWalletActions, useWalletState } from '@/stores/wallet-store'
import { onBroadcastApi, Unspent } from '@/lib/api'
import Decimal from 'decimal.js'
import * as bip39 from 'bip39'
import { BIP32Factory } from 'bip32'
import * as ecc from 'tiny-secp256k1'

interface WalletEngraveProps {
  onNavigate: (view: string) => void
}

export function WalletEngrave({ onNavigate }: WalletEngraveProps) {
  const { wallet, coinPrice, unspent } = useWalletState()
  const { getBaseFee, addPendingTransaction, setUpdateBalanceByMemPool } = useWalletActions()
  const { t } = useLanguage()
  const { toast } = useToast()
  const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form')

  const [engraveText, setEngraveText] = useState<string>('')
  const [dapFee, setDapFee] = useState<{ totalSats: number; totalScash: number; chunkCount: number; mode: string } | null>(null)
  const [appFee] = useState<number>(0.1)
  const [totalFee, setTotalFee] = useState<number>(0)
  const [baseFee, setBaseFee] = useState<number>(0)
  const [networkFee, setNetworkFee] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const [pickUnspents, setPickUnspents] = useState<Unspent[]>([])
  const [password, setPassword] = useState<string>('')
  const [passwordError, setPasswordError] = useState<string>('')
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false)
  const [currentPendingTransaction, setCurrentPendingTransaction] = useState<PendingTransaction>()

  const ENGRAVE_AMOUNT = 0.00000546

  async function getInitData() {
    setIsLoading(true)
    try {
      const getBaseFeeRes = await getBaseFee()
      setBaseFee(getBaseFeeRes.fee)
    } catch (error) {
      console.log(error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setUpdateBalanceByMemPool()
    getInitData()
  }, [])

  useEffect(() => {
    if (!engraveText || !engraveText.trim()) {
      setDapFee(null)
      setTotalFee(0)
      return
    }
    const fee = calcDapFee(engraveText)
    setDapFee(fee)
  }, [engraveText])

  useEffect(() => {
    if (!dapFee) {
      setTotalFee(0)
      setNetworkFee(0)
      return
    }

    const total = new Decimal(dapFee.totalScash).plus(appFee).toNumber()
    setTotalFee(total)
    setNetworkFee(dapFee.totalScash)
  }, [dapFee, appFee])

  useEffect(() => {
    if (step !== 'form' || !baseFee) return
    if (!engraveText || !engraveText.trim()) {
      setPickUnspents([])
      return
    }

    const requiredAmount = new Decimal(ENGRAVE_AMOUNT).plus(totalFee)

    let pickAmount = new Decimal(0)
    const pickUnspentsArr: Unspent[] = []

    for (const unspentItem of unspent) {
      if (unspentItem.isHasMemPool || !unspentItem.isUsable) {
        continue
      }
      pickAmount = pickAmount.plus(new Decimal(unspentItem.amount))
      pickUnspentsArr.push(unspentItem)
      if (pickAmount.gte(requiredAmount)) {
        break
      }
    }

    if (pickAmount.lt(requiredAmount)) {
      setPickUnspents([])
      return
    }

    setPickUnspents([...pickUnspentsArr])
  }, [engraveText, baseFee, totalFee, step])

  const handleSendToConfirm = () => {
    if (pickUnspents.length === 0) {
      return
    }
    setStep('confirm')
  }

  const handlePasswordSubmit = () => {
    if (!password) {
      setPasswordError(t('wallet.lock.input'))
      return
    }
    setPasswordError('')
    setShowConfirmDialog(true)
  }

  const [isConfirmLoading, setIsConfirmLoading] = useState<boolean>(false)

  const handleConfirmTransaction = async () => {
    setIsConfirmLoading(true)
    const walletObj = decryptWallet(wallet.encryptedWallet, password)
    if (!walletObj.isSuccess) {
      setPasswordError(t('wallet.lock.error'))
      setShowConfirmDialog(false)
      setIsConfirmLoading(false)
      return
    }

    if (!walletObj.wallet) {
      setIsConfirmLoading(false)
      return
    }

    const bip2 = BIP32Factory(ecc)
    const seed = bip39.mnemonicToSeedSync(walletObj.wallet.mnemonic)
    const root = bip2.fromSeed(seed, SCASH_NETWORK)
    const path = "m/84'/0'/0'/0/0"
    const child = root.derivePath(path)

    const outputs = [
      { address: ARR_FEE_ADDRESS, amount: appFee.toString() }
    ]

    const signTransactionResult = signTransaction(pickUnspents, outputs, networkFee, wallet.address, child, appFee, engraveText)
    if (!signTransactionResult.isSuccess) {
      toast({
        title: '签名失败',
        description: '',
        variant: 'destructive'
      })
      setIsConfirmLoading(false)
      return
    }

    try {
      const res = await onBroadcastApi({
        address: wallet.address,
        txid: '',
        rawtx: signTransactionResult.rawtx,
        totalInput: signTransactionResult.totalInput.toNumber(),
        totalOutput: signTransactionResult.totalOutput.toNumber(),
        change: signTransactionResult.change.toNumber(),
        feeRate: signTransactionResult.feeRate,
        appFee: signTransactionResult.appFee
      })

      if (res.data.error) {
        toast({
          title: '错误码:' + res.data.error.error.code,
          description: res.data.error.error.message,
          variant: 'destructive'
        })
        setIsConfirmLoading(false)
        return
      }

      if (!res.data.rpcData.txid) {
        toast({
          title: t('send.error'),
          description: t('send.errorTxid'),
          variant: 'destructive'
        })
        setIsConfirmLoading(false)
        return
      }

      const pendingTransaction: PendingTransaction = {
        id: res.data.rpcData.txid,
        rawtx: signTransactionResult.rawtx,
        totalInput: signTransactionResult.totalInput.toNumber(),
        totalOutput: signTransactionResult.totalOutput.toNumber(),
        change: signTransactionResult.change.toNumber(),
        feeRate: signTransactionResult.feeRate,
        pickUnspents: pickUnspents,
        sendListConfirm: outputs,
        timestamp: Date.now(),
        status: 'pending'
      }
      await sleep(1533)
      addPendingTransaction(pendingTransaction)
      setCurrentPendingTransaction(pendingTransaction)
      setStep('success')
      setIsSliding(false)
      setPassword('')
      toast({
        title: t('send.success'),
        description: t('send.broadcast'),
        variant: 'success'
      })
    } catch (error: any) {
      console.log(error, 'error')
      toast({
        title: t('send.error'),
        description: t('send.errorInfo'),
        variant: 'destructive'
      })
    } finally {
      setIsConfirmLoading(false)
      setShowConfirmDialog(false)
    }
  }

  const [isCancelLoading, setIsCancelLoading] = useState<boolean>(false)

  const handleCancelTransaction = async () => {
    setIsCancelLoading(true)
    await sleep(1533)
    setIsCancelLoading(false)
    setShowConfirmDialog(false)
  }

  const [isSliding, setIsSliding] = useState(false)

  if (step === 'success') {
    return (
      <div className="flex-1 flex items-center justify-center p-4 min-h-screen">
        <div className="w-full max-w-md mx-auto">
          <div className="text-center space-y-6">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-500 rounded-full flex items-center justify-center mx-auto shadow-2xl border-2 border-purple-400">
                <MessageSquare className="h-10 w-10 text-white" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-white tracking-tight">刻字成功!</h2>
              <p className="text-purple-300 text-sm">您的文字已永久刻在区块链上</p>
            </div>

            {currentPendingTransaction && (
              <div className="space-y-4">
                <div className="bg-purple-900/30 rounded-lg p-3 border border-purple-600/30 backdrop-blur-sm">
                  <div className="flex flex-col space-y-2">
                    <p className="text-purple-300 text-xs uppercase tracking-wide">Transaction ID</p>
                    <p className="text-white text-sm font-mono break-all">{currentPendingTransaction.id}</p>
                    <button
                      onClick={() => onOpenExplorer('1', 'tx', currentPendingTransaction.id)}
                      className="flex items-center space-x-1 text-purple-300 hover:text-white text-sm transition-colors self-start mt-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>{t('transactions.openExplorer')}</span>
                    </button>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-xl p-4 border border-purple-600/30 backdrop-blur-sm">
                  <div className="text-center">
                    <p className="text-purple-300 text-xs uppercase tracking-wide mb-2">刻字内容</p>
                    <p className="text-white text-lg font-semibold break-words">{engraveText}</p>
                  </div>
                </div>

                <div className="bg-purple-900/30 rounded-lg p-3 border border-purple-600/30 backdrop-blur-sm">
                  <div className="flex justify-between text-sm">
                    <span className="text-purple-300">刻字费用:</span>
                    <span className="text-white">
                      {ENGRAVE_AMOUNT} {NAME_TOKEN}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-purple-300">手续费:</span>
                    <span className="text-white">
                      {totalFee} {NAME_TOKEN}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={() => onNavigate('home')}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl border border-purple-500/50"
            >
              {t('send.backToHome')}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'confirm') {
    return (
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="sm" onClick={() => setStep('form')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-bold text-white">{t('send.confirm')}</h2>
        </div>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="px-4 space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-400">从:</span>
              <span className="text-white font-mono text-sm">
                {wallet.address.slice(0, 10)}...{wallet.address.slice(-10)}
              </span>
            </div>

            <div className="bg-purple-900/30 rounded-lg p-3 border border-purple-600/30">
              <p className="text-purple-300 text-xs uppercase tracking-wide mb-1">刻字内容:</p>
              <p className="text-white text-sm break-words">{engraveText}</p>
            </div>

            <div className="space-y-2 border-t border-gray-600 pt-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">刻字费用:</span>
                <span className="text-white">{ENGRAVE_AMOUNT} {NAME_TOKEN}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">DAP 费用:</span>
                <span className="text-white">{networkFee} {NAME_TOKEN}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">平台服务费:</span>
                <span className="text-white">{appFee} {NAME_TOKEN}</span>
              </div>
            </div>

            <div className="flex justify-between border-t border-gray-600 pt-3">
              <span className="text-gray-400">{t('send.total')}:</span>
              <div className="text-right">
                <span className="text-white font-semibold">
                  {new Decimal(ENGRAVE_AMOUNT).plus(totalFee).toFixed(8)} {NAME_TOKEN}
                </span>
                <p className="text-gray-400 text-sm">
                  ${calcValue(new Decimal(ENGRAVE_AMOUNT).plus(totalFee).toNumber(), coinPrice)} USD
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="px-4 py-4 space-y-4">
            <Label className="text-white flex items-center gap-2">
              <Lock className="h-4 w-4" />
              {t('send.confirmTransaction')}
            </Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (passwordError) setPasswordError('')
              }}
              placeholder={t('send.inputPassword')}
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
            {passwordError && <p className="text-red-400 text-sm">{passwordError}</p>}
          </CardContent>
        </Card>

        <AlertDialog
          open={showConfirmDialog}
          onOpenChange={(open) => {
            if (!open) return
            setShowConfirmDialog(open)
          }}
        >
          <AlertDialogTrigger asChild>
            <Button
              onClick={handlePasswordSubmit}
              disabled={isSliding || !password}
              className="w-full bg-green-500 hover:bg-green-600 text-white h-12"
            >
              {isSliding ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : t('send.confirmPay')}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-gray-800 border-gray-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">{t('send.confirm')}</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-300">
                确认将文字 "{engraveText}" 刻在区块链上吗？此操作不可撤销。
                <br />
                总费用: {new Decimal(ENGRAVE_AMOUNT).plus(totalFee).toFixed(8)} {NAME_TOKEN}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleCancelTransaction} className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600">
                {isCancelLoading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : t('send.cancel')}
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmTransaction} className="bg-green-500 hover:bg-green-600 text-white">
                {isConfirmLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  t('send.confirmTransactionOn')
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Button onClick={() => setStep('form')} variant="outline" className="w-full border-gray-600 text-gray-300 hover:bg-gray-700">
          {t('send.backToEdit')}
        </Button>
      </div>
    )
  }

  return (
    <div className="flex-1 p-4 space-y-4 overflow-y-auto">

      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="px-4 space-y-4">
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="h-8 w-8 text-white" />
            </div>
            <p className="text-gray-300 text-sm">
              将您的文字永久刻在区块链上，<br />
              让它永远无法被篡改或删除
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-purple-400">刻字内容</Label>
            <textarea
              value={engraveText}
              onChange={(e) => setEngraveText(e.target.value)}
              placeholder="输入您想永久保存的文字..."
              className="w-full bg-gray-900 text-white border border-gray-600 rounded-lg p-3 resize-none h-32 focus:outline-none focus:border-purple-400"
            />
            <div className="text-right text-xs text-gray-400">
              {engraveText.length} 字符
            </div>
          </div>

          {dapFee && (
            <div className="bg-gray-900/50 rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">刻字费用:</span>
                <span className="text-white">{ENGRAVE_AMOUNT} {NAME_TOKEN}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">DAP 费用 ({dapFee.chunkCount} 个分片):</span>
                <span className="text-white">{dapFee.totalScash} {NAME_TOKEN}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">平台服务费:</span>
                <span className="text-white">{appFee} {NAME_TOKEN}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold border-t border-gray-600 pt-2">
                <span className="text-gray-300">总费用:</span>
                <span className="text-white">
                  {new Decimal(ENGRAVE_AMOUNT).plus(dapFee.totalScash).plus(appFee).toFixed(8)} {NAME_TOKEN}
                </span>
              </div>
              <div className="text-right text-xs text-gray-400">
                ≈ ${calcValue(new Decimal(ENGRAVE_AMOUNT).plus(dapFee.totalScash).plus(appFee).toNumber(), coinPrice)} USD
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {totalFee > 0 && pickUnspents.length === 0 && (
        <div className="text-red-400 text-sm text-center bg-red-900/20 border border-red-700 rounded-lg p-2">
          余额不足，无法完成刻字
        </div>
      )}

      <Button
        onClick={handleSendToConfirm}
        disabled={!engraveText || !engraveText.trim() || pickUnspents.length === 0 || isLoading}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white disabled:bg-gray-600 disabled:text-gray-400"
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>...</span>
          </div>
        ) : (
          '确认刻字'
        )}
      </Button>
    </div>
  )
}
