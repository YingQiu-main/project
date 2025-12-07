// 单词数据类型定义
export interface Word {
  id: string // 单词唯一标识
  word: string // 单词
  translation: string // 翻译
}

// 学习模式
export type LearningMode = 'view' | 'practice' // view: 查看模式, practice: 练习模式

