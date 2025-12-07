// API 服务层
// 用于与后端通信，管理用户学习进度

export interface ApiConfig {
  baseURL?: string
  timeout?: number
}

export interface UserProgress {
  userId?: string
  wordId: string
  mastered: boolean
  masteredAt?: string
}

export interface SyncResponse {
  success: boolean
  message?: string
  data?: {
    masteredWords: string[]
  }
}

class ApiService {
  private baseURL: string
  private timeout: number

  constructor(config: ApiConfig = {}) {
    // 可以从环境变量读取 API 地址
    this.baseURL = config.baseURL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
    this.timeout = config.timeout || 10000
  }

  // 获取认证 token（从 localStorage 或 cookie）
  private getAuthToken(): string | null {
    return localStorage.getItem('auth_token') || null
  }

  // 检查用户是否已登录
  isAuthenticated(): boolean {
    return !!this.getAuthToken()
  }

  // 通用请求方法
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    const token = this.getAuthToken()

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('请求超时')
      }
      throw error
    }
  }

  // 获取用户已掌握的单词列表
  async getMasteredWords(userId?: string): Promise<string[]> {
    if (!this.isAuthenticated()) {
      return []
    }

    try {
      const endpoint = userId ? `/users/${userId}/mastered-words` : '/user/mastered-words'
      const response = await this.request<{ data: string[] }>(endpoint)
      return response.data || []
    } catch (error) {
      console.error('获取已掌握单词失败:', error)
      return []
    }
  }

  // 同步已掌握的单词到后端
  async syncMasteredWords(wordIds: string[]): Promise<SyncResponse> {
    if (!this.isAuthenticated()) {
      return { success: false, message: '用户未登录' }
    }

    try {
      const response = await this.request<SyncResponse>('/user/mastered-words/sync', {
        method: 'POST',
        body: JSON.stringify({ wordIds }),
      })
      return response
    } catch (error) {
      console.error('同步已掌握单词失败:', error)
      return { success: false, message: error instanceof Error ? error.message : '同步失败' }
    }
  }

  // 标记单词为已掌握
  async markWordAsMastered(wordId: string): Promise<boolean> {
    if (!this.isAuthenticated()) {
      return false
    }

    try {
      const response = await this.request<{ success: boolean }>('/user/mastered-words', {
        method: 'POST',
        body: JSON.stringify({ wordId }),
      })
      return response.success
    } catch (error) {
      console.error('标记单词失败:', error)
      return false
    }
  }

  // 取消标记单词（重置为未掌握）
  async unmarkWordAsMastered(wordId: string): Promise<boolean> {
    if (!this.isAuthenticated()) {
      return false
    }

    try {
      const response = await this.request<{ success: boolean }>(`/user/mastered-words/${wordId}`, {
        method: 'DELETE',
      })
      return response.success
    } catch (error) {
      console.error('取消标记单词失败:', error)
      return false
    }
  }

  // 获取单词列表（从后端）
  async getWords(category: 'cet4' | 'cet6' = 'cet4'): Promise<any[]> {
    try {
      const response = await this.request<{ data: any[] }>(`/words/${category}`)
      return response.data || []
    } catch (error) {
      console.error('获取单词列表失败:', error)
      return []
    }
  }
}

// 导出单例
export const apiService = new ApiService()

