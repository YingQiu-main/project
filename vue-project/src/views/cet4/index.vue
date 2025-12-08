<template>
    <div class="cet4-container">
        <!-- 章节选择对话框 -->
        <ChapterSelectDialog v-model="showChapterDialog" @select="handleChapterSelect" />

        <!-- 查看模式：单单词显示 -->
        <div v-if="mode === 'view'" class="view-mode">
            <div v-if="currentWord" class="word-display-wrapper">
                <!-- 章节信息 -->
                <div v-if="currentChapter" class="chapter-info-header">
                    <h3 class="chapter-title">{{ currentChapter.name }}</h3>
                    <span class="chapter-word-count">共 {{ currentChapter.word_count }} 个单词</span>
                </div>

                <!-- 上一个和下一个单词预览 -->
                <div class="word-preview-row">
                    <div class="word-preview prev-word" v-if="prevWord" @click="goToPrevWord">
                        <span class="preview-label">上一个</span>
                        <span class="preview-word">{{ prevWord.text }}</span>
                    </div>
                    <div class="word-preview next-word" v-if="nextWord" @click="goToNextWord">
                        <span class="preview-label">下一个</span>
                        <span class="preview-word">{{ nextWord.text }}</span>
                    </div>
                </div>

                <!-- 当前单词 -->
                <WordComponent :word="currentWord" />

                <!-- 学习进度和时间信息框 -->
                <div class="info-box">
                    <div class="info-item">
                        <span class="info-label">学习进度</span>
                        <span class="info-value">{{ progressText }}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">学习时间</span>
                        <span class="info-value">{{ formatTime(studyTime) }}</span>
                    </div>
                    <n-button class="back-button" @click="goBack">
                        返回首页
                    </n-button>
                    <n-button class="select-chapter-button" @click="showChapterDialog = true">
                        选择章节
                    </n-button>
                    <n-button class="start-exam-button" @click="handleStartExamClick" v-if="currentWords.length > 0">
                        开始检验
                    </n-button>
                </div>
            </div>
            <div v-else class="no-words">
                <n-empty description="请选择章节开始学习">
                    <template #extra>
                        <n-button type="primary" @click="showChapterDialog = true">选择章节</n-button>
                    </template>
                </n-empty>
            </div>
        </div>

        <!-- 考试模式：拼写检验 -->
        <div v-if="mode === 'exam'" class="exam-mode">
            <div v-if="currentExamWord" class="exam-card">
                <div class="exam-header">
                    <span class="exam-progress">
                        {{ examIndex + 1 }} / {{ examWords.length }}
                    </span>
                </div>

                <!-- 上一个和下一个单词预览（显示翻译） -->
                <div class="word-preview-row">
                    <div class="word-preview prev-word" v-if="examPrevWord" @click="goToPrevExamWord">
                        <span class="preview-label">上一个</span>
                        <span class="preview-word">{{ examPrevWord.translation }}</span>
                    </div>
                    <div class="word-preview next-word" v-if="examNextWord" @click="goToNextExamWord">
                        <span class="preview-label">下一个</span>
                        <span class="preview-word">{{ examNextWord.translation }}</span>
                    </div>
                </div>

                <div class="exam-content">
                    <div class="translation-display">
                        <p class="translation-label">翻译：</p>
                        <h2 class="translation-text">{{ currentExamWord.translation }}</h2>
                    </div>
                    <div class="word-input-display">
                        <div class="underline-container">
                            <span
                                v-for="(char, index) in currentExamWord.text"
                                :key="index"
                                class="underline-char"
                            >
                                {{ userInputArray[index] || '_' }}
                            </span>
                        </div>
                    </div>
                    <div v-if="showExamFeedback" class="exam-feedback">
                        <n-alert :type="isExamCorrect ? 'success' : 'error'" :title="isExamCorrect ? '回答正确！' : '回答错误'">
                            <template v-if="!isExamCorrect">
                                <p>正确答案：<strong>{{ currentExamWord.text }}</strong></p>
                                <p>请使用退格键修改后继续</p>
                            </template>
                        </n-alert>
                    </div>
                </div>

                <!-- 学习进度和时间信息框 -->
                <div class="info-box">
                    <div class="info-item">
                        <span class="info-label">学习进度</span>
                        <span class="info-value">{{ examProgressText }}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">学习时间</span>
                        <span class="info-value">{{ formatTime(studyTime) }}</span>
                    </div>
                    <n-button class="back-button" @click="exitExam">
                        退出检验
                    </n-button>
                </div>
            </div>
            <div v-else class="exam-complete">
                <n-result status="success" title="检验完成！">
                    <template #footer>
                        <n-button type="primary" @click="submitExamResults">提交结果</n-button>
                        <n-button @click="exitExam">返回学习</n-button>
                    </template>
                </n-result>
            </div>
        </div>

        <!-- 练习模式：只显示翻译，让用户输入单词 -->
        <div v-if="mode === 'practice'" class="practice-mode">
            <div v-if="currentPracticeWord" class="practice-card">
                <div class="practice-header">
                    <span class="practice-progress">
                        {{ practiceIndex + 1 }} / {{ practiceWords.length }}
                    </span>
                </div>
                <div class="practice-content">
                    <div class="translation-display">
                        <p class="translation-label">翻译：</p>
                        <h2 class="translation-text">{{ currentPracticeWord.translation }}</h2>
                    </div>
                    <div class="input-section">
                        <n-input v-model:value="userInput" size="large" placeholder="请输入英文单词" :status="inputStatus"
                            @keyup.enter="checkAnswer" :disabled="isChecking" class="word-input" />
                        <div class="input-actions">
                            <n-button circle size="large" @click="playPronunciation(currentPracticeWord.text || '')"
                                :disabled="!speechSynthesisSupported">
                                <template #icon>
                                    <span>🔊</span>
                                </template>
                            </n-button>
                            <n-button type="primary" size="large" @click="checkAnswer"
                                :disabled="!userInput.trim() || isChecking">
                                提交
                            </n-button>
                        </div>
                    </div>
                    <div v-if="showAnswer" class="answer-feedback">
                        <n-alert :type="isCorrect ? 'success' : 'error'" :title="isCorrect ? '回答正确！' : '回答错误'">
                            <template v-if="!isCorrect">
                                <p>正确答案：<strong>{{ currentPracticeWord.text }}</strong></p>
                                <p>这个单词将继续出现在练习中</p>
                            </template>
                            <template v-else>
                                <p>恭喜！这个单词已掌握，将不再出现</p>
                            </template>
                        </n-alert>
                    </div>
                </div>
            </div>
            <div v-else class="practice-complete">
                <n-result status="success" title="练习完成！">
                    <template #footer>
                        <n-button type="primary" @click="backToView">继续学习</n-button>
                    </template>
                </n-result>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useWordStore } from '@/stores/wordStore'
