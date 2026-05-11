// const axois = require('axios') InternalAxiosRequestConfig
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { decryptAES_Hex, encryptAES_Hex } from './cryoto'

const PREFERRED_NODE_KEY = 'scash_preferred_rpc_node'

/**
 * 从 localStorage 获取上次成功的 RPC 节点 URL
 */
function getPreferredNode(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(PREFERRED_NODE_KEY)
  } catch {
    return null
  }
}

/**
 * 将成功的 RPC 节点 URL 保存到 localStorage
 */
function setPreferredNode(nodeUrl: string): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(PREFERRED_NODE_KEY, nodeUrl)
  } catch {
    // localStorage 不可用时静默忽略
  }
}

export class AxiosTool {
  protected instance: AxiosInstance

  constructor(config: AxiosRequestConfig) {
    this.instance = axios.create(config)
    this.interceptors()
  }

  private interceptors() {
    this.interceptorsRequest()
    this.interceptorsResponse()
  }

  private interceptorsRequest() {
    this.instance.interceptors.request.use(
      (config: any) => {
        const iv = Date.now() + ''
        config.headers.time = iv

        // 从 localStorage 读取上次成功的节点 URL，添加到请求 header
        const preferredNode = getPreferredNode()
        if (preferredNode) {
          config.headers['x-preferred-node'] = preferredNode
        }

        if (config && config.method === 'post' && !(config.data instanceof FormData)) {
          // const encryptedData = encryptAES_Hex(JSON.stringify(config.data), iv, process.env.AES_KEY)
          // config.data = encryptedData
        }

        return config
      },
      (error: any) => {
        return Promise.reject(error)
      }
    )
  }

  private interceptorsResponse() {
    this.instance.interceptors.response.use(
      (response) => {
        const data = this.decryptData(response)

        // 从响应中提取成功的节点 URL 并保存到 localStorage
        const nodeEndpoint = data?.data?.data?.nodeInfo?.endpoint
        if (nodeEndpoint) {
          setPreferredNode(nodeEndpoint)
        }

        if (data.data.code === 205) {
          throw data
        }
        return data
      },
      (err) => {
        throw this.decryptData(err.response)
      }
    )
  }

  private decryptData(response: AxiosResponse<any, any>): AxiosResponse<any, any> {
    if (!response) {
      // 创建一个默认的AxiosResponse对象
      return {
        data: null,
        status: 0,
        statusText: '',
        headers: {},
        config: {} as any
      } as AxiosResponse<any, any>
    }

    if (response.config.responseType === 'blob') {
      return response
    }

    if (response && response.data) {
      // const iv = response.headers.time
      // if (iv) {
      //   const encryptedData = decryptAES_Hex(response.data, iv, process.env.AES_KEY)
      //   if (encryptedData) {
      //     const data = JSON.parse(encryptedData)
      //     response.data = data
      //   }
      // }
    }

    if (process.env.NODE_ENV === 'development') {
      // console.log(response.data, 'data')
    }
    return response
  }

  public async request<T = any>(config: AxiosRequestConfig) {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await this.instance.request(config)
        resolve(response.data)
      } catch (error: any) {
        if (process.env.NODE_ENV === 'development') {
          console.log(error.data)
        }
        reject(error)
      }
    }) as Promise<ApiData<T>>
  }

  public async get<T = any>(url: string, params?: Record<string, any>, config?: AxiosRequestConfig) {
    return this.request<T>({
      method: 'get',
      url,
      params,
      ...config
    })
  }

  public async post<T = any>(url: string, data: Record<string, any>, config?: AxiosRequestConfig) {
    return this.request<T>({
      method: 'post',
      url,
      data,
      ...config
    })
  }
}

export default new AxiosTool({
  baseURL: '/api/',
  timeout: 30000
})
