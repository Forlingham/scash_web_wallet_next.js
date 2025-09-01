// const axois = require('axios') InternalAxiosRequestConfig
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { decryptAES_Hex, encryptAES_Hex } from './cryoto'

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
        if (error?.data?.code === 500) console.error('Not connected to an available node')
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