import type { Word } from '@/types/word'
import {
    NButton,
    NInput,
    NAlert,
    NResult,
    NEmpty,
    useMessage,
    useDialog
} from 'naive-ui'
import WordComponent from './word.vue'
import ChapterSelectDialog from '@/components/ChapterSelectDialog.vue'
import request from '@/utils/axios'

const router = useRouter()
const wordStore = useWordStore()
const message = useMessage()
const dialog = useDialog()

// 章节选择对话框
const showChapterDialog = ref(false)

// 当前章节信息
const currentChapter = ref<{
    id: number
    name: string
    order_index: number
    word_count: number
} | null>(null)

// 学习模式
const mode = ref<'view' | 'practice' | 'exam'>('view')


// 查看模式相关
const wordsPerPage = ref(10)
const currentWords = ref<Word[]>([])
const currentWordIndex = ref(0)

// 学习时间统计
const studyTime = ref(0) // 秒
let studyTimer: number | null = null

// 语音合成支持
const speechSynthesisSupported = ref(false)

// 计算属性
const currentWord = computed(() => {
    if (currentWords.value.length === 0 || currentWordIndex.value >= currentWords.value.length) {
        return null
    }
    return currentWords.value[currentWordIndex.value]
})

const prevWord = computed(() => {
    if (currentWordIndex.value > 0) {
        return currentWords.value[currentWordIndex.value - 1]
    }
    return null
})

