// DAP 解析工具 - 客户端专用
// 由于 scash-dap 在服务端渲染时会出现动态 require 问题，
// 我们将初始化延迟到客户端使用时

export interface DapMessage {
  content: string
  isDap: boolean
  isPureMessage: boolean // 只有 DAP 地址，没有其他接收地址
  isFromSelf: boolean // 发送者是自己
}

export interface TransactionOutput {
  scriptPubKey?: {
    address?: string
    hex?: string
  }
  addresses?: string[]
  address?: string
  value?: number
}

let dapInstance: any = null

// 初始化 DAP 实例（客户端专用）
function getDapInstance() {
  if (typeof window === 'undefined') {
    return null
  }
  
  if (!dapInstance) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const ScashDAP = require('scash-dap')
      dapInstance = new ScashDAP({
        messagePrefix: '\x18Scash Signed Message:\n',
        bech32: 'scash',
        bip32: { public: 0x0488b21e, private: 0x0488ade4 },
        pubKeyHash: 0x3c,
        scriptHash: 0x7d,
        wif: 0x80
      })
    } catch (error) {
      console.error('初始化 DAP 失败:', error)
      return null
    }
  }
  
  return dapInstance
}

// 检测地址是否为 DAP 地址
export function isDapAddress(address: string): boolean {
  const dap = getDapInstance()
  if (!dap) return false
  return dap.getProtocolType(address) !== null
}

// 解析交易中的 DAP 消息
export function parseDapMessage(
  outputs: TransactionOutput[],
  senderAddress: string,
  currentUserAddress: string
): DapMessage | null {
  if (typeof window === 'undefined') {
    return null
  }
  
  if (!outputs || outputs.length === 0) {
    return null
  }

  const dap = getDapInstance()
  if (!dap) return null

  // 找出所有的 DAP 地址
  const dapOutputs = outputs.filter(output => {
    const address = output.scriptPubKey?.address || output.address
    return address && isDapAddress(address)
  })

  if (dapOutputs.length === 0) {
    return null
  }

  // 尝试解析 DAP 数据
  try {
    const message = dap.parseDapTransaction(outputs as any)
    
    if (!message) {
      return null
    }

    // 判断是否为纯文字消息（只有 DAP 地址，没有其他接收地址）
    const normalOutputs = outputs.filter(output => {
      const address = output.scriptPubKey?.address || output.address
      return address && !isDapAddress(address)
    })

    const isPureMessage = normalOutputs.length === 0

    // 判断是否是自己发送的
    const isFromSelf = senderAddress.toLowerCase() === currentUserAddress.toLowerCase()

    return {
      content: message,
      isDap: true,
      isPureMessage,
      isFromSelf
    }
  } catch (error) {
    console.error('解析 DAP 消息失败:', error)
    return null
  }
}

// 格式化 DAP 消息显示
export function formatDapPreview(message: string, maxLength: number = 50): string {
  if (!message) return ''
  if (message.length <= maxLength) return message
  return message.substring(0, maxLength) + '...'
}
