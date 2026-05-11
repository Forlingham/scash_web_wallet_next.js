// 轻量封装 Bitcoin Core JSON-RPC 的服务端工具（Node 运行时）
// 注释简洁：读取环境变量，构造 JSON-RPC 请求，处理结果或错误。
// 优化：支持前端传入 preferredNodeUrl，优先使用该节点；同时保留模块级变量作为 fallback。

type JsonRpcError = { code: number; message: string; data?: unknown };
type JsonRpcResponse<T> = {
  jsonrpc: '2.0';
  id: string | number;
  result?: T;
  error?: JsonRpcError;
};

type Endpoint = { url: string; user: string; password: string };

/**
 * 模块级变量：记住上次成功的节点索引（同一实例热启动期间的 fallback）。
 */
let lastSuccessfulEndpointIndex = 0;

function getEnv() {
  // 仅支持：BITCOIN_RPC_ENDPOINTS（url|user|password，逗号分隔）
  const endpointsEnv = process.env.BITCOIN_RPC_ENDPOINTS?.trim();
  const timeoutMs = Number(process.env.BITCOIN_RPC_TIMEOUT_MS || 8000);

  if (!endpointsEnv) {
    throw new Error('缺少 BITCOIN_RPC_ENDPOINTS（格式：url|user|password，逗号分隔）');
  }

  const endpoints: Endpoint[] = endpointsEnv
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean)
    .map((e) => {
      const parts = e.split('|');
      if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) {
        throw new Error(`BITCOIN_RPC_ENDPOINTS 项格式错误：${e}（需为 url|user|password）`);
      }
      return { url: parts[0].trim(), user: parts[1].trim(), password: parts[2].trim() };
    });

  if (!endpoints.length) {
    throw new Error('BITCOIN_RPC_ENDPOINTS 解析后为空，请检查配置');
  }

  return { endpoints, timeoutMs };
}

/**
 * 根据前端传入的 preferredNodeUrl 确定起始节点索引。
 * 如果匹配到则从该节点开始；否则使用模块级变量 lastSuccessfulEndpointIndex。
 */
function getStartIndex(endpoints: Endpoint[], preferredNodeUrl?: string): number {
  if (preferredNodeUrl) {
    const idx = endpoints.findIndex((ep) => ep.url === preferredNodeUrl);
    if (idx !== -1) return idx;
  }
  // fallback：使用模块级记忆
  return lastSuccessfulEndpointIndex;
}

export interface CallBitcoinRpcOptions {
  overrideTimeoutMs?: number;
  /** 前端传入的上次成功节点 URL，优先使用 */
  preferredNodeUrl?: string;
}

export async function callBitcoinRpc<T>(
  method: string,
  params: unknown[] = [],
  options?: CallBitcoinRpcOptions,
): Promise<{ result: T; endpoint: string; responseTime: number }> {
  const { endpoints, timeoutMs } = getEnv();
  const finalTimeout = options?.overrideTimeoutMs ?? timeoutMs;

  const body = { jsonrpc: '2.0', id: Date.now(), method, params };
  const attempts: { url: string; message: string; statusCode?: number }[] = [];

  const total = endpoints.length;
  // 确保 lastSuccessfulEndpointIndex 在合法范围内
  if (lastSuccessfulEndpointIndex >= total) {
    lastSuccessfulEndpointIndex = 0;
  }

  const startIndex = getStartIndex(endpoints, options?.preferredNodeUrl);

  // 从优选节点开始，循环遍历所有节点
  for (let i = 0; i < total; i++) {
    const index = (startIndex + i) % total;
    const ep = endpoints[index];

    const requestStartTime = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), finalTimeout);
    try {
      const auth = Buffer.from(`${ep.user}:${ep.password}`).toString('base64');
      const res = await fetch(ep.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
        body: JSON.stringify(body),
        cache: 'no-store',
        signal: controller.signal,
      });

      const text = await res.text();
      let json: JsonRpcResponse<T> | null = null;
      try { json = JSON.parse(text); } catch {
        const err = new Error(`RPC响应非JSON，HTTP ${res.status}`) as Error & { statusCode?: number };
        err.statusCode = res.status;
        throw err;
      }

      if (!res.ok) {
        const msg = json?.error?.message ?? `HTTP错误 ${res.status}`;
        const err = new Error(msg) as Error & { statusCode?: number; rpcError?: JsonRpcError };
        err.statusCode = res.status;
        if (json?.error) err.rpcError = json.error;
        throw err;
      }

      if (json?.error) {
        const err = new Error(json.error.message) as Error & { rpcError?: JsonRpcError };
        err.rpcError = json.error;
        throw err;
      }

      clearTimeout(timer);
      const responseTime = Date.now() - requestStartTime;

      // 记住本次成功的节点索引
      lastSuccessfulEndpointIndex = index;

      return { 
        result: json!.result as T,
        endpoint: ep.url,
        responseTime
      };
    } catch (e: any) {
      clearTimeout(timer);
      if (e?.name === 'AbortError') {
        attempts.push({ url: ep.url, message: `超时（${finalTimeout}ms）`, statusCode: 504 });
        continue;
      }
      if (e?.rpcError) throw e;
      attempts.push({ url: ep.url, message: e?.message ?? '未知错误', statusCode: e?.statusCode });
      continue;
    }
  }

  // 所有节点都失败了，重置索引
  lastSuccessfulEndpointIndex = 0;

  const details = attempts.map(a => `[${a.url}] ${a.message}`).join(' ; ');
  const err = new Error(`RPC全部失败：${details || '无详情'}`) as Error & { statusCode?: number };
  err.statusCode = 502;
  throw err;
}

/**
 * 从请求 header 中提取前端传来的优选节点 URL
 */
export function getPreferredNodeFromHeaders(req: Request): string | undefined {
  return req.headers.get('x-preferred-node') || undefined;
}