const nextWord = computed(() => {
    if (currentWordIndex.value < currentWords.value.length - 1) {
        return currentWords.value[currentWordIndex.value + 1]
    }
    return null
})

const progressText = computed(() => {
    const total = wordStore.allWords.length
    const mastered = wordStore.masteredWordIds.size
    const learning = wordStore.learningWords.length
    return `${mastered}/${total} (待学习: ${learning})`
})

// 考试模式相关
const examWords = ref<Word[]>([])
const examIndex = ref(0)
const examResults = ref<Array<{ wordId: number; isMastered: number }>>([])
const userInputArray = ref<string[]>([])
const showExamFeedback = ref(false)
const isExamCorrect = ref(false)

const currentExamWord = computed(() => {
    if (examIndex.value >= examWords.value.length) return null
    return examWords.value[examIndex.value]
})

const examPrevWord = computed(() => {
    if (examIndex.value > 0) {
        return examWords.value[examIndex.value - 1]
    }
    return null
})

const examNextWord = computed(() => {
    if (examIndex.value < examWords.value.length - 1) {
        return examWords.value[examIndex.value + 1]
    }
    return null
})

const examProgressText = computed(() => {
    const correct = examResults.value.filter(r => r.isMastered === 1).length
    return `${correct}/${examWords.value.length}`
})

// 练习模式相关
const practiceWords = ref<Word[]>([])
const practiceIndex = ref(0)
const currentPracticeWord = computed(() => {
    if (practiceIndex.value >= practiceWords.value.length) return null
    return practiceWords.value[practiceIndex.value]
})
const userInput = ref('')
const isChecking = ref(false)
const showAnswer = ref(false)
const isCorrect = ref(false)
const inputStatus = ref<'success' | 'error' | 'warning' | undefined>(undefined)

// 格式化时间
const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

// 开始计时
const startTimer = () => {
    if (studyTimer) return
    studyTimer = window.setInterval(() => {
        studyTime.value++
    }, 1000)
}

// 停止计时
const stopTimer = () => {
    if (studyTimer) {
        clearInterval(studyTimer)
        studyTimer = null
    }
}

// 加载单词
const loadWords = () => {
    currentWords.value = wordStore.getRandomWords(wordsPerPage.value)
    currentWordIndex.value = 0
    if (currentWords.value.length === 0) {
        currentWordIndex.value = -1
    }
}

// 切换到上一个单词
const goToPrevWord = () => {
    if (currentWordIndex.value > 0) {
        currentWordIndex.value--
    }
}

// 切换到下一个单词
const goToNextWord = () => {
    if (currentWordIndex.value < currentWords.value.length - 1) {
        currentWordIndex.value++
    }
    // 不再自动加载更多，因为单词列表已经完整加载
}

// 键盘导航
const handleKeyDown = (e: KeyboardEvent) => {
    if (mode.value !== 'view') return

    if (e.key === 'ArrowLeft') {
        goToPrevWord()
    } else if (e.key === 'ArrowRight') {
        goToNextWord()
    }
}

// 处理章节选择
const handleChapterSelect = async (chapterId: number) => {
    try {
        const response: any = await request.get(`/api/words/chapters/${chapterId}`)
        
        if (response && response.chapter && response.words) {
            currentChapter.value = response.chapter
            
            // 转换单词数据格式
            const words: Word[] = response.words.map((w: any) => ({
                id: w.id,
                text: w.text,
                phonetic: w.phonetic,
                translation: w.translation,
                isMastered: w.isMastered,
                lastPracticedAt: w.lastPracticedAt
            }))
            
            // 按返回的顺序设置单词
            currentWords.value = words
            currentWordIndex.value = 0
            
            // 更新wordStore
            wordStore.setWords(words)
            
            if (words.length === 0) {
                message.warning('该章节暂无单词')
                currentWordIndex.value = -1
            } else {
                message.success(`已加载 ${words.length} 个单词`)
                startTimer()
            }
        } else {
            message.error('获取单词列表失败')
        }
    } catch (error: any) {
        console.error('获取章节单词失败:', error)
        message.error(error?.response?.data?.message || '获取单词列表失败')
    }
}

