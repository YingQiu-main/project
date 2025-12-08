<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import ChapterSelectDialog from '@/components/ChapterSelectDialog.vue'

const router = useRouter()
const showChapterDialog = ref(false)

// 处理章节选择
const handleChapterSelect = (chapterId: number) => {
    // 跳转到cet4页面，并传递章节ID
    router.push({
        path: '/cet4',
        query: { chapterId: chapterId.toString() }
    })
}

// 通用点击事件处理函数
const handleCardClick = (type: 'cet4' | 'cet6' | 'article') => {
    if (type === 'cet4') {
        // 显示章节选择对话框
        showChapterDialog.value = true
    } else {
        // 其他类型直接跳转
        switch (type) {
            case 'cet6':
                router.push('/cet6')
                break
            case 'article':
                router.push('/article')
                break
        }
    }
}
</script>

<template>
    <div class="card-container">
        <!-- 章节选择对话框 -->
        <ChapterSelectDialog v-model="showChapterDialog" @select="handleChapterSelect" />
        
        <n-card class="card-item cet4-card" hoverable @click="handleCardClick('cet4')">
            <template #header>
                <div class="card-header">
                    <span class="card-icon">📚</span>
                    <span class="card-title">英语四级</span>
                </div>
            </template>
            <div class="card-content">
                <p class="card-description">提升英语四级词汇和阅读能力</p>
                <div class="card-footer">
                    <span class="card-badge">CET-4</span>
                </div>
            </div>
        </n-card>

        <n-card class="card-item cet6-card" hoverable @click="handleCardClick('cet6')">
            <template #header>
                <div class="card-header">
                    <span class="card-icon">📖</span>
                    <span class="card-title">英语六级</span>
                </div>
            </template>
            <div class="card-content">
                <p class="card-description">强化英语六级综合能力训练</p>
                <div class="card-footer">
                    <span class="card-badge">CET-6</span>
                </div>
            </div>
        </n-card>

        <n-card class="card-item article-card" hoverable @click="handleCardClick('article')">
            <template #header>
                <div class="card-header">
                    <span class="card-icon">📄</span>
                    <span class="card-title">英文文章</span>
                </div>
            </template>
            <div class="card-content">
                <p class="card-description">阅读精选英文文章，提升理解能力</p>
                <div class="card-footer">
                    <span class="card-badge">Article</span>
                </div>
            </div>
        </n-card>
    </div>
</template>

<style scoped>
.card-container {
    display: grid;
    /* repeat对每列进行定义，每列最小300px，最大1fr,fr是可用空间的分数，auto-fit,自动决定列数 */
    grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
    gap: 24px;
    padding: 24px;
    max-width: 1200px;
    margin: 0 auto;
}

.card-item {
    border-radius: 12px;
    transition: all 0.3s ease;
    overflow: hidden;
    box-shadow: 0 6px 8px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    /* 添加手型光标，提示可点击 */
}

.card-item:hover {
    transform: translateY(-4px);
    box-shadow: 0 16px 24px rgba(0, 0, 0, 0.15);
}

.cet4-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.cet4-card :deep(.n-card-header) {
    background: rgba(255, 255, 255, 0.1);
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.cet4-card :deep(.n-card__content) {
    background: rgba(255, 255, 255, 0.05);
}

.cet6-card {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    color: white;
}

.cet6-card :deep(.n-card-header) {
    background: rgba(255, 255, 255, 0.1);
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.cet6-card :deep(.n-card__content) {
    background: rgba(255, 255, 255, 0.05);
}

.article-card {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    color: white;
}

.article-card :deep(.n-card-header) {
    background: rgba(255, 255, 255, 0.1);
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.article-card :deep(.n-card__content) {
    background: rgba(255, 255, 255, 0.05);
}

.card-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 4px 0;
}

.card-icon {
    font-size: 28px;
    display: inline-block;
    /* 行高等于字体大小 */
    line-height: 1;
}

.card-title {
    font-size: 20px;
    font-weight: 600;
    color: white;
}

.card-content {
    padding: 16px 0;
}

.card-description {
    font-size: 14px;
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.9);
    margin: 0 0 16px 0;
}

.card-footer {
    display: flex;
    justify-content: flex-end;
}

.card-badge {
    display: inline-block;
    padding: 6px 12px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
    color: white;
    backdrop-filter: blur(10px);
}

@media (max-width: 768px) {
    .card-container {
        grid-template-columns: 1fr;
        padding: 16px;
    }
}
</style>
