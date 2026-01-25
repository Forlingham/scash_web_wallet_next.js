import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { decryptAES, encryptAES, hexToString, MD5, stringToHex } from './cryoto'
import Decimal from 'decimal.js'
import { bech32 } from 'bech32'
import * as bitcoin from 'bitcoinjs-lib'
import { Unspent } from './api'
import { BIP32Interface, BIP32Factory } from 'bip32'
import * as bip39 from 'bip39'
import * as ecc from 'tiny-secp256k1'
import pkg from '../package.json'
import { getArrFeeAddress, getScashNetwork } from './const'

let dapInstance: any = null

export function getDapInstance() {
  if (typeof window === 'undefined') {
    return null
  }

  if (!dapInstance) {
    try {
      console.log(SCASH_NETWORK, 'SCASH_NETWORK')

      const ScashDAP = require('scash-dap')
      dapInstance = new ScashDAP(SCASH_NETWORK)
    } catch (error) {
      console.error('初始化 DAP 失败:', error)
      return null
    }
  }

  return dapInstance
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const VERSION = pkg.version

export const NAME_TOKEN = 'SCASH'

export const SCASH_NETWORK = getScashNetwork()

export const explorerUrl1 = 'https://explorer.scash.network/'
export const explorerUrl2 = 'https://explorer.scash.network/'

export function onOpenExplorer(network: string, type: string, id: string) {
  if (network === '1') {
    window.open(`${explorerUrl1}${type}/${id}`)
  } else {
    window.open(`${explorerUrl2}${type}/${id}`)
  }
}

export const ARR_FEE_ADDRESS = getArrFeeAddress()
// app 手续费收取标准
export const APP_FEE_ARR = [
  {
    min: 0,
    max: 1,
    fee: 0.0001
  },
  {
    min: 1,
    max: 10,
    fee: 0.01
  },
  {
    min: 10,
    max: 50,
    fee: 0.05
  },
  {
    min: 50,
    max: 100,
    fee: 0.1
  },
  {
    min: 100,
    max: 500,
    fee: 0.2
  },
  {
    min: 500,
    max: 1000,
    fee: 0.4
  },
  {
    min: 1000,
    max: 5000,
    fee: 0.8
  },
  {
    min: 5000,
    max: 10000,
    fee: 1
  },
  {
    min: 10000,
    max: Number.MAX_SAFE_INTEGER,
    fee: 1.3
  }
]
export function calcAppFee(amount: string | number) {
  const amountDecimal = new Decimal(amount)
  for (const item of APP_FEE_ARR) {
    if (amountDecimal.gte(item.min) && amountDecimal.lt(item.max)) {
      return item.fee
    }
  }
  return 0
}

export function passwordMD5(password: string) {
  return MD5(password, 'password')
}

export function encryptWallet(wallet: WalletFile, passwordMD5String: string) {
  // const passwordMD5String = passwordMD5(password)
  const walletString = JSON.stringify(wallet)
  const encryptedWallet = encryptAES(walletString, 'walletFile', passwordMD5String)
  return stringToHex(encryptedWallet)
}

export function decryptWallet(walletHex: string, password: string) {
  const passwordMD5String = passwordMD5(password)

  const walletString = hexToString(walletHex)
  const wallet = decryptAES(walletString, 'walletFile', passwordMD5String)

  if (!wallet) {
    return {
      isSuccess: false,
      wallet: null
    }
  }
  return {
    isSuccess: true,
    wallet: JSON.parse(wallet) as WalletFile
  }
}

export async function downloadWalletFile(encryptedWallet: string, fileName = 'scash-wallet.json') {
  if (process.env.NEXT_PUBLIC_BITCOIN_RPC_IS_TESTNET === 'true') {
    fileName = 'scash-wallet-testnet.json'
  }
  // Create mock encrypted wallet file
  const walletData: WalletFileData = {
    version: VERSION,
    encrypted: true,
    data: encryptedWallet,
    timestamp: Date.now()
  }

  const content = JSON.stringify(walletData, null, 2)
  const blob = new Blob([content], { type: 'application/json' })

  // Try to use Web Share API first (better for mobile apps/WebViews)
  if (typeof navigator !== 'undefined' && navigator.canShare && navigator.share) {
    try {
      const file = new File([blob], fileName, { type: 'application/json' })
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'SCASH Wallet Backup',
          text: 'Please keep this file safe.'
        })
        return
      }
    } catch (error) {
      console.warn('Share failed, falling back to download:', error)
      // Continue to download fallback if share fails (e.g. user cancelled)
    }
  }

  // Fallback to data URI download via FileReader
  // This avoids blob: URLs which can cause XHR/Network errors in some WebView/App environments
  // that might try to fetch the blob URL via their own network stack and fail.
  const reader = new FileReader()
  reader.onload = (e) => {
    const url = e.target?.result as string
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }
  reader.readAsDataURL(blob)
}

