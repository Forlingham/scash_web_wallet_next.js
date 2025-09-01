import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { decryptAES, encryptAES, hexToString, MD5, stringToHex } from './cryoto'
import Decimal from 'decimal.js'
import { bech32 } from 'bech32'
import * as bitcoin from 'bitcoinjs-lib'
import { Unspent } from './api'
import { BIP32Interface } from 'bip32'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const VERSION = '1.0'

export const NAME_TOKEN = 'SCASH'

export const SCASH_NETWORK = {
  messagePrefix: '\x18Scash Signed Message:\n',
  bech32: 'scash',
  bip32: {
    public: 0x0488b21e,
    private: 0x0488ade4
  },
  pubKeyHash: 0x3c,
  scriptHash: 0x7d,
  wif: 0x80
}

export const explorerUrl1 = 'https://scash.one/'
export const explorerUrl2 = 'https://scash.tv/'

export function onOpenExplorer(network: string, type: string, id: string) {
  if (network === '1') {
    window.open(`${explorerUrl1}${type}/${id}`)
  } else {
    window.open(`${explorerUrl2}${type}/${id}`)
  }
}

export const ARR_FEE_ADDRESS = 'scash1qdq0sa4wxav36k7a4gwxq3k6dk0ahpqfsz8xpvg'
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

export function downloadWalletFile(encryptedWallet: string) {
  // Create mock encrypted wallet file
  const walletData: WalletFileData = {
    version: VERSION,
    encrypted: true,
    data: encryptedWallet,
    timestamp: Date.now()
  }

  const blob = new Blob([JSON.stringify(walletData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'scash-wallet.json'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
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

    if (decoded.prefix !== 'scash') {
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
  const suffix = str.slice(-4)
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
