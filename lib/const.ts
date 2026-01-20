const SCASH_NETWORK_MAINNET = {
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

const SCASH_NETWORK_TESTNET = {
  messagePrefix: '\x18Scash Signed Message:\n',
  bech32: 'bcrt',
  bip32: {
    public: 0x0488b21e,
    private: 0x0488ade4
  },
  pubKeyHash: 0x3c,
  scriptHash: 0x7d,
  wif: 0x80
}

export function getScashNetwork(): typeof SCASH_NETWORK_MAINNET | typeof SCASH_NETWORK_TESTNET {
  // 在客户端，process.env 通常会被 webpack 替换，不能直接打印整个 process.env 对象查看所有变量
  // 且只有以 NEXT_PUBLIC_ 开头的环境变量才能在客户端访问
  const isTestnet = process.env.NEXT_PUBLIC_BITCOIN_RPC_IS_TESTNET === 'true'
  
  if (isTestnet) {
    return SCASH_NETWORK_TESTNET
  } else {
    return SCASH_NETWORK_MAINNET
  }
}

const ARR_FEE_ADDRESS_MAINNET = 'scash1qdq0sa4wxav36k7a4gwxq3k6dk0ahpqfsz8xpvg'
const ARR_FEE_ADDRESS_TESTNET = 'bcrt1q8zlevurcf7ht49v7m83jz9v8uvqyturrg2w96t'

export function getArrFeeAddress(): string {
  const isTestnet = process.env.NEXT_PUBLIC_BITCOIN_RPC_IS_TESTNET === 'true'
  if (isTestnet) {
    return ARR_FEE_ADDRESS_TESTNET
  } else {
    return ARR_FEE_ADDRESS_MAINNET
  }
}
