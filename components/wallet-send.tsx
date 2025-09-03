'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLanguage } from '@/contexts/language-context'
import { ArrowUpDown, X, QrCode, ChevronRight, ArrowLeft, Lock } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
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
  calcAppFee,
  calcFee,
  calcValue,
  decryptWallet,
  hideString,
  NAME_TOKEN,
  SCASH_NETWORK,
  signTransaction,
  validateScashAddress
} from '@/lib/utils'
import { PendingTransaction, useWalletActions, useWalletState } from '@/stores/wallet-store'
import { getBaseFeeApi, getScantxoutsetApi, onBroadcastApi, Unspent } from '@/lib/api'
import Decimal from 'decimal.js'
import * as bip39 from 'bip39'
import { BIP32Factory } from 'bip32'
import * as ecc from 'tiny-secp256k1'

interface WalletSendProps {
  onNavigate: (view: string) => void
}

export function WalletSend({ onNavigate }: WalletSendProps) {
  const { wallet, coinPrice, unspent } = useWalletState()
  const { getBaseFee, addPendingTransaction, setUpdateBalanceByMemPool } = useWalletActions()
  const { t } = useLanguage()
  const { toast } = useToast()
  const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form')
  // const [recipientAddress, setRecipientAddress] = useState('')
  // const [sendAmount, setSendAmount] = useState('')
  const [isSliding, setIsSliding] = useState(false)

  const [sendList, setSendList] = useState<SendList[]>([
    {
      address: '',
      amount: ''
    }
  ])
  const [sendListConfirm, setSendListConfirm] = useState<SendList[]>([])
  const [sendAmount, setSendAmount] = useState<number>(0)
  const [sendAmountTotal, setSendAmountTotal] = useState<number>(0)
  const [baseFee, setBaseFee] = useState<number>(0)
  const [networkFee, setNetworkFee] = useState<number>(0)
  const [appFee, setAppFee] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const [pickUnspents, setPickUnspents] = useState<Unspent[]>([])
  const [addressErrors, setAddressErrors] = useState<{ [key: number]: boolean }>({})
  const [amountErrors, setAmountErrors] = useState<{ [key: number]: boolean }>({})
  const [lastAmountInputIndex, setLastAmountInputIndex] = useState<number | null>(null)
  const [deductFeeFromAmount, setDeductFeeFromAmount] = useState<boolean>(false)
  const [isForcedDeductFeeFromAmount, setIsForcedDeductFeeFromAmount] = useState<boolean>(false)
  const [totalAmountError, setTotalAmountError] = useState<string>('')
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

  const handleChangeAddress = (index: number, value: string) => {
    setSendList((prev) => {
      const newList = [...prev]
      newList[index].address = value
      return newList
    })
    // 清除该输入框的错误状态
    if (addressErrors[index]) {
      setAddressErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[index]
        return newErrors
      })
    }
  }

  const handleBlurAddress = (index: number) => {
    if (sendList[index].address && !validateScashAddress(sendList[index].address)) {
      setAddressErrors((prev) => ({ ...prev, [index]: true }))
    }
  }

  const handleChangeAmount = (index: number, value: string) => {
    setSendList((prev) => {
      const newList = [...prev]
      newList[index].amount = value
      return newList
    })

    // 记录最后输入的输入框
    setLastAmountInputIndex(index)

    // 清除该输入框的错误状态
    if (amountErrors[index]) {
      setAmountErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[index]
        return newErrors
      })
    }
  }

  const handleMaxAmount = (index: number) => {
    handleChangeAmount(index, wallet.usableBalance.toString())
    setDeductFeeFromAmount(true)
  }

  const validateAmount = (index: number, amount: string) => {
    const numAmount = parseFloat(amount)
    const walletBalance = parseFloat(wallet.usableBalance.toString())

    if (amount && !isNaN(numAmount) && numAmount > walletBalance) {
      setAmountErrors((prev) => ({ ...prev, [index]: true }))
    }
  }

  // 验证总金额是否超出余额
  const validateTotalAmount = () => {
    const validSendList = sendList.filter((item) => {
      return item.address && validateScashAddress(item.address) && item.amount && Number.parseFloat(item.amount) > 0
    })
    const totalAmount = validSendList.reduce((sum, item) => sum.add(item.amount), new Decimal(0))
    const availableBalance = parseFloat(wallet.usableBalance.toString())
    const fee = networkFee

    let requiredAmount = totalAmount
    if (!deductFeeFromAmount) {
      requiredAmount = requiredAmount.plus(fee)
    }

    if (requiredAmount.gt(availableBalance)) {
      setTotalAmountError(t('send.inputExceed'))
      return false
    } else {
      setTotalAmountError('')
      return true
    }
  }

  // 监听金额、手续费和开关状态变化，实时验证
  useEffect(() => {
    if (sendList.some((item) => item.amount) && networkFee) {
      validateTotalAmount()
    }
  }, [sendList, networkFee, deductFeeFromAmount, wallet.usableBalance])

  useEffect(() => {
    if (step !== 'form') return
    const validSendList = sendList.filter((item) => {
      return item.address && validateScashAddress(item.address) && item.amount && Number.parseFloat(item.amount) > 0
    })

    if (validSendList.length === 0) {
      setNetworkFee(0)
      setPickUnspents([])
      setSendAmount(0)
      return
    }

    const _sendAmount = new Decimal(
      validSendList.reduce((acc, item) => acc.plus(new Decimal(item.amount || '0')), new Decimal(0))
    ).toNumber()
    setSendAmount(_sendAmount)

    // 计算需要多少个输入才能满足发送的金额
    let pickAmount = new Decimal(0)
    const pickUnspentsArr: Unspent[] = []
    console.log(unspent, 'unspent')

    for (const unspentItem of unspent) {
      if (unspentItem.isHasMemPool || !unspentItem.isUsable) {
        continue
      }
      pickAmount = pickAmount.plus(new Decimal(unspentItem.amount))
      console.log('pickAmount', pickAmount.toString(), 'sendAmount', _sendAmount)

      pickUnspentsArr.push(unspentItem)
      if (pickAmount.gte(new Decimal(_sendAmount))) {
        break
      }
    }
    if (pickAmount.lt(_sendAmount)) {
      setTotalAmountError(t('send.inputExceed'))
      return
    }

    setPickUnspents([...pickUnspentsArr])
    console.log(pickUnspentsArr)

    // 统计发送TX输入数量 - 使用本地变量而不是状态变量
    const inputCount = pickUnspentsArr.length
    // 统计输出地址数量 (收款地址 + 找零地址)
    const outputCount = sendList.filter((item) => item.address).length + 5

    // 计算app手续费
    const appFee = calcAppFee(_sendAmount)
    setAppFee(appFee)

    const _networkFee = new Decimal(appFee).plus(calcFee(inputCount, outputCount, baseFee).feeScash).toNumber()
    setNetworkFee(_networkFee)

    // 如何输入的金额刚刚好，能和交易数据金额相等,或者输出的总金额添加上手续费大于总的输入金额，就需要强制从金额中扣除手续费，并且不需要找零地址
    if (pickAmount.eq(new Decimal(_sendAmount)) || new Decimal(_sendAmount).plus(networkFee).gte(new Decimal(pickAmount))) {
      setDeductFeeFromAmount(true)
      setIsForcedDeductFeeFromAmount(true)
    } else {
      setIsForcedDeductFeeFromAmount(false)
    }
  }, [sendList])

  const handleAddAddress = () => {
    // Mock address book functionality
    setSendList([...sendList, { address: '', amount: '' }])
  }

  const handleSendToConfirm = () => {
    const validSendList = JSON.parse(
      JSON.stringify(
        sendList.filter((item) => {
          return item.address && validateScashAddress(item.address) && item.amount && Number.parseFloat(item.amount) > 0
        })
      )
    )
    if (validSendList.length === 0) {
      setSendListConfirm([])
      return
    }
    setStep('confirm')

    if (!deductFeeFromAmount) {
      setSendAmountTotal(+new Decimal(sendAmount).add(networkFee).toFixed(8))
    } else {
      // 如果从金额中减去手续费，就在最后一个地址减。需要判断金额够手续费不，不够就再向上找一个，全部不够就报错
      let lastIndex = validSendList.length - 1
      while (lastIndex >= 0) {
        if (new Decimal(validSendList[lastIndex].amount || '0').gte(networkFee)) {
          validSendList[lastIndex].amount = new Decimal(validSendList[lastIndex].amount || '0').minus(networkFee).toString()
          break
        }
        lastIndex--
      }
      if (lastIndex < 0) {
        setTotalAmountError(t('send.inputExceed'))
        return
      }
      setSendAmountTotal(sendAmount)
    }

    setSendListConfirm(validSendList)
  }

  const handleScanQR = () => {
    // Mock QR scanner functionality
    toast({
      title: 'QR Scanner',
      description: 'QR scanner feature will be implemented soon'
    })
  }

  const handlePasswordSubmit = () => {
    // 验证密码
    if (!password) {
      setPasswordError(t('wallet.lock.input'))
      return
    }

    // 这里可以添加密码验证逻辑
    // 假设密码正确，清除错误并显示确认弹窗
    setPasswordError('')
    setShowConfirmDialog(true)
  }

  const handleConfirmTransaction = async () => {
    // password
    const walletObj = decryptWallet(wallet.encryptedWallet, password)
    if (!walletObj.isSuccess) {
      setPasswordError(t('wallet.lock.error'))
      setShowConfirmDialog(false)
      return
    }

    if (!walletObj.wallet) {
      return
    }

    const bip2 = BIP32Factory(ecc)
    const seed = bip39.mnemonicToSeedSync(walletObj.wallet.mnemonic)
    const root = bip2.fromSeed(seed, SCASH_NETWORK)
    const path = "m/84'/0'/0'/0/0"
    const child = root.derivePath(path)
    const signTransactionResult = signTransaction(pickUnspents, sendListConfirm, networkFee, wallet.address, child, appFee)
    if (!signTransactionResult.isSuccess) {
      toast({
        title: '签名失败',
        description: '',
        variant: 'destructive'
      })
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

      if (!res.data.success && res.data.error) {
        toast({
          title: '错误码:' + res.data.error.error.code,
          description: res.data.error.error.message,
          variant: 'destructive'
        })
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
        sendListConfirm: sendListConfirm,
        timestamp: Date.now(),
        status: 'pending'
      }
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
    } catch (error) {
      console.log(error)
    }

  }

  const handleCancelTransaction = () => {
    return
  }


  if (step === 'success') {
    return (
      <div className="flex-1 flex items-center justify-center p-4 min-h-screen">
        <div className="w-full max-w-md mx-auto">
          <div className="text-center space-y-6">
            {/* Success Icon with purple logo-inspired styling */}
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full flex items-center justify-center mx-auto shadow-2xl border-2 border-purple-400">
                <ArrowUpDown className="h-10 w-10 text-white rotate-90" />
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-white tracking-tight">{t('send.success')}</h2>
              <p className="text-purple-300 text-sm">{t('send.broadcast')}</p>
            </div>

            {/* Transaction Details */}
            {currentPendingTransaction && (
              <div className="space-y-4">
                {/* Amount Card */}
                <div className="bg-gradient-to-r from-purple-900/50 to-purple-800/50 rounded-xl p-4 border border-purple-600/30 backdrop-blur-sm">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white mb-1">
                      {sendAmountTotal} {NAME_TOKEN}
                    </p>
                    <p className="text-purple-300 text-sm">${calcValue(sendAmountTotal, coinPrice)} USD</p>
                  </div>
                </div>

                {/* Recipients */}
                <div className="space-y-3">
                  {currentPendingTransaction?.sendListConfirm.map((item, index) => (
                    <div className="bg-purple-900/30 rounded-lg p-3 border border-purple-600/30 backdrop-blur-sm" key={index}>
                      <div className="flex justify-between items-center">
                        <div className="flex-1 min-w-0">
                          <p className="text-purple-300 text-xs uppercase tracking-wide mb-1">To</p>
                          <p className="text-white text-sm font-mono truncate">{hideString(item.address)}</p>
                        </div>
                        <div className="text-right ml-3">
                          <p className="text-purple-300 text-xs uppercase tracking-wide mb-1">Amount</p>
                          <p className="text-white text-sm font-semibold">
                            {item.amount} {NAME_TOKEN}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Raw Transaction */}
                <div className="bg-purple-950/50 rounded-lg p-3 border border-purple-600/30 backdrop-blur-sm">
                  <p className="text-purple-300 text-xs uppercase tracking-wide mb-2">{t('send.rawTransaction')}</p>
                  <div className="bg-black/50 rounded p-2 max-h-20 overflow-y-auto border border-purple-800/30">
                    <p className="text-purple-400 text-xs font-mono break-all leading-relaxed">{currentPendingTransaction?.rawtx}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Back Button */}
            <Button
              onClick={() => onNavigate('home')}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl border border-purple-500/50"
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
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-2">{t('send.confirm')}</h2>
        </div>

        {/* Transaction Summary */}
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="px-4 space-y-4">
            <div className="text-center">
              {/* <div className="text-3xl font-bold text-white">
                {sendList
                  .filter((item) => item.address && item.amount)
                  .reduce((acc, item) => acc + Number.parseFloat(item.amount || '0'), 0)}
              </div> */}
              {/* <div className="text-gray-400">
              
              </div> */}
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">{t('send.from')}:</span>
              <span className="text-white">
                {wallet.address.slice(0, 10)}...{wallet.address.slice(-10)}
              </span>
            </div>

            {sendListConfirm.map((item, index) => (
              <div className="space-y-3 border-t border-gray-600 pt-3" key={index}>
                <div className="flex justify-between">
                  <span className="text-gray-400">{t('send.to')}:</span>
                  <span className="text-white font-mono text-sm">
                    {item.address.slice(0, 10)}...{item.address.slice(-10)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400">{t('send.amount')}:</span>
                  <span className="text-white font-mono text-sm">{item.amount}</span>
                </div>
              </div>
            ))}
            <div className="flex justify-between border-t border-gray-600 pt-3">
              <span className="text-gray-400">{t('common.fee')}:</span>
              <span className="text-white flex items-center gap-2">
                {networkFee} {NAME_TOKEN}
              </span>
            </div>

            <div className="">
              <div className="flex justify-between font-semibold">
                <span className="text-gray-400">{t('send.total')}:</span>
                <div className="text-right">
                  <span className="text-white">
                    {sendAmountTotal} {NAME_TOKEN}
                  </span>
                  <br />
                  <span className="text-white">${calcValue(sendAmountTotal, coinPrice)} USD</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Password Input */}
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

        {/* Confirm Button with Dialog */}
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
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
                {t('send.send')} {sendAmountTotal} {NAME_TOKEN}，{t('send.fee')} {networkFee} {NAME_TOKEN}。
                <br />
                {t('send.confirmTransactionInfo')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleCancelTransaction} className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600">
                {t('send.cancel')}
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmTransaction} className="bg-green-500 hover:bg-green-600 text-white">
                {t('send.confirmTransactionOn')}
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
      <div className="text-center space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">
            {t('wallet.available')}: {wallet.usableBalance} {NAME_TOKEN}
          </span>
          <div className="text-right">
            <div className="text-white font-medium">1 {NAME_TOKEN}</div>
            <div className="text-gray-400">${coinPrice} USD</div>
          </div>
        </div>
      </div>

      {/* Send To Address */}
      {sendList.map((item, index) => (
        <Card key={index} className="bg-gray-800 border-gray-700">
          <CardContent className="px-4 space-y-3">
            <Label className="text-green-400">{t('send.to')}</Label>

            <div className="relative">
              <Input
                value={item.address}
                onChange={(e) => handleChangeAddress(index, e.target.value)}
                onBlur={() => handleBlurAddress(index)}
                placeholder={t('send.toInfo')}
                className={`bg-gray-900 text-white pr-20 ${
                  addressErrors[index] ? 'border-red-500 focus:border-red-500' : 'border-gray-600'
                }`}
              />
              {item.address && (
                <Button
                  onClick={() => handleChangeAddress(index, '')}
                  variant="ghost"
                  size="sm"
                  className="absolute right-8 top-1/2 transform -translate-y-1/2 text-green-400 hover:text-green-300"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              <Button
                onClick={handleScanQR}
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 text-green-400 hover:text-green-300"
              >
                <QrCode className="h-4 w-4" />
              </Button>
            </div>

            {addressErrors[index] && <div className="text-red-400 text-sm mt-1">地址格式错误，请检查输入的地址</div>}

            <Label className="text-green-400">{t('common.amount')}:</Label>

            <div className="space-y-2">
              <div className="relative">
                <Input
                  value={item.amount}
                  onChange={(e) => handleChangeAmount(index, e.target.value)}
                  onBlur={() => validateAmount(index, item.amount)}
                  placeholder="0"
                  type="number"
                  className={`bg-gray-900 text-white text-2xl font-bold pr-20 ${
                    amountErrors[index] && lastAmountInputIndex === index ? 'border-red-500 focus:border-red-500' : 'border-gray-600'
                  }`}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleMaxAmount(index)}
                    className="text-purple-400 hover:text-purple-300 text-sm font-medium"
                  >
                    MAX
                  </button>
                  <span className="text-white font-medium">{NAME_TOKEN}</span>
                </div>
              </div>

              {amountErrors[index] && lastAmountInputIndex === index && (
                <div className="text-red-400 text-sm mt-1">
                  {t('send.amountExceed')} {wallet.usableBalance} {NAME_TOKEN}
                </div>
              )}

              <div className="text-center">
                {/* <span className="text-gray-400">${(Number.parseFloat(sendAmount || '0') * 0.0138).toFixed(4)}</span> */}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Add Another Address */}
      <Card className="bg-gray-800 border-gray-700 cursor-pointer hover:bg-gray-750" onClick={handleAddAddress}>
        <CardContent className="px-4">
          <div className="flex items-center justify-between">
            <span className="text-green-400">{t('send.addAnother')}</span>
            <ChevronRight className="h-4 w-4 text-green-400" />
          </div>
        </CardContent>
      </Card>

      {/* Network Fee */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="px-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-green-400">{t('send.fee')}:</div>
              <div className="text-white flex items-center gap-2">
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-400"></div>
                    <span className="text-gray-400">...</span>
                  </>
                ) : (
                  <>
                    {networkFee} {NAME_TOKEN}
                  </>
                )}
              </div>
            </div>
          </div>

          <label className="flex items-center cursor-pointer hover:bg-gray-800/50 p-2 rounded-lg transition-colors">
            <Checkbox
              disabled={isForcedDeductFeeFromAmount}
              checked={deductFeeFromAmount}
              onCheckedChange={(checked) => setDeductFeeFromAmount(checked === true)}
              className="w-4 h-4 min-w-4 max-w-4 min-h-4 max-h-4 flex-shrink-0 mr-3 border-2 border-gray-500 data-[state=unchecked]:border-gray-500 data-[state=unchecked]:bg-transparent"
            />

            <span className="text-gray-300 text-sm select-none">{t('send.feeDeducted')}</span>
          </label>
        </CardContent>
      </Card>

      {/* Error Message */}
      {totalAmountError && (
        <div className="text-red-400 text-sm text-center bg-red-900/20 border border-red-700 rounded-lg p-2">{totalAmountError}</div>
      )}

      {/* Continue Button */}
      <Button
        onClick={handleSendToConfirm}
        disabled={networkFee <= 0 || isLoading || !!totalAmountError}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white disabled:bg-gray-600 disabled:text-gray-400"
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>...</span>
          </div>
        ) : (
          t('send.confirm')
        )}
      </Button>
    </div>
  )
}
