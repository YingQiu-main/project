<template>
    <div class="cet4-container">
        <!-- 查看模式：单单词显示 -->
        <div v-if="mode === 'view'" class="view-mode">
            <div v-if="currentWord" class="word-display-wrapper">
                <!-- 上一个和下一个单词预览 -->
                <div class="word-preview-row">
                    <div class="word-preview prev-word" v-if="prevWord" @click="goToPrevWord">
                        <span class="preview-label">上一个</span>
                        <span class="preview-word">{{ prevWord.word }}</span>
                    </div>
                    <div class="word-preview next-word" v-if="nextWord" @click="goToNextWord">
                        <span class="preview-label">下一个</span>
                        <span class="preview-word">{{ nextWord.word }}</span>
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
                </div>
            </div>
            <div v-else class="no-words">
                <n-empty description="没有更多单词了">
                    <template #extra>
                        <n-button @click="resetProgress">重新开始</n-button>
                    </template>
                </n-empty>
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
                            <n-button circle size="large" @click="playPronunciation(currentPracticeWord.word)"
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
                                <p>正确答案：<strong>{{ currentPracticeWord.word }}</strong></p>
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
    useMessage
} from 'naive-ui'
import WordComponent from './word.vue'

const router = useRouter()
const wordStore = useWordStore()
const message = useMessage()

// 学习模式
const mode = ref<'view' | 'practice'>('view')

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
    } else {
        // 自动加载更多
        const moreWords = wordStore.getRandomWords(wordsPerPage.value)
        if (moreWords.length > 0) {
            currentWords.value = [...currentWords.value, ...moreWords]
            currentWordIndex.value++
        }
    }
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

// 初始化
onMounted(async () => {
    speechSynthesisSupported.value = 'speechSynthesis' in window
    await wordStore.initialize()
    loadWords()
    startTimer()
    window.addEventListener('keydown', handleKeyDown)
})

// 组件卸载时清理
onUnmounted(() => {
    stopTimer()
    window.removeEventListener('keydown', handleKeyDown)
})

// 检查答案
const checkAnswer = () => {
    if (!currentPracticeWord.value || !userInput.value.trim()) return

    isChecking.value = true
    const userAnswer = userInput.value.trim().toLowerCase()
    const correctAnswer = currentPracticeWord.value.word.toLowerCase()

    isCorrect.value = userAnswer === correctAnswer
    inputStatus.value = isCorrect.value ? 'success' : 'error'
    showAnswer.value = true

    if (isCorrect.value) {
        wordStore.markAsMastered(currentPracticeWord.value.id)
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

// 重置进度
const resetProgress = () => {
    wordStore.resetProgress()
    loadWords()
    message.success('学习进度已重置')
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
    margin-bottom: 40px;
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
