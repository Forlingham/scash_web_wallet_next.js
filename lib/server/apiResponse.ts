export function apiOk<T>(rpcData: T, code = 200, message = 'OK') {
  return Response.json(
    {
      data: {
        success: true,
        rpcData,
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

