export function apiOk<T>(rpcData: T, code = 200, message = 'OK', nodeInfo?: { endpoint: string; responseTime: number }) {
  return Response.json(
    {
      data: {
        success: true,
        rpcData,
        nodeInfo, // 添加节点信息
      },
      code,
      message,
    },
    { status: code }
  )
}

export function apiErr(status = 500, message = 'Error', rpcData: any = {}) {
  return Response.json(
    {
      data: {
        success: false,
        rpcData,
      },
      code: status,
      message,
    },
    { status }
  )
}
