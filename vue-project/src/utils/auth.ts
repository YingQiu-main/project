export const getAccessToken = () => {
    return localStorage.getItem('accessToken')
  }
  
  export const getRefreshToken = () => {
    return localStorage.getItem('refreshToken')
  }
  
  export const setTokens = (accessToken: string, refreshToken: string) => {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
  }
  
  export const clearTokens = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('username')
    localStorage.removeItem('userId')
  }

  /**
   * 检查用户是否已登录（是否有有效的token）
   */
  export const isAuthenticated = (): boolean => {
    const token = getAccessToken()
    return !!token && token.trim() !== ''
  }