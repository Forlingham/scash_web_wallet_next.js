import { callBitcoinRpc } from '../../../lib/server/bitcoinRpc'
import { apiOk, apiErr } from '../../../lib/server/apiResponse'

export const runtime = 'nodejs' // 使用 Node 运行时，支持 Buffer 基础认证
export const dynamic = 'force-dynamic' // 禁止静态缓存

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  let confTarget = searchParams.get('confTarget')
  if (!confTarget) {
    confTarget = '6'
  }
  try {
    const res = await callBitcoinRpc<any>('estimatesmartfee', [Number(confTarget)])
    const message = '获取智能手续费成功'
    const code = 200
    return apiOk(res, code, message)
  } catch (err: any) {
    const status = err?.statusCode ?? 500
    const message = err?.message ?? '内部错误'
    return apiErr(status, message)
  }
}
