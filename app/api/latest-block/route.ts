// 获取最新区块信息的示例 API（GET）
// 简介：通过 Bitcoin Core RPC 获取最新区块 hash，再查询区块详情（verbosity=2）。

import { callBitcoinRpc, getPreferredNodeFromHeaders } from '../../../lib/server/bitcoinRpc';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const preferredNodeUrl = getPreferredNodeFromHeaders(req);
    const bestHashResult = await callBitcoinRpc<string>('getbestblockhash', [], { preferredNodeUrl });
    const block = await callBitcoinRpc<any>('getblock', [bestHashResult.result, 2], { preferredNodeUrl });
    return Response.json({ hash: bestHashResult.result, block: block.result }, { status: 200 });
  } catch (err: any) {
    const status = err?.statusCode ?? 500;
    const message = err?.message ?? '内部错误';
    return Response.json({ error: message }, { status });
  }
}
