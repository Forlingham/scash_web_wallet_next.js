// 获取最新区块信息的示例 API（GET）
// 简介：通过 Bitcoin Core RPC 获取最新区块 hash，再查询区块详情（verbosity=2）。

import { callBitcoinRpc } from '../../../lib/server/bitcoinRpc';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const bestHash = await callBitcoinRpc<string>('getbestblockhash');
    const block = await callBitcoinRpc<any>('getblock', [bestHash, 2]);
    return Response.json({ hash: bestHash, block }, { status: 200 });
  } catch (err: any) {
    const status = err?.statusCode ?? 500;
    const message = err?.message ?? '内部错误';
    return Response.json({ error: message }, { status });
  }
}

