<template>
    <n-modal 
        v-model:show="visible" 
        preset="card" 
        title="选择章节" 
        style="width: 600px" 
        :mask-closable="false"
        :close-on-esc="false"
        :show-icon="false"
    >
        <div class="chapter-list-container">
            <n-spin :show="loading">
                <div v-if="chapters.length > 0" class="chapters-grid">
                    <div
                        v-for="chapter in chapters"
                        :key="chapter.id"
                        class="chapter-item"
                        @click="handleChapterClick(chapter)"
                    >
                        <div class="chapter-header">
                            <span class="chapter-name">{{ chapter.name }}</span>
                        </div>
                        <div class="chapter-info">
                            <span class="word-count">单词数: {{ chapter.word_count }}</span>
                        </div>
                    </div>
                </div>
                <n-empty v-else description="暂无章节数据" />
            </n-spin>
        </div>
    </n-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { NModal, NSpin, NEmpty } from 'naive-ui'
import request from '@/utils/axios'

export interface Chapter {
    id: number
    name: string
    order_index: number
    word_count: number
    status: number
    level?: 'cet4' | 'cet6'
    createdAt: string
}

const props = defineProps<{
    modelValue: boolean
    level?: 'cet4' | 'cet6'  // 可选：指定要加载的级别
}>()

const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    'select': [chapterId: number]
}>()

const visible = ref(false)
const loading = ref(false)
const chapters = ref<Chapter[]>([])

watch(() => props.modelValue, (newVal) => {
    visible.value = newVal
    if (newVal) {
        loadChapters()
    }
})

watch(visible, (newVal) => {
    emit('update:modelValue', newVal)
})

const loadChapters = async () => {
    loading.value = true
    try {
        // 如果指定了level，则只加载对应级别的章节
        const url = props.level 
            ? `/api/words/chapters?level=${props.level}`
            : '/api/words/chapters'
        const response: any = await request.get(url)
        chapters.value = response || []
    } catch (error: any) {
        console.error('加载章节列表失败:', error)
    } finally {
        loading.value = false
    }
}

const handleChapterClick = (chapter: Chapter) => {
    emit('select', chapter.id)
    visible.value = false
}
</script>

<style scoped>
.chapter-list-container {
    min-height: 300px;
    max-height: 500px;
    overflow-y: auto;
}

.chapters-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
    padding: 8px;
}

.chapter-item {
    padding: 16px;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    background: #fff;
}

.chapter-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: #18a058;
    background: #f0f9ff;
}

.chapter-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.chapter-name {
    font-size: 16px;
    font-weight: 600;
    color: #333;
}

.chapter-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;
    color: #666;
}

.word-count {
    font-size: 14px;
    color: #666;
}
</style>

