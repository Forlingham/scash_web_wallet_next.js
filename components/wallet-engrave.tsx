'use client'

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
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useLanguage } from '@/contexts/language-context'
import { useToast } from '@/hooks/use-toast'
import { onBroadcastApi, Unspent } from '@/lib/api'
import {
  calcFee,
  calcValue,
  decryptWallet,
  getDapInstance,
  NAME_TOKEN,
  onOpenExplorer,
  SCASH_NETWORK,
  signTransaction,
  sleep
} from '@/lib/utils'
import { PendingTransaction, useWalletActions, useWalletState } from '@/stores/wallet-store'
import { BIP32Factory } from 'bip32'
import * as bip39 from 'bip39'
import Decimal from 'decimal.js'
import { ArrowLeft, ExternalLink, Lock, MessageSquare } from 'lucide-react'
import { useEffect, useState } from 'react'
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
  const [dapInfo, setDapInfo] = useState<DapOutputsResult | null>(null)
  const [appFee] = useState<number>(0.05)
  const [networkFee, setNetworkFee] = useState<number>(0)
  const [totalFee, setTotalFee] = useState<number>(0)
  const [baseFee, setBaseFee] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const [pickUnspents, setPickUnspents] = useState<Unspent[]>([])
  const [password, setPassword] = useState<string>('')
  const [passwordError, setPasswordError] = useState<string>('')
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false)
  const [currentPendingTransaction, setCurrentPendingTransaction] = useState<PendingTransaction>()

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
      setDapInfo(null)
      setTotalFee(0)
      return
    }

    const dap = getDapInstance()
    if (!dap) {
      setDapInfo(null)
      return
    }

    try {
      const dapOutputs = dap.createDapOutputs(engraveText)
      const dapAmount = dapOutputs.reduce((sum: number, output: { value: number }) => sum + output.value, 0) / 1e8

      setDapInfo({
        outputs: dapOutputs.map((output: { address: string; value: number }) => ({
          address: output.address,
          amount: (output.value / 1e8).toString()
        })),
        dapAmount,
        chunkCount: dapOutputs.length
      })
    } catch (error) {
      console.error('创建 DAP 输出失败:', error)
      setDapInfo(null)
    }
  }, [engraveText])

  useEffect(() => {
    if (!dapInfo || !baseFee) {
      setNetworkFee(0)
      setTotalFee(0)
      return
    }

    const inputCount = pickUnspents.length
    const outputCount = dapInfo.outputs.length + 1 + 1

    const feeResult = calcFee(inputCount, outputCount, baseFee)
    setNetworkFee(feeResult.feeScash)

    const total = new Decimal(dapInfo.dapAmount).plus(feeResult.feeScash).plus(appFee).toNumber()
    setTotalFee(total)
  }, [dapInfo, baseFee, pickUnspents, appFee])

  useEffect(() => {
    if (step !== 'form' || !baseFee || !totalFee || !dapInfo) {
      return
    }

    const requiredAmount = new Decimal(dapInfo.dapAmount).plus(networkFee).plus(appFee)

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
  }, [engraveText, baseFee, totalFee, networkFee, dapInfo, step])

  const handleSendToConfirm = () => {
    if (pickUnspents.length === 0 || !dapInfo) {
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

    if (!dapInfo) {
      setIsConfirmLoading(false)
      return
    }

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

    const outputs = [...dapInfo.outputs]

    const totalFeeRate = new Decimal(networkFee).plus(appFee).toNumber()
    const signTransactionResult = signTransaction(pickUnspents, outputs, totalFeeRate, wallet.address, child, appFee)

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
              <h2 className="text-3xl font-bold text-white tracking-tight">{t('send.engraveSuccess')}</h2>
              <p className="text-purple-300 text-sm">{t('send.engraveSuccessMsg')}</p>
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
                    <p className="text-purple-300 text-xs uppercase tracking-wide mb-2">{t('send.engraveContent')}</p>
                    <p className="text-white text-lg font-semibold break-words">{engraveText}</p>
                  </div>
                </div>

                <div className="bg-purple-900/30 rounded-lg p-3 border border-purple-600/30 backdrop-blur-sm">
                  <div className="flex justify-between text-sm">
                    <span className="text-purple-300">{t('send.engraveLoss')}:</span>
                    <span className="text-white">
                      {dapInfo?.dapAmount.toFixed(8)} {NAME_TOKEN}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-purple-300">{t('send.engraveNetworkFee')}:</span>
                    <span className="text-white">
                      {networkFee.toFixed(8)} {NAME_TOKEN}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-purple-300">{t('send.engravePlatformFee')}:</span>
                    <span className="text-white">
                      {appFee.toFixed(8)} {NAME_TOKEN}
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
              <span className="text-gray-400">{t('send.engraveFrom')}</span>
              <span className="text-white font-mono text-sm">
                {wallet.address.slice(0, 10)}...{wallet.address.slice(-10)}
              </span>
            </div>

            <div className="bg-purple-900/30 rounded-lg p-3 border border-purple-600/30">
              <p className="text-purple-300 text-xs uppercase tracking-wide mb-1">{t('send.engraveContent')}:</p>
              <p className="text-white text-sm break-words">{engraveText}</p>
            </div>

            <div className="space-y-2 border-t border-gray-600 pt-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">{t('send.engraveLoss')}:</span>
                <span className="text-white">
                  {dapInfo?.dapAmount.toFixed(8)} {NAME_TOKEN}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">{t('send.engraveNetworkFee')}:</span>
                <span className="text-white">
                  {networkFee.toFixed(8)} {NAME_TOKEN}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">{t('send.engravePlatformFee')}:</span>
                <span className="text-white">
                  {appFee.toFixed(8)} {NAME_TOKEN}
                </span>
              </div>
            </div>

            <div className="flex justify-between border-t border-gray-600 pt-3">
              <span className="text-gray-400">{t('send.total')}:</span>
              <div className="text-right">
                <span className="text-white font-semibold">
                  {totalFee.toFixed(8)} {NAME_TOKEN}
                </span>
                <p className="text-gray-400 text-sm">${calcValue(totalFee, coinPrice)} USD</p>
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
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (passwordError) setPasswordError('')
              }}
              placeholder={t('send.inputPassword')}
              className="w-full bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg px-3 py-2 focus:outline-none focus:border-green-400"
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
            <Button onClick={handlePasswordSubmit} disabled={!password} className="w-full bg-green-500 hover:bg-green-600 text-white h-12">
              {t('send.confirmPay')}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-gray-800 border-gray-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">{t('send.confirm')}</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-300">
                {t('send.confirmTransactionInfo')}
                <br />
                {t('send.total')}: {totalFee.toFixed(8)} {NAME_TOKEN}
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
              {t('send.engraveDesc')}
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-purple-400">{t('send.engraveText')}</Label>
            <textarea
              value={engraveText}
              onChange={(e) => setEngraveText(e.target.value)}
              placeholder={t('send.engravePlaceholder')}
              className="w-full bg-gray-900 text-white border border-gray-600 rounded-lg p-3 resize-none h-32 focus:outline-none focus:border-purple-400"
            />
            <div className="text-right text-xs text-gray-400">{engraveText.length} {t('send.engraveChunkCount').toLowerCase()}</div>
          </div>

          {dapInfo && (
            <div className="bg-gray-900/50 rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">{t('send.engraveLoss')}:</span>
                <span className="text-white">
                  {dapInfo.dapAmount.toFixed(8)} {NAME_TOKEN}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">{t('send.engraveChunkCount')}:</span>
                <span className="text-white">{dapInfo.chunkCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">{t('send.engraveNetworkFee')}:</span>
                <span className="text-white">
                  {networkFee.toFixed(8)} {NAME_TOKEN}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">{t('send.engravePlatformFee')}:</span>
                <span className="text-white">
                  {appFee.toFixed(8)} {NAME_TOKEN}
                </span>
              </div>
              <div className="flex justify-between text-sm font-semibold border-t border-gray-600 pt-2">
                <span className="text-gray-300">{t('send.totalFee')}:</span>
                <span className="text-white">
                  {totalFee.toFixed(8)} {NAME_TOKEN}
                </span>
              </div>
              <div className="text-right text-xs text-gray-400">≈ ${calcValue(totalFee, coinPrice)} USD</div>
            </div>
          )}
        </CardContent>
      </Card>

      {totalFee > 0 && pickUnspents.length === 0 && (
        <div className="text-red-400 text-sm text-center bg-red-900/20 border border-red-700 rounded-lg p-2">{t('send.engraveInsufficient')}</div>
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
          t('send.engraveButton')
        )}
      </Button>
    </div>
  )
}
