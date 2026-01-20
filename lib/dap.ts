// DAP 解析工具 - 客户端专用
// 由于 scash-dap 在服务端渲染时会出现动态 require 问题，
// 我们将初始化延迟到客户端使用时

import { ARR_FEE_ADDRESS, getDapInstance, SCASH_NETWORK } from './utils'

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

// 检测地址是否为 DAP 地址
export function isDapAddress(address: string): boolean {
  const dap = getDapInstance()
  if (!dap) return false
  return dap.getProtocolType(address) !== null
}

// 安全清理 DAP 内容（防止 XSS 攻击）
// ⚠️ 重要：链上数据是公开的，可能包含恶意代码
function sanitizeDapContent(content: string): string {
  if (typeof window === 'undefined') return content

  try {
    // 使用 DOMPurify 清理 HTML，只保留纯文本
    // ALLOWED_TAGS 为空数组表示不允许任何 HTML 标签
    // ALLOWED_ATTR 为空数组表示不允许任何属性
    const DOMPurify = require('dompurify')
    return DOMPurify.sanitize(content, {
      ALLOWED_TAGS: [], // 不允许任何 HTML 标签
      ALLOWED_ATTR: [], // 不允许任何属性
      ALLOW_DATA_ATTR: false
    })
  } catch (error) {
    // 如果 DOMPurify 失败，使用纯文本处理作为后备
    const div = document.createElement('div')
    div.textContent = content
    return div.innerText || content
  }
}

// 解析交易中的 DAP 消息
export function parseDapMessage(outputs: TransactionOutput[], senderAddress: string, currentUserAddress: string): DapMessage | null {
  if (typeof window === 'undefined') {
    return null
  }

  if (!outputs || outputs.length === 0) {
    return null
  }

  const dap = getDapInstance()
  if (!dap) return null

  // 找出所有的 DAP 地址
  const dapOutputs = outputs.filter((output) => {
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
    const normalOutputs = outputs.filter((output) => {
      const address = output.scriptPubKey?.address || output.address
      if (address === ARR_FEE_ADDRESS) return false
      return address && !isDapAddress(address)
    })

    const isPureMessage = normalOutputs.length === 0

    // 判断是否是自己发送的
    const isFromSelf = senderAddress.toLowerCase() === currentUserAddress.toLowerCase()

    // ⚠️ 重要：对内容进行 XSS 清理
    const sanitizedContent = sanitizeDapContent(message)

    return {
      content: sanitizedContent,
      isDap: true,
      isPureMessage,
      isFromSelf
    }
  } catch (error) {
    console.error('解析 DAP 消息失败:', error)
    return null
  }
}

// 格式化 DAP 消息显示（不进行 HTML 解析，直接显示纯文本）
export function formatDapPreview(message: string, maxLength: number = 50): string {
  if (!message) return ''
  // 确保 message 是纯文本，不包含任何 HTML
  const sanitized = sanitizeDapContent(message)
  if (sanitized.length <= maxLength) return sanitized
  return sanitized.substring(0, maxLength) + '...'
}