// 初始化
onMounted(async () => {
    speechSynthesisSupported.value = 'speechSynthesis' in window
    
    // 从路由参数获取章节ID
    const chapterId = router.currentRoute.value.query.chapterId
    if (chapterId) {
        // 如果有章节ID，直接加载该章节的单词
        await handleChapterSelect(Number(chapterId))
    } else {
        // 如果没有章节ID，显示章节选择对话框
        showChapterDialog.value = true
    }
    
    window.addEventListener('keydown', handleKeyDown)
})

// 组件卸载时清理
onUnmounted(() => {
    stopTimer()
    window.removeEventListener('keydown', handleKeyDown)
    window.removeEventListener('keydown', handleExamKeyDown)
})

// 检查答案
const checkAnswer = () => {
    if (!currentPracticeWord.value || !userInput.value.trim()) return

    isChecking.value = true
    const userAnswer = userInput.value.trim().toLowerCase()
    const correctAnswer = (currentPracticeWord.value.text || '').toLowerCase()

    isCorrect.value = userAnswer === correctAnswer
    inputStatus.value = isCorrect.value ? 'success' : 'error'
    showAnswer.value = true

    if (isCorrect.value) {
        wordStore.markAsMastered(String(currentPracticeWord.value.id))
    }

    setTimeout(() => {
        nextPracticeWord()
    }, 2000)
}

// 下一个单词（练习模式）
const nextPracticeWord = () => {
    practiceIndex.value++
    userInput.value = ''
    showAnswer.value = false
    inputStatus.value = undefined
    isChecking.value = false

    if (practiceIndex.value >= practiceWords.value.length) {
        practiceWords.value = []
    }
}

// 返回查看模式
const backToView = () => {
    mode.value = 'view'
    currentWords.value = []
    currentWordIndex.value = 0
    loadWords()
    startTimer()
}

// 播放单词读音
const playPronunciation = (word: string) => {
    if (!speechSynthesisSupported.value) {
        message.warning('您的浏览器不支持语音合成功能')
        return
    }

    const utterance = new SpeechSynthesisUtterance(word)
    utterance.lang = 'en-US'
    utterance.rate = 0.8
    speechSynthesis.speak(utterance)
}

// 返回首页
const goBack = () => {
    router.push('/')
}

// 开始检验
const startExam = () => {
    if (!currentChapter.value || currentWords.value.length === 0) {
        message.warning('请先选择章节')
        return
    }

    // 打乱单词顺序
    const shuffled = [...currentWords.value].sort(() => Math.random() - 0.5)
    examWords.value = shuffled
    examIndex.value = 0
    examResults.value = []
    userInputArray.value = []
    showExamFeedback.value = false
    isExamCorrect.value = false

    // 初始化第一个单词的输入数组
    const firstWord = examWords.value[0]
    if (firstWord && firstWord.text) {
        userInputArray.value = new Array(firstWord.text.length).fill('')
    }

    mode.value = 'exam'
}

// 显示开始检验确认对话框
const handleStartExamClick = () => {
    dialog.warning({
        title: '开始检验',
        content: '确定要开始检验吗？检验将测试您对该章节单词的掌握程度。',
        positiveText: '确定',
        negativeText: '取消',
        onPositiveClick: () => {
            startExam()
            return true
        }
    })
}

// 处理键盘输入（考试模式）
const handleExamKeyDown = (e: KeyboardEvent) => {
    if (mode.value !== 'exam' || !currentExamWord.value) return

    // 只处理字母和退格键
    if (e.key === 'Backspace') {
        e.preventDefault()
        // 从后往前清除
        for (let i = userInputArray.value.length - 1; i >= 0; i--) {
            if (userInputArray.value[i]) {
                userInputArray.value[i] = ''
                break
            }
        }
        showExamFeedback.value = false
    } else if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault()
        // 找到第一个空位置填入
        for (let i = 0; i < userInputArray.value.length; i++) {
            if (!userInputArray.value[i]) {
                userInputArray.value[i] = e.key.toLowerCase()
                break
            }
        }
        showExamFeedback.value = false

        // 检查是否填满
        if (userInputArray.value.every(char => char !== '')) {
            checkExamAnswer()
        }
    }
}

