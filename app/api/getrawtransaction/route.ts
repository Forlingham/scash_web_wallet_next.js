import { callBitcoinRpc } from '../../../lib/server/bitcoinRpc'
import { apiOk, apiErr } from '../../../lib/server/apiResponse'

export const runtime = 'nodejs' // 使用 Node 运行时，支持 Buffer 基础认证
export const dynamic = 'force-dynamic' // 禁止静态缓存

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const txid = searchParams.get('txid')

  if (!txid) {
    return apiErr(400, '缺少 txid 参数')
  }

  try {
    const res = await callBitcoinRpc<any>('getrawtransaction', [txid, true])
    const message = `获取原始交易 ${txid} 成功`
    const code = 200
    return apiOk(res, code, message)
  } catch (err: any) {
    const status = err?.statusCode ?? 500
    const message = err?.message ?? '内部错误'
    return apiErr(status, message)
  }
}
