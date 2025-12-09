import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Word } from '@/types/word'
import { apiService } from '@/services/api'

// 模拟四级单词数据（后续可以替换为真实数据）
const mockCet4Words: Word[] = [
  { id: '1', word: 'abandon', translation: '放弃，抛弃' },
  { id: '2', word: 'ability', translation: '能力，才能' },
  { id: '3', word: 'abroad', translation: '在国外，到国外' },
  { id: '4', word: 'absence', translation: '缺席，不在场' },
  { id: '5', word: 'absolute', translation: '绝对的，完全的' },
  { id: '6', word: 'absorb', translation: '吸收，吸引' },
  { id: '7', word: 'abstract', translation: '抽象的，摘要' },
  { id: '8', word: 'abundant', translation: '丰富的，充裕的' },
  { id: '9', word: 'abuse', translation: '滥用，虐待' },
  { id: '10', word: 'academic', translation: '学术的，学院的' },
]

// localStorage key
const STORAGE_KEY = 'cet4_mastered_words'
const SYNC_TIMESTAMP_KEY = 'cet4_sync_timestamp'

export const useWordStore = defineStore('word', () => {
  // 所有单词数据
  const allWords = ref<Word[]>(mockCet4Words)
  
  // 同步状态
  const isSyncing = ref(false)
  const lastSyncTime = ref<number | null>(null)
  
  // ========== localStorage 操作（离线优先） ==========
  
  /**
   * 从 localStorage 读取已掌握的单词
   */
  const getMasteredWordsFromLocal = (): Set<string> => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? new Set(JSON.parse(stored)) : new Set()
    } catch (error) {
      console.error('读取本地已掌握单词失败:', error)
      return new Set()
    }
  }
  
  /**
   * 保存已掌握的单词到 localStorage
   */
  const saveMasteredWordsToLocal = (wordIds: Set<string>) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(wordIds)))
      localStorage.setItem(SYNC_TIMESTAMP_KEY, Date.now().toString())
    } catch (error) {
      console.error('保存本地已掌握单词失败:', error)
    }
  }
  
  // ========== 后端同步操作 ==========
  
  /**
   * 从后端加载已掌握的单词
   */
  const loadMasteredWordsFromServer = async (): Promise<Set<string>> => {
    if (!apiService.isAuthenticated()) {
      return new Set()
    }
    
    try {
      const serverWordIds = await apiService.getMasteredWords()
      return new Set(serverWordIds)
    } catch (error) {
      console.error('从服务器加载已掌握单词失败:', error)
      return new Set()
    }
  }
  
  /**
   * 同步已掌握的单词到后端（静默同步，不阻塞用户操作）
   */
  const syncToServer = async (wordIds: string[]) => {
    if (!apiService.isAuthenticated() || wordIds.length === 0) {
      return
    }
    
    // 异步同步，不阻塞用户操作
    setTimeout(async () => {
      try {
        await apiService.syncMasteredWords(wordIds)
        lastSyncTime.value = Date.now()
      } catch (error) {
        console.error('同步到服务器失败:', error)
        // 可以在这里添加重试逻辑或错误提示
      }
    }, 0)
  }
  
  /**
   * 标记单个单词到后端
   */
  const markWordOnServer = async (wordId: string): Promise<boolean> => {
    if (!apiService.isAuthenticated()) {
      return false
    }
    
    try {
      return await apiService.markWordAsMastered(wordId)
    } catch (error) {
      console.error('标记单词到服务器失败:', error)
      return false
    }
  }
  
  // ========== 合并策略 ==========
  
  /**
   * 合并本地和服务器数据（取并集）
   * 这样可以确保用户在任何设备上的学习进度都不会丢失
   */
  const mergeMasteredWords = (localWords: Set<string>, serverWords: Set<string>): Set<string> => {
    const merged = new Set<string>()
    // 合并两个集合（取并集）
    localWords.forEach(id => merged.add(id))
    serverWords.forEach(id => merged.add(id))
    return merged
  }
  
  // ========== 初始化 ==========
  
  // 已掌握的单词（从 localStorage 初始化）
  const masteredWordIds = ref<Set<string>>(getMasteredWordsFromLocal())
  
  // 读取上次同步时间
  const storedSyncTime = localStorage.getItem(SYNC_TIMESTAMP_KEY)
  if (storedSyncTime) {
    lastSyncTime.value = parseInt(storedSyncTime, 10)
  }
  
  /**
   * 初始化并同步数据（应用启动时调用）
   * 1. 从 localStorage 加载本地数据
   * 2. 如果用户已登录，从服务器加载数据
   * 3. 合并两者（取并集）
   * 4. 保存合并后的数据到本地和服务器
   */
  const initialize = async () => {
    const localWords = getMasteredWordsFromLocal()
    
    // 如果用户已登录，尝试从服务器加载
    if (apiService.isAuthenticated()) {
      isSyncing.value = true
      try {
        const serverWords = await loadMasteredWordsFromServer()
        
        // 合并本地和服务器数据
        const merged = mergeMasteredWords(localWords, serverWords)
        
        // 更新状态
        masteredWordIds.value = merged
        
        // 保存到本地
        saveMasteredWordsToLocal(merged)
        
        // 如果有新数据，同步到服务器
        if (merged.size > serverWords.size) {
          const newWords = Array.from(merged).filter(id => !serverWords.has(id))
          await syncToServer(newWords)
        }
        
        lastSyncTime.value = Date.now()
      } catch (error) {
        console.error('初始化同步失败:', error)
        // 即使同步失败，也使用本地数据
        masteredWordIds.value = localWords
      } finally {
        isSyncing.value = false
      }
    } else {
      // 未登录，只使用本地数据
      masteredWordIds.value = localWords
    }
  }
  
  // ========== 业务方法 ==========
  
  // 待学习的单词（排除已掌握的）
  const learningWords = computed(() => {
    return allWords.value.filter(word => !masteredWordIds.value.has(word.id))
  })
  
  /**
   * 标记单词为已掌握
   * 1. 立即更新本地状态和 localStorage（离线优先）
   * 2. 如果用户已登录，异步同步到服务器
   */
  const markAsMastered = async (wordId: string) => {
    // 如果已经掌握，直接返回
    if (masteredWordIds.value.has(wordId)) {
      return
    }
    
    // 1. 立即更新本地
    masteredWordIds.value.add(wordId)
    saveMasteredWordsToLocal(masteredWordIds.value)
    
    // 2. 异步同步到服务器（不阻塞用户操作）
    if (apiService.isAuthenticated()) {
      markWordOnServer(wordId).catch(error => {
        console.error('同步标记单词失败:', error)
        // 即使同步失败，本地数据已经保存，用户体验不受影响
      })
    }
  }
  
  /**
   * 重置学习进度
   * 清除本地和服务器（如果已登录）的已掌握单词
   */
  const resetProgress = async () => {
    // 先保存要清除的单词ID（在清除之前）
    const wordIdsToClear = Array.from(masteredWordIds.value)
    
    // 清除本地
    masteredWordIds.value.clear()
    saveMasteredWordsToLocal(masteredWordIds.value)
    
    // 如果已登录，清除服务器数据
    if (apiService.isAuthenticated() && wordIdsToClear.length > 0) {
      try {
        // 逐个取消标记
        for (const wordId of wordIdsToClear) {
          await apiService.unmarkWordAsMastered(wordId)
        }
      } catch (error) {
        console.error('清除服务器进度失败:', error)
      }
    }
  }
  
  /**
   * 手动同步到服务器
   */
  const manualSync = async (): Promise<boolean> => {
    if (!apiService.isAuthenticated()) {
      return false
    }
    
    isSyncing.value = true
    try {
      const wordIds = Array.from(masteredWordIds.value)
      const result = await apiService.syncMasteredWords(wordIds)
      if (result.success) {
        lastSyncTime.value = Date.now()
        return true
      }
      return false
    } catch (error) {
      console.error('手动同步失败:', error)
      return false
    } finally {
      isSyncing.value = false
    }
  }
  
  // 当前章节的单词
  const setWords = (words: Word[]) => {
    allWords.value = words
  }
  
  // 获取随机单词
  const getRandomWord = (): Word | null => {
    const words = learningWords.value
    if (words.length === 0) return null
    const randomIndex = Math.floor(Math.random() * words.length)
    return words[randomIndex] || null
  }
  
  // 获取多个随机单词
  const getRandomWords = (count: number): Word[] => {
    const shuffled = [...learningWords.value].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, Math.min(count, shuffled.length))
  }
  
  return {
    // 数据
    allWords,
    learningWords,
    masteredWordIds,
    isSyncing,
    lastSyncTime,
    
    // 方法
    markAsMastered,
    resetProgress,
    setWords,
    getRandomWord,
    getRandomWords,
    initialize,
    manualSync,
  }
})