// 检查考试答案
const checkExamAnswer = () => {
    if (!currentExamWord.value || !currentExamWord.value.text) return

    const userAnswer = userInputArray.value.join('').toLowerCase()
    const correctAnswer = currentExamWord.value.text.toLowerCase()

    isExamCorrect.value = userAnswer === correctAnswer

    // 记录结果
    const wordId = Number(currentExamWord.value.id)
    const existingIndex = examResults.value.findIndex(r => r.wordId === wordId)
    const result = {
        wordId: wordId,
        isMastered: isExamCorrect.value ? 1 : 0
    }

    if (existingIndex >= 0) {
        examResults.value[existingIndex] = result
    } else {
        examResults.value.push(result)
    }

    if (isExamCorrect.value) {
        showExamFeedback.value = true
        // 1秒后进入下一个单词
        setTimeout(() => {
            nextExamWord()
        }, 1000)
    } else {
        showExamFeedback.value = true
        // 错误时不自动清除，让用户自己修改
    }
}

// 下一个考试单词
const nextExamWord = () => {
    if (examIndex.value < examWords.value.length - 1) {
        examIndex.value++
        // 重置输入数组
        if (currentExamWord.value && currentExamWord.value.text) {
            userInputArray.value = new Array(currentExamWord.value.text.length).fill('')
        }
        showExamFeedback.value = false
        isExamCorrect.value = false
    }
}

// 上一个考试单词
const goToPrevExamWord = () => {
    if (examIndex.value > 0) {
        examIndex.value--
        // 重置输入数组
        if (currentExamWord.value && currentExamWord.value.text) {
            userInputArray.value = new Array(currentExamWord.value.text.length).fill('')
        }
        showExamFeedback.value = false
        isExamCorrect.value = false
    }
}

// 下一个考试单词（点击按钮）
const goToNextExamWord = () => {
    if (examIndex.value < examWords.value.length - 1) {
        // 如果当前单词还没记录结果，记录为未掌握
        if (currentExamWord.value) {
            const wordId = Number(currentExamWord.value.id)
            const existingIndex = examResults.value.findIndex(r => r.wordId === wordId)
            if (existingIndex < 0) {
                examResults.value.push({
                    wordId: wordId,
                    isMastered: 0
                })
            }
        }
        nextExamWord()
    }
}

// 退出考试模式
const exitExam = () => {
    mode.value = 'view'
    examWords.value = []
    examIndex.value = 0
    userInputArray.value = []
    showExamFeedback.value = false
    isExamCorrect.value = false
}

// 提交考试结果
const submitExamResults = async () => {
    if (!currentChapter.value) {
        message.error('章节信息丢失')
        return
    }

    try {
        // 确保所有单词都有结果记录
        examWords.value.forEach(word => {
            const wordId = Number(word.id)
            const existingIndex = examResults.value.findIndex(r => r.wordId === wordId)
            if (existingIndex < 0) {
                examResults.value.push({
                    wordId: wordId,
                    isMastered: 0
                })
            }
        })

        await request.post(`/api/words/chapters/${currentChapter.value.id}/practice`, {
            results: examResults.value
        })

        message.success('检验结果已提交')
        exitExam()
    } catch (error: any) {
        console.error('提交检验结果失败:', error)
        message.error(error?.response?.data?.message || '提交失败，请稍后重试')
    }
}
</script>

<style scoped>
.cet4-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    padding: 24px;
    background: #fff;
    position: relative;
}


