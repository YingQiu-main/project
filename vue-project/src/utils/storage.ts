// 本地存储工具类
// 用于管理 localStorage 的读写，提供统一的接口

const STORAGE_PREFIX = 'word_learning_'

export class StorageService {
  // 获取存储键名
  private static getKey(key: string): string {
    return `${STORAGE_PREFIX}${key}`
  }

  // 获取已掌握的单词（从 localStorage）
  static getMasteredWords(category: 'cet4' | 'cet6' = 'cet4'): Set<string> {
    try {
      const key = this.getKey(`${category}_mastered_words`)
      const stored = localStorage.getItem(key)
      return stored ? new Set(JSON.parse(stored)) : new Set()
    } catch (error) {
      console.error('读取本地存储失败:', error)
      return new Set()
    }
  }

  // 保存已掌握的单词（到 localStorage）
  static setMasteredWords(wordIds: Set<string>, category: 'cet4' | 'cet6' = 'cet4'): void {
    try {
      const key = this.getKey(`${category}_mastered_words`)
      localStorage.setItem(key, JSON.stringify(Array.from(wordIds)))
    } catch (error) {
      console.error('保存本地存储失败:', error)
    }
  }

  // 清除已掌握的单词
  static clearMasteredWords(category: 'cet4' | 'cet6' = 'cet4'): void {
    try {
      const key = this.getKey(`${category}_mastered_words`)
      localStorage.removeItem(key)
    } catch (error) {
      console.error('清除本地存储失败:', error)
    }
  }

  // 获取同步时间戳
  static getLastSyncTime(category: 'cet4' | 'cet6' = 'cet4'): number | null {
    try {
      const key = this.getKey(`${category}_last_sync`)
      const stored = localStorage.getItem(key)
      return stored ? parseInt(stored, 10) : null
    } catch {
      return null
    }
  }

  // 设置同步时间戳
  static setLastSyncTime(timestamp: number, category: 'cet4' | 'cet6' = 'cet4'): void {
    try {
      const key = this.getKey(`${category}_last_sync`)
      localStorage.setItem(key, timestamp.toString())
    } catch (error) {
      console.error('保存同步时间失败:', error)
    }
  }

  // 获取待同步的单词（本地有但未同步到后端的）
  static getPendingSyncWords(category: 'cet4' | 'cet6' = 'cet4'): Set<string> {
    try {
      const key = this.getKey(`${category}_pending_sync`)
      const stored = localStorage.getItem(key)
      return stored ? new Set(JSON.parse(stored)) : new Set()
    } catch {
      return new Set()
    }
  }

  // 添加待同步的单词
  static addPendingSyncWord(wordId: string, category: 'cet4' | 'cet6' = 'cet4'): void {
    try {
      const pending = this.getPendingSyncWords(category)
      pending.add(wordId)
      const key = this.getKey(`${category}_pending_sync`)
      localStorage.setItem(key, JSON.stringify(Array.from(pending)))
    } catch (error) {
      console.error('保存待同步单词失败:', error)
    }
  }

  // 清除待同步的单词
  static clearPendingSyncWords(wordIds: string[], category: 'cet4' | 'cet6' = 'cet4'): void {
    try {
      const pending = this.getPendingSyncWords(category)
      wordIds.forEach(id => pending.delete(id))
      const key = this.getKey(`${category}_pending_sync`)
      localStorage.setItem(key, JSON.stringify(Array.from(pending)))
    } catch (error) {
      console.error('清除待同步单词失败:', error)
    }
  }
}