const SAT_PER_SCASH = new Decimal(1e8)
export function scashToSat(scashAmount: string | number) {
  return +new Decimal(scashAmount).times(SAT_PER_SCASH).toFixed(0)
  // toFixed(0) 保证是整数形式的字符串，可以再转 BigInt
}

// satoshi → SCASH (返回字符串，带 8 位小数)
export function satToScash(satAmount: number) {
  return +new Decimal(satAmount).div(SAT_PER_SCASH).toFixed(8)
}

/**
 * 计算交易手续费
 * @param {number} inputCount - 输入数量 (UTXO 个数)
 * @param {number} outputCount - 输出数量 (收款地址 + 找零地址)
 * @param {number} feerate - 每KB手续费率 (SCASH/kB) 来自 estimatefee 或 estimatesmartfee
 * @returns {object} { size: 交易大小 (vbytes), feeSat: 手续费 (sat), feeScash: 手续费 (SCASH) }
 */
export function calcFee(inputCount: number, outputCount: number, feerate: number) {
  // === 1. 换算 feerate 到 sat/byte ===
  // feerate 是 SCASH/kB → sat/byte
  const feerateDecimal = new Decimal(feerate)
  const satPerByte = feerateDecimal.mul(SAT_PER_SCASH).div(1000)

  // === 2. 估算交易大小 (vbytes) ===
  // P2WPKH 输入大约 68 vbytes，输出大约 31 vbytes，额外开销 10,
  const size = 10 + inputCount * 68 + outputCount * 31

  // === 3. 计算手续费 ===
  const sizeDecimal = new Decimal(size)
  const feeSatDecimal = sizeDecimal.mul(satPerByte).ceil()
  const feeSat = feeSatDecimal.toNumber()
  const feeScash = feeSatDecimal.div(SAT_PER_SCASH).toNumber()

  return { size, feeSat, feeScash }
}

/**
 * 验证 SCASH 地址是否有效
 * @param {string} address - SCASH 地址
 * @returns {boolean} - 是否有效
 */
export function validateScashAddress(address: string) {
  try {
    const decoded = bech32.decode(address)

    if (decoded.prefix !== SCASH_NETWORK.bech32) {
      return false
    }

    // 数据部分必须能编码回去（防止错误校验和）
    const reencoded = bech32.encode(decoded.prefix, decoded.words)
    if (reencoded !== address.toLowerCase()) {
      return false
    }

    // SegWit version + program 长度检查（参考 BIP-0173）
    const data = bech32.fromWords(decoded.words.slice(1)) // 第一个是version
    if (data.length < 2 || data.length > 40) {
      return false
    }

    return true
  } catch (e) {
    return false
  }
}

/**
 * 计算价值.  数量 * 单价
 */
export function calcValue(amount: number | string, price: number | string) {
  return new Decimal(amount).times(price).toFixed(2)
}

/**
 * 字符串隐藏中间部分
 */
export function hideString(str: string) {
  if (str.length <= 4) {
    return str
  }
  const prefix = str.slice(0, 4)
  const suffix = str.slice(-6)
  return `${prefix}...${suffix}`
}

/**
 * 签名交易
 */
export function signTransaction(
  utxos: Unspent[],
  outputs: { address: string; amount: string }[],
  feeRate: number,
  myAddress: string,
  child: BIP32Interface,
  appFee: number
) {
  // 计算手续费
  let networkFee = feeRate
  if (appFee) {
    networkFee = new Decimal(feeRate).minus(appFee).toNumber()
  }

  // 计算总输入金额
  const totalInput = utxos.reduce((acc, utxo) => acc.plus(utxo.amount), new Decimal(0))

  // 计算总输出金额
  const totalOutput = outputs.reduce((acc, output) => acc.plus(output.amount), new Decimal(0))

  // === 构建交易 ===
  const psbt = new bitcoin.Psbt({ network: SCASH_NETWORK })

  console.log('utxos', utxos)
  console.log('outputs', outputs)
  console.log('feeRate', feeRate)
  console.log('appFee', appFee)
  console.log('networkFee', networkFee)
  console.log('totalInput', totalInput.toString(), 'totalOutput', totalOutput.toString())

  utxos.forEach((utxo) => {
    psbt.addInput({
      hash: utxo.txid,
      index: utxo.vout,
      witnessUtxo: {
        script: Buffer.from(utxo.scriptPubKey, 'hex'),
        value: scashToSat(utxo.amount)
      }
    })
  })

  outputs.forEach((output) => {
    psbt.addOutput({
      address: output.address,
      value: scashToSat(output.amount)
    })
  })
  if (appFee) {
    psbt.addOutput({
      address: ARR_FEE_ADDRESS,
      value: scashToSat(appFee)
    })
  }

  // 计算找零金额
  const change = totalInput.minus(totalOutput).minus(feeRate)
  console.log('change', change.toString())

  if (change.gt(0)) {
    psbt.addOutput({
      address: myAddress,
      value: scashToSat(change.toString())
    })
  }

  const publicKeyBuffer = Buffer.isBuffer(child.publicKey) ? child.publicKey : Buffer.from(child.publicKey)
  try {
    const customSigner = {
      publicKey: publicKeyBuffer,
      sign: (hash: Buffer) => {
        const signature = child.sign(hash)
        // 确保返回Buffer类型
        return Buffer.isBuffer(signature) ? signature : Buffer.from(signature)
      }
    }

    utxos.forEach((_, idx) => {
      psbt.signInput(idx, customSigner)
    })
    psbt.finalizeAllInputs()
  } catch (error) {
    console.log('签名失败', error)
    return {
      isSuccess: false,
      rawtx: '',
      totalInput,
      totalOutput,
      change,
      feeRate,
      appFee
    }
  }

  const rawtx = psbt.extractTransaction().toHex()

  return {
    isSuccess: true,
    rawtx,
    totalInput,
    totalOutput,
    change,
    feeRate,
    appFee
  }
}

export const analyzeTransaction = (tx: TransactionType, currentAddress: string) => {
  // 计算当前地址在所有输入中的总金额
  const totalInput = tx.senders
    .filter((sender) => sender.address === currentAddress)
    .reduce((sum, sender) => sum.plus(new Decimal(sender.amount)), new Decimal(0))

  // 计算当前地址在所有输出中的总金额
  const totalOutput = tx.receivers
    .filter((receiver) => receiver.address === currentAddress)
    .reduce((sum, receiver) => sum.plus(new Decimal(receiver.amount)), new Decimal(0))

  // 计算当前地址在找零输出中的总金额
  const totalChange = tx.changeOutputs
    .filter((change) => change.address === currentAddress)
    .reduce((sum, change) => sum.plus(new Decimal(change.amount)), new Decimal(0))

  // 判断交易类型
  const isCoinbase = tx.senders.length === 0 // 挖矿交易
  const isSender = totalInput.gt(0)
  const isReceiver = totalOutput.gt(0)

  let type: 'income' | 'expense' | 'self' | 'mining'
  let amount = new Decimal(0)
  let netAmount = new Decimal(0)

  if (isCoinbase && isReceiver) {
    // 挖矿奖励 - 只有输出没有输入
    type = 'mining'
    netAmount = totalOutput
    amount = totalOutput
  } else if (isSender && totalChange && isReceiver) {
    // 自己发给自己 - 有输入也有输出
    type = 'self'
    // 净变化 = 总输出 - 总输入（找零已经包含在总输出中）
    netAmount = totalOutput.minus(totalInput)
    amount = netAmount.abs()
  } else if (isSender) {
    // 只有输入没有输出 - 支出交易
    type = 'expense'
    // 净变化 = -总输入 - 找零
    netAmount = totalInput.minus(totalChange).negated()
    amount = totalInput.minus(totalChange)
  } else if (isReceiver) {
    // 只有输出没有输入 - 收入交易
    type = 'income'
    // 净变化 = 总输出
    netAmount = totalOutput
    amount = totalOutput
  } else {
    // 不相关交易，理论上不应该发生
    type = 'self'
    netAmount = new Decimal(0)
    amount = new Decimal(0)
  }

  return {
    type,
    amount: satToScash(amount.toNumber()),
    netAmount: satToScash(netAmount.abs().toNumber()),
    isPositive: netAmount.gte(0),
    txid: tx.txid,
    timestamp: tx.timestamp,
    confirmations: tx.confirmations
  }
}

export const ADDRESS_PATH = "m/84'/0'/0'/0/0"
export function getWalletPrivateKey(mnemonic: string) {
  const bip2 = BIP32Factory(ecc)
  const seed = bip39.mnemonicToSeedSync(mnemonic)
  const root = bip2.fromSeed(seed, SCASH_NETWORK)
  const child = root.derivePath(ADDRESS_PATH)
  return child
}
