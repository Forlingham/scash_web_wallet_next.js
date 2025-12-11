import { callBitcoinRpc } from '../../../lib/server/bitcoinRpc'
import { apiOk, apiErr } from '../../../lib/server/apiResponse'

export const runtime = 'nodejs' // 使用 Node 运行时，支持 Buffer 基础认证
export const dynamic = 'force-dynamic' // 禁止静态缓存

export async function POST(req: Request) {
  try {
    let rawtx: string | undefined

    const contentType = req.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const body = (await req.json().catch(() => ({}))) as any
      rawtx = body?.rawtx ?? body?.hex ?? body?.txHex
    } else {
      const text = await req.text().catch(() => '')
      rawtx = text?.trim()
    }

    if (!rawtx) {
      return apiErr(400, '缺少 rawtx 参数')
    }

    // 基础校验：必须是十六进制字符串
    const cleaned = rawtx.replace(/\s+/g, '')
    if (!/^[0-9a-fA-F]+$/.test(cleaned)) {
      return apiErr(400, 'rawtx 必须为十六进制字符串')
    }

    const res = await callBitcoinRpc<any>('sendrawtransaction', [cleaned])
    const message = '发送原始交易成功'
    const code = 200
    return apiOk({ txid: res }, code, message)
  } catch (err: any) {
    const status = err?.statusCode ?? 500
    const message = err?.message ?? '内部错误'
    return apiErr(status, message)
  }
}
