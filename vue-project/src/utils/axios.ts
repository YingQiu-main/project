// src/utils/request.ts
import axios from 'axios'
import type { AxiosError, AxiosRequestConfig } from 'axios'

import { createDiscreteApi } from 'naive-ui'
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens
} from './auth'

/**
 * ✅ naive-ui 的 Message（不用写在组件里）
 */
const { message } = createDiscreteApi(['message'])

/**
 * ✅ axios 实例
 */
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  timeout: 10000
})

/**
 * ✅ 刷新 token 相关状态
 */
let isRefreshing = false
let failedQueue: {
  resolve: (token: string) => void
  reject: (err: any) => void
}[] = []

/**
 * ✅ 统一处理等待队列
 */
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
        reject(error)
      } else {
        resolve(token as string)
      }
  })
  failedQueue = []
}

/**
 * ✅ 请求拦截器：自动携带 accessToken
 */
request.interceptors.request.use(
  config => {
    const token = getAccessToken()
    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

/**
 * ✅ 响应拦截器：无感刷新 + 全局错误提示
 */
request.interceptors.response.use(
  response => response.data,
  async (error: AxiosError) => {
    const response = error.response
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean
    }

    /**
     * 网络错误（无 response）
     */
    if (!response) {
      message.error('网络异常，请检查网络')
      return Promise.reject(error)
    }

    /**
     * ✅ accessToken 过期（401）
     */
    if (response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      /**
       * ✅ 正在刷新 token：请求进入队列
       */
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers = originalRequest.headers || {}
              originalRequest.headers.Authorization = `Bearer ${token}`
              resolve(request(originalRequest))
            },
            reject
          })
        })
      }

      isRefreshing = true

      try {
        const refreshToken = getRefreshToken()
        if (!refreshToken) throw new Error('No refresh token')

        /**
         * ✅ 刷新 token（注意：不用 request，避免死循环）
         */
        const refreshRes = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/auth/refresh-token`,
          { refreshToken }
        )

        const {
          accessToken,
          refreshToken: newRefreshToken
        } = refreshRes.data

        /**
         * ✅ 保存新 token
         */
        setTokens(accessToken, newRefreshToken)

        /**
         * ✅ 放行队列请求
         */
        processQueue(null, accessToken)

        /**
         * ✅ 重新发起当前失败的请求
         */
        originalRequest.headers = originalRequest.headers || {}
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return request(originalRequest)
      } catch (err) {
        /**
         * ✅ refreshToken 也失效
         */
        processQueue(err, null)
        clearTokens()
        message.error('登录已过期，请重新登录')
        // 跳转到登录页（注意：这里不能直接使用router，需要在组件中处理）
        // 或者通过window.location跳转
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }

    /**
     * ✅ 其他错误提示
     */
    message.error(
      (response.data as any)?.message || '请求失败'
    )
    return Promise.reject(error)
  }
)

export default request
