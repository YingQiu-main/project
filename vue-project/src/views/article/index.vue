<template>
    <div class="article-list-container">
        <div class="header">
            <h1 class="title">英文文章</h1>
            <p class="subtitle">选择一篇文章开始阅读</p>
        </div>

        <div v-if="loading" class="loading-wrapper">
            <n-spin size="large" />
        </div>

        <div v-else-if="error" class="error-wrapper">
            <n-result status="error" title="加载失败" :description="error">
                <template #footer>
                    <n-button @click="fetchArticles">重试</n-button>
                </template>
            </n-result>
        </div>

        <div v-else-if="articles.length === 0" class="empty-wrapper">
            <n-empty description="暂无文章">
                <template #extra>
                    <n-button @click="fetchArticles">刷新</n-button>
                </template>
            </n-empty>
        </div>

        <div v-else class="articles-grid">
            <n-card
                v-for="article in articles"
                :key="article.id"
                class="article-card"
                hoverable
                @click="handleArticleClick(article.id)"
            >
                <div class="article-card-content">
                    <h3 class="article-title">{{ article.title }}</h3>
                    <div class="article-meta">
                        <n-icon size="18" class="time-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                            </svg>
                        </n-icon>
                        <span class="reading-time">{{ article.reading_time }} 分钟</span>
                    </div>
                </div>
            </n-card>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { NCard, NSpin, NEmpty, NResult, NButton, NIcon } from 'naive-ui'
import request from '@/utils/axios'

interface ArticleSummary {
    id: number
    title: string
    reading_time: number
}

interface ApiResponse {
    success: boolean
    data: ArticleSummary[]
    message?: string
}

const router = useRouter()
const articles = ref<ArticleSummary[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

// 获取文章列表
const fetchArticles = async () => {
    loading.value = true
    error.value = null
    
    try {
        const response = await request.get<ApiResponse>('/api/articles') as unknown as ApiResponse
        
        if (response.success && response.data) {
            articles.value = response.data
        } else {
            error.value = response.message || '获取文章列表失败'
        }
    } catch (err: any) {
        console.error('获取文章列表失败:', err)
        error.value = err.message || '网络错误，请稍后重试'
    } finally {
        loading.value = false
    }
}

// 处理文章点击
const handleArticleClick = (articleId: number) => {
    router.push({
        path: '/article/detail',
        query: { id: articleId.toString() }
    })
}

// 组件挂载时获取文章列表
onMounted(() => {
    fetchArticles()
})
</script>

<style scoped>
.article-list-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 24px;
    min-height: calc(100vh - 100px);
}

.header {
    text-align: center;
    margin-bottom: 32px;
}

.title {
    font-size: 32px;
    font-weight: 600;
    color: #333;
    margin: 0 0 8px 0;
}

.subtitle {
    font-size: 16px;
    color: #666;
    margin: 0;
}

.loading-wrapper,
.error-wrapper,
.empty-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 400px;
}

.articles-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 24px;
}

.article-card {
    cursor: pointer;
    transition: all 0.3s ease;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.article-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.article-card-content {
    padding: 8px 0;
}

.article-title {
    font-size: 18px;
    font-weight: 600;
    color: #333;
    margin: 0 0 16px 0;
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
}

.article-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #666;
    font-size: 14px;
}

.time-icon {
    color: #4facfe;
}

.reading-time {
    color: #666;
}

@media (max-width: 768px) {
    .article-list-container {
        padding: 16px;
    }

    .title {
        font-size: 24px;
    }

    .articles-grid {
        grid-template-columns: 1fr;
        gap: 16px;
    }
}
</style>