/* 查看模式样式 */
.view-mode {
    width: 100%;
    max-width: 900px;
    padding: 80px 40px 40px;
    min-height: 500px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

.word-display-wrapper {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 60px;
}

/* 单词预览行 */
.word-preview-row {
    display: flex;
    justify-content: flex-end;
    align-items: flex-start;
    width: 100%;
    gap: 12px;
    min-height: 60px;
    margin-bottom: 40px;
    position: relative;
}

.word-preview {
    padding: 8px 16px;
    background: #f5f5f5;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    flex-direction: column;
    gap: 4px;
    text-align: center;
    border: none;
    min-width: 80px;
}

.word-preview.prev-word {
    position: absolute;
    left: 0;
}

.word-preview:hover {
    background: #e8e8e8;
}

.preview-label {
    font-size: 11px;
    color: #999;
    font-weight: 400;
}

.preview-word {
    font-size: 14px;
    font-weight: 500;
    color: #666;
}

/* 信息框 */
.info-box {
    width: 100%;
    padding: 20px;
    background: transparent;
    border: none;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 60px;
    flex-wrap: wrap;
}

.info-box .back-button {
    background: #667eea;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.info-box .back-button:hover {
    background: #5568d3;
}

.info-box .select-chapter-button {
    background: #18a058;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.info-box .select-chapter-button:hover {
    background: #36ad6a;
}

.info-box .start-exam-button {
    background: #f0a020;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.info-box .start-exam-button:hover {
    background: #d48806;
}

/* 考试模式样式 */
.exam-mode {
    width: 100%;
    max-width: 900px;
    padding: 80px 40px 40px;
    min-height: 500px;
    display: flex;
    justify-content: center;
    align-items: center;
}

.exam-card {
    max-width: 600px;
    margin: 0 auto;
    width: 100%;
}

.exam-header {
    text-align: center;
    margin-bottom: 32px;
}

.exam-progress {
    font-size: 16px;
    color: #666;
    font-weight: 500;
}

.exam-content {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.word-input-display {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 32px;
    background: #f5f5f5;
    border-radius: 12px;
    min-height: 100px;
}

.underline-container {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
}

.underline-char {
    font-size: 48px;
    font-weight: 600;
    color: #333;
    min-width: 40px;
    text-align: center;
    font-family: 'Courier New', monospace;
    border-bottom: 3px solid #333;
    padding-bottom: 8px;
}

.exam-feedback {
    margin-top: 16px;
}

.exam-complete {
    padding: 48px 0;
}

.chapter-info-header {
    width: 100%;
    text-align: center;
    margin-bottom: 20px;
    padding: 12px;
    background: #f5f5f5;
    border-radius: 8px;
}

.chapter-title {
    font-size: 18px;
    font-weight: 600;
    color: #333;
    margin: 0 0 8px 0;
}

.chapter-word-count {
    font-size: 14px;
    color: #666;
}

.info-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
}

.info-label {
    font-size: 14px;
    color: #999;
    font-weight: 400;
}

.info-value {
    font-size: 20px;
    font-weight: 500;
    color: #333;
}

.no-words {
    padding: 80px 0;
    text-align: center;
}

/* 练习模式样式 */
.practice-mode {
    width: 100%;
    max-width: 900px;
    padding: 80px 40px 40px;
    min-height: 500px;
    display: flex;
    justify-content: center;
    align-items: center;
}

.practice-card {
    max-width: 600px;
    margin: 0 auto;
}

.practice-header {
    text-align: center;
    margin-bottom: 32px;
}

.practice-progress {
    font-size: 16px;
    color: #666;
    font-weight: 500;
}

.practice-content {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.translation-display {
    text-align: center;
    padding: 32px;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    border-radius: 12px;
}

.translation-label {
    font-size: 14px;
    color: #666;
    margin: 0 0 8px 0;
}

.translation-text {
    font-size: 28px;
    font-weight: 600;
    margin: 0;
    color: #333;
}

.input-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.word-input {
    font-size: 18px;
    text-align: center;
}

.input-actions {
    display: flex;
    justify-content: center;
    gap: 16px;
}

.answer-feedback {
    margin-top: 16px;
}

.practice-complete {
    padding: 48px 0;
}

@media (max-width: 768px) {
    .cet4-container {
        padding: 16px;
    }

    .view-mode {
        padding: 50px 20px 30px;
    }

    .word-preview-row {
        flex-direction: column;
        gap: 12px;
    }

    .info-box {
        flex-direction: column;
        gap: 16px;
    }
}
</style>
