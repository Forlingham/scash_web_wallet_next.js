// Next.js App Router API 路由：代理到 Bitcoin Core RPC
// 简介：接受 { method, params }，服务端调用并返回结果。

import { NextRequest } from 'next/server';
import { callBitcoinRpc } from '../../../lib/server/bitcoinRpc';

export const runtime = 'nodejs'; // 使用 Node 运行时，支持 Buffer 基础认证
export const dynamic = 'force-dynamic'; // 禁止静态缓存

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const method = payload?.method;
    const params = Array.isArray(payload?.params) ? payload.params : [];

    if (!method || typeof method !== 'string') {
      return Response.json({ error: '缺少或非法的 method' }, { status: 400 });
    }

    const result = await callBitcoinRpc<any>(method, params);
    return Response.json({ result }, { status: 200 });
  } catch (err: any) {
    const status = err?.statusCode ?? 500;
    const message = err?.message ?? '内部错误';
    return Response.json({ error: message }, { status });
  }
}

