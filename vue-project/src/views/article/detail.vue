<template>
    <div class="article-detail-container">
        <div v-if="loading" class="loading-wrapper">
            <n-spin size="large" />
        </div>

        <div v-else-if="error" class="error-wrapper">
            <n-result status="error" title="加载失败" :description="error">
                <template #footer>
                    <n-button @click="fetchArticle">重试</n-button>
                    <n-button @click="goBack" style="margin-left: 12px;">返回列表</n-button>
                </template>
            </n-result>
        </div>

        <div v-else-if="article" class="article-content">
            <!-- 返回按钮 -->
            <div class="article-header">
                <n-button quaternary @click="goBack" class="back-button">
                    <template #icon>
                        <n-icon>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                            </svg>
                        </n-icon>
                    </template>
                    返回列表
                </n-button>
            </div>

            <!-- 文章标题 -->
            <h1 class="article-title">{{ article.title }}</h1>

            <!-- 文章元信息 -->
            <div class="article-meta">
                <n-tag :type="getLevelType(article.level)" size="small">
                    {{ getLevelText(article.level) }}
                </n-tag>
                <span class="meta-item">
                    <n-icon size="18" class="time-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                        </svg>
                    </n-icon>
                    {{ article.reading_time }} 分钟
                </span>
            </div>

            <!-- 文章内容 -->
            <div class="article-body">
                <div class="content-section">
                    <h2 class="section-title">英文原文</h2>
                    <div class="content-text" v-html="formatContent(article.content)"></div>
                </div>

                <div class="content-section">
                    <h2 class="section-title">中文翻译</h2>
                    <div class="content-text translation-text" v-html="formatContent(article.translation)"></div>
                </div>

                <!-- 词汇表 -->
                <div v-if="article.vocabulary && article.vocabulary.length > 0" class="content-section">
                    <h2 class="section-title">重点词汇</h2>
                    <div class="vocabulary-list">
                        <div
                            v-for="(vocab, index) in article.vocabulary"
                            :key="index"
                            class="vocabulary-item"
                        >
                            <div class="vocab-word">
                                <span class="word-text">{{ vocab.word }}</span>
                                <n-tag size="small" type="info" style="margin-left: 8px;">
                                    {{ vocab['part of speech'] }}
                                </n-tag>
                            </div>
                            <div class="vocab-meaning">{{ vocab.meaning }}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { NButton, NSpin, NResult, NIcon, NTag } from 'naive-ui'
import request from '@/utils/axios'

interface VocabularyItem {
    word: string
    'part of speech': string
    meaning: string
}

interface Article {
    id: number
    level: number
    title: string
    content: string
    translation: string
    vocabulary: VocabularyItem[]
    reading_time: number
    created_at?: string
}

interface ApiResponse {
    success: boolean
    data: Article
    message?: string
}

const router = useRouter()
const route = useRoute()
const article = ref<Article | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

// 获取文章详情
const fetchArticle = async () => {
    const articleId = route.query.id
    
    if (!articleId) {
        error.value = '缺少文章ID'
        return
    }

    loading.value = true
    error.value = null

    try {
        const response = await request.get<ApiResponse>(`/api/articles/${articleId}`) as unknown as ApiResponse
        
        if (response.success && response.data) {
            article.value = response.data
        } else {
            error.value = response.message || '获取文章失败'
        }
    } catch (err: any) {
        console.error('获取文章详情失败:', err)
        error.value = err.message || '网络错误，请稍后重试'
    } finally {
        loading.value = false
    }
}

// 格式化内容（将换行符转换为 <br>）
const formatContent = (text: string): string => {
    if (!text) return ''
    return text.replace(/\n/g, '<br>')
}

// 获取难度等级文本
const getLevelText = (level: number): string => {
    const levelMap: Record<number, string> = {
        1: '初级',
        2: '中级',
        3: '高级'
    }
    return levelMap[level] || '未知'
}

// 获取难度等级类型（用于标签颜色）
const getLevelType = (level: number): 'success' | 'warning' | 'error' => {
    const typeMap: Record<number, 'success' | 'warning' | 'error'> = {
        1: 'success',
        2: 'warning',
        3: 'error'
    }
    return typeMap[level] || 'success'
}

// 返回列表
const goBack = () => {
    router.push('/article')
}

// 组件挂载时获取文章详情
onMounted(() => {
    fetchArticle()
})
</script>

<style scoped>
.article-detail-container {
    max-width: 900px;
    margin: 0 auto;
    padding: 24px;
    min-height: calc(100vh - 100px);
}

.loading-wrapper,
.error-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 400px;
}

.article-content {
    background: #fff;
    border-radius: 12px;
    padding: 32px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.article-header {
    margin-bottom: 24px;
}

.back-button {
    color: #666;
}

.article-title {
    font-size: 32px;
    font-weight: 600;
    color: #333;
    margin: 0 0 16px 0;
    line-height: 1.4;
}

.article-meta {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 32px;
    padding-bottom: 16px;
    border-bottom: 1px solid #eee;
}

.meta-item {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #666;
    font-size: 14px;
}

.time-icon {
    color: #4facfe;
}

.article-body {
    line-height: 1.8;
}

.content-section {
    margin-bottom: 40px;
}

.content-section:last-child {
    margin-bottom: 0;
}

.section-title {
    font-size: 20px;
    font-weight: 600;
    color: #333;
    margin: 0 0 16px 0;
    padding-bottom: 8px;
    border-bottom: 2px solid #4facfe;
}

.content-text {
    font-size: 16px;
    color: #333;
    line-height: 2;
    white-space: pre-wrap;
    word-wrap: break-word;
}

.translation-text {
    color: #555;
    background: #f8f9fa;
    padding: 20px;
    border-radius: 8px;
    border-left: 4px solid #4facfe;
}

.vocabulary-list {
    display: grid;
    gap: 16px;
}

.vocabulary-item {
    background: #f8f9fa;
    padding: 16px;
    border-radius: 8px;
    border-left: 4px solid #4facfe;
    transition: all 0.3s ease;
}

.vocabulary-item:hover {
    background: #f0f0f0;
    transform: translateX(4px);
}

.vocab-word {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
}

.word-text {
    font-size: 18px;
    font-weight: 600;
    color: #333;
}

.vocab-meaning {
    font-size: 14px;
    color: #666;
    line-height: 1.6;
}

@media (max-width: 768px) {
    .article-detail-container {
        padding: 16px;
    }

    .article-content {
        padding: 20px;
    }

    .article-title {
        font-size: 24px;
    }

    .content-text {
        font-size: 14px;
    }
}
</style>

