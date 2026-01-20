import { apiOk, apiErr } from '../../../lib/server/apiResponse'

export const runtime = 'nodejs' // 使用 Node 运行时，支持 Buffer 基础认证
export const dynamic = 'force-dynamic' // 禁止静态缓存

export async function GET(req: Request) {
  try {
    let responseTime = 0
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=satoshi-cash-network&vs_currencies=usd', {
      // 使用 Next 的数据缓存，10 分钟自动重新验证
      next: { revalidate: 600 }
    })
    responseTime = Number(res.headers.get('x-request-duration') ?? 0)
    const data = await res.json()
    const price = data['satoshi-cash-network']?.usd ?? 0
    return apiOk({ price }, 200, '获取成功', { endpoint: res.url, responseTime })
  } catch (err: any) {
    const status = err?.statusCode ?? 500
    const message = err?.message ?? '内部错误'
    return apiErr(status, message)
  }
}
