// 单词数据类型定义
export interface Word {
  id: number | string // 单词唯一标识
  word?: string // 单词（兼容旧字段）
  text?: string // 单词（新字段）
  phonetic?: string // 音标
  translation: string // 翻译
  isMastered?: number // 是否已掌握 0-未掌握 1-已掌握
  lastPracticedAt?: string | null // 最后练习时间
}

// 章节单词响应类型
export interface ChapterWordsResponse {
  chapter: {
    id: number
    name: string
    order_index: number
    word_count: number
  }
  words: Word[]
}

// 学习模式
export type LearningMode = 'view' | 'practice' // view: 查看模式, practice: 练习模式

