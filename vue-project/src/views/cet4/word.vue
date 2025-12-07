<template>
    <div class="word-display">
        <h1 class="word-text">{{ word.word }}</h1>
        <div class="word-pronunciation" v-if="showPronunciation">
            <span class="pronunciation-label">AmE:</span>
            <span class="pronunciation-text">[{{ pronunciation }}]</span>
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

// 获取单词发音（简单模拟，实际可以从API获取）
const pronunciation = computed(() => {
    // 这里可以后续接入真实的发音API
    // 暂时返回一个占位符
    return `'${props.word.word.toLowerCase().substring(0, 3)}...]`
})

// 播放单词读音
const playPronunciation = () => {
    if (!speechSynthesisSupported.value) {
        return
    }

    const utterance = new SpeechSynthesisUtterance(props.word.word)
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
