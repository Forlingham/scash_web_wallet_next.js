import * as CryptoJS from 'crypto-js'

export function encryptAES(data: string, ivString: string, keyString: string) {
  const key = CryptoJS.enc.Utf8.parse(keyString)
  const iv = CryptoJS.enc.Utf8.parse(ivString)

  const encrypted = CryptoJS.AES.encrypt(data, key, { iv: iv })
  return encrypted.toString()
}

export function decryptAES(data: string, ivString: string, keyString: string) {
  const key = CryptoJS.enc.Utf8.parse(keyString)
  const iv = CryptoJS.enc.Utf8.parse(ivString)
  const decrypted = CryptoJS.AES.decrypt(data, key, { iv: iv })
  if (decrypted) {
    try {
      return decrypted.toString(CryptoJS.enc.Utf8)
    } catch (error) {
      return null
    }
  } else {
    return null
  }
}

export function stringToHex(str: string) {
  let hex = CryptoJS.enc.Hex.stringify(CryptoJS.enc.Utf8.parse(str))

  return hex
}

export function hexToString(hex: string) {
  return CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Hex.parse(hex))
}

const char = '9'
export function encryptAES_Hex(data: string, ivString: string, key: string) {
  const key1 = CryptoJS.enc.Utf8.parse(MD5(key, ''))
  const iv = CryptoJS.enc.Utf8.parse(padOrTruncateToNumber(MD5(ivString, '')))

  const encrypted = CryptoJS.AES.encrypt(data, key1, { iv: iv })
  return stringToHexAndChar(encrypted.toString())
}

export function decryptAES_Hex(data: string, ivString: string, key: string) {
  const key1 = CryptoJS.enc.Utf8.parse(MD5(key, ''))
  const iv = CryptoJS.enc.Utf8.parse(padOrTruncateToNumber(MD5(ivString, '')))
  const decrypted = CryptoJS.AES.decrypt(hexToStringAndChar(data), key1, { iv: iv })

  if (decrypted) {
    try {
      return decrypted.toString(CryptoJS.enc.Utf8)
    } catch (error) {
      return null
    }
  } else {
    return null
  }
}

export function stringToHexAndChar(str: string) {
  let hex = CryptoJS.enc.Hex.stringify(CryptoJS.enc.Utf8.parse(str))

  return `${hex.slice(0, 2)}${char}${hex.slice(2)}`
}

export function hexToStringAndChar(hex: string) {
  let str = `${hex.slice(0, 2)}${hex.slice(3)}`
  return CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Hex.parse(str))
}

export function SHA1(data: string, key: string) {
  return CryptoJS.SHA1(data + key)
    .toString()
    .toUpperCase()
}

export function SHA1_addValidate(data: string, key: string) {
  const SHA1_encrypt = SHA1(data, key).slice(-10)
  return data + SHA1_encrypt
}

export function SHA1_validate(data: string, key: string) {
  const validate = data.slice(-10)
  const has = data.substring(0, data.length - 10)
  const co_validate = SHA1(has, key).slice(-10)
  return validate === co_validate
}

export function MY_SHA1(data: string, key: string) {
  return SHA1_addValidate(SHA1(data, key), key)
}

export function SHA256(data: string, key: string) {
  return CryptoJS.SHA256(data + key)
    .toString()
    .toUpperCase()
}

export function SHA256_addValidate(data: string, key: string) {
  const SHA256_encrypt = SHA256(data, key).slice(-6)
  return data + SHA256_encrypt
}

export function SHA256_validate(data: string, key: string) {
  const validate = data.slice(-6)
  const has = data.substring(0, data.length - 6)
  const co_validate = SHA256(has, key).slice(-6)
  return validate === co_validate
}

export function MY_SHA256(data: string, key: string) {
  return SHA256_addValidate(SHA256(data, key), key)
}

function padOrTruncateToNumber(input: string, number = 16) {
  let output = input

  const lengthDifference = number - output.length

  if (lengthDifference > 0) {
    output = '7'.repeat(lengthDifference) + output
  } else if (lengthDifference < 0) {
    output = output.substring(0, number)
  }

  return output
}

export function MD5(data: string, key: string) {
  let md5 = CryptoJS.MD5(data + key).toString()
  md5 = CryptoJS.MD5(md5 + key).toString()
  return md5
}

export function MD5_addValidate(data: string, key: string) {
  const SHA1_encrypt = MD5(data, key).slice(-4)
  return data + SHA1_encrypt
}

export function MD5_validate(data: string, key: string) {
  const validate = data.slice(-4)
  const has = data.substring(0, data.length - 4)
  const co_validate = MD5(has, key).slice(-4)
  return validate === co_validate
}

export function MY_MD5(data: string, key: string) {
  return MD5_addValidate(MD5(data, key), key)
}


export function MD5_12(data: string, key: string) {
  return MD5(data, key).slice(-12)
}

export function MD5_12_addValidate(data: string, key: string) {
  const SHA1_encrypt = MD5_12(data, key).slice(-4)
  return data + SHA1_encrypt
}

export function MD5_12_validate(data: string, key: string) {
  const validate = data.slice(-4)
  const has = data.substring(0, data.length - 4)
  const co_validate = MD5_12(has, key).slice(-4)
  return validate === co_validate
}

export function MY_MD5_12(data: string, key: string) {
  return MD5_12_addValidate(MD5_12(data, key), key)
}

