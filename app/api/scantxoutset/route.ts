import { callBitcoinRpc } from '../../../lib/server/bitcoinRpc'
import { apiOk, apiErr } from '../../../lib/server/apiResponse'

export const runtime = 'nodejs' // 使用 Node 运行时，支持 Buffer 基础认证
export const dynamic = 'force-dynamic' // 禁止静态缓存

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const address = searchParams.get('address')

  if (!address) {
    return apiErr(400, '缺少 address 参数')
  }

  try {
    const { result, endpoint, responseTime } = await callBitcoinRpc<any>('scantxoutset', ['start', [{ desc: `addr(${address})` }]])
    const message = '获取未花费交易输出成功'
    const code = 200
    return apiOk(result, code, message, { endpoint, responseTime })
  } catch (err: any) {
    const status = err?.statusCode ?? 500
    const message = err?.message ?? '内部错误'
    return apiErr(status, message)
  }
}
