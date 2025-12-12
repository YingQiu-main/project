<template>
    <div class="word-display">
        <h1 class="word-text">{{ displayWord }}</h1>
        <div class="word-pronunciation" v-if="showPronunciation && displayPhonetic">
            <span class="pronunciation-label">音标:</span>
            <span class="pronunciation-text">{{ displayPhonetic }}</span>
            <n-button circle size="small" @click="playPronunciation" :disabled="!speechSynthesisSupported"
                class="pronunciation-btn">
                <template #icon>
                    <span>🔊</span>
                </template>
            </n-button>
        </div>
        <p class="word-translation">{{ word.translation }}</p>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NButton } from 'naive-ui'
import type { Word } from '@/types/word'

interface Props {
    word: Word
    showPronunciation?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    showPronunciation: true
})

// 语音合成支持
const speechSynthesisSupported = ref('speechSynthesis' in window)

// 获取显示的单词
const displayWord = computed(() => {
    return props.word.text || ''
})

// 获取音标（优先使用API返回的phonetic字段）
const displayPhonetic = computed(() => {
    if (props.word.phonetic) {
        return props.word.phonetic
    }
    // 如果没有音标，返回空字符串（不显示音标行）
    return ''
})

// 播放单词读音
const playPronunciation = () => {
    if (!speechSynthesisSupported.value) {
        return
    }

    const wordToSpeak = displayWord.value
    if (!wordToSpeak) return

    const utterance = new SpeechSynthesisUtterance(wordToSpeak)
    utterance.lang = 'en-US'
    utterance.rate = 0.8
    speechSynthesis.speak(utterance)
}
</script>

<style scoped>
.word-display {
    text-align: center;
}

.word-text {
    font-size: 72px;
    font-weight: 400;
    color: #666;
    margin: 0 0 20px 0;
    letter-spacing: 1px;
}

.word-pronunciation {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-bottom: 24px;
    font-size: 16px;
    color: #999;
}

.pronunciation-label {
    font-weight: 500;
}

.pronunciation-text {
    font-family: 'Courier New', monospace;
    color: #999;
}

.pronunciation-btn {
    margin-left: 8px;
}

.word-translation {
    font-size: 20px;
    color: #333;
    margin: 0;
    line-height: 1.8;
    font-weight: 400;
}
</style>

