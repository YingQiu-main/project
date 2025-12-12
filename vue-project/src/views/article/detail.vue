<template>
  <div class="article-detail-container">
    <div v-if="loading" class="loading-wrapper">
      <n-spin size="large" />
    </div>

    <div v-else-if="error" class="error-wrapper">
      <n-result status="error" title="加载失败" :description="error">
        <template #footer>
          <n-button @click="fetchArticle">重试</n-button>
          <n-button @click="goBack" style="margin-left: 12px">返回列表</n-button>
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
                <path
                  fill="currentColor"
                  d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"
                />
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
              <path
                fill="currentColor"
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"
              />
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
          <div
            class="content-text translation-text"
            v-html="formatContent(article.translation)"
          ></div>
        </div>

        <!-- 词汇表 -->
        <div v-if="article.vocabulary && article.vocabulary.length > 0" class="content-section">
          <h2 class="section-title">重点词汇</h2>
          <div class="vocabulary-list">
            <div v-for="(vocab, index) in article.vocabulary" :key="index" class="vocabulary-item">
              <div class="vocab-word">
                <span class="word-text">{{ vocab.word }}</span>
                <n-tag size="small" type="info" style="margin-left: 8px">
                  {{ vocab['part of speech'] }}
                </n-tag>
              </div>
              <div class="vocab-meaning">{{ vocab.meaning }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- AI 问答浮动按钮（仅在文章加载完成时显示） -->
    <n-button
      v-if="article"
      circle
      type="primary"
      size="large"
      class="ai-chat-button"
      @click="showAIChat = true"
    >
      <template #icon>
        <n-icon>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"
            />
          </svg>
        </n-icon>
      </template>
    </n-button>

    <!-- AI 问答抽屉（始终存在，通过 v-model 控制显示） -->
    <n-drawer v-model:show="showAIChat" :width="480" placement="right" :trap-focus="false">
      <n-drawer-content title="AI 学习助手" closable>
        <template #header>
          <div class="ai-chat-header">
            <span>AI 学习助手</span>
            <n-button
              text
              size="small"
              @click="clearChatHistory"
              :disabled="chatHistory.length === 0"
            >
              清空历史
            </n-button>
          </div>
        </template>

        <!-- 聊天消息列表 -->
        <div class="ai-chat-messages" ref="messagesContainer">
          <div
            v-for="(msg, index) in chatHistory"
            :key="index"
            class="chat-message"
            :class="{ 'user-message': msg.role === 'user', 'ai-message': msg.role === 'assistant' }"
          >
            <!-- 如果是用户消息，显示用户图标 -->
            <div class="message-avatar">
              <n-icon v-if="msg.role === 'user'" size="20">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                  />
                </svg>
              </n-icon>
              <!-- 否则（是AI消息），显示AI图标 -->
              <n-icon v-else size="20">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                  />
                </svg>
              </n-icon>
            </div>

            <div class="message-content">
                <!-- 这是具体的内容， v-html是把字符串当前html渲染出来 -->
              <div class="message-text" v-html="formatMessage(msg.content)"></div>
              <!-- ai回答几个蓝点-->
              <div
                v-if="msg.role === 'assistant' && index === chatHistory.length - 1 && isStreaming"
                class="typing-indicator"
              >
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
          <div v-if="chatHistory.length === 0" class="empty-chat">
            <n-icon size="48" :depth="3">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"
                />
              </svg>
            </n-icon>
            <p>有什么关于这篇文章的问题吗？</p>
            <p class="hint-text">我可以帮你解释单词、句子或回答相关问题</p>
          </div>
        </div>

        <!-- 输入框 -->
        <div class="ai-chat-input">
          <n-input
            v-model:value="inputMessage"
            type="textarea"
            placeholder="输入你的问题..."
            :rows="3"
            :disabled="isStreaming"
            @keydown.enter.exact.prevent="handleSendMessage"
            :autosize="{ minRows: 2, maxRows: 4 }"
          />
          <div class="input-actions">
            <n-button
              type="primary"
              :loading="isStreaming"
              :disabled="!inputMessage.trim() || isStreaming"
              @click="handleSendMessage"
              class="send-button"
            >
              {{ isStreaming ? '发送中...' : '发送' }}
            </n-button>
          </div>
        </div>
      </n-drawer-content>
    </n-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { NButton, NSpin, NResult, NIcon, NTag, NDrawer, NDrawerContent, NInput } from 'naive-ui'
import { useMessage } from 'naive-ui'
import request from '@/utils/axios'
import { getAccessToken } from '@/utils/auth'

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
const message = useMessage()
const article = ref<Article | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

// AI 问答相关
const showAIChat = ref(false)
const inputMessage = ref('')
const chatHistory = ref<Array<{ role: 'user' | 'assistant'; content: string }>>([])
const isStreaming = ref(false)
const messagesContainer = ref<HTMLElement | null>(null)
const currentStreamingMessage = ref('')

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
    const response = (await request.get<ApiResponse>(
      `/api/articles/${articleId}`,
    )) as unknown as ApiResponse

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
    3: '高级',
  }
  return levelMap[level] || '未知'
}

// 获取难度等级类型（用于标签颜色）
const getLevelType = (level: number): 'success' | 'warning' | 'error' => {
  const typeMap: Record<number, 'success' | 'warning' | 'error'> = {
    1: 'success',
    2: 'warning',
    3: 'error',
  }
  return typeMap[level] || 'success'
}

// 返回列表
const goBack = () => {
  router.push('/article')
}

// 格式化消息内容（支持换行）
const formatMessage = (text: string): string => {
  if (!text) return ''
  return text.replace(/\n/g, '<br>')
}

// 获取 localStorage 的 key（基于文章 ID）
const getChatHistoryKey = (articleId: number): string => {
  return `ai_chat_history_${articleId}`
}

// 加载聊天历史
const loadChatHistory = () => {
  if (!article.value) return

  const key = getChatHistoryKey(article.value.id)
  const saved = localStorage.getItem(key)
  if (saved) {
    try {
      chatHistory.value = JSON.parse(saved)
    } catch (e) {
      console.error('加载聊天历史失败:', e)
      chatHistory.value = []
    }
  }
}

// 保存聊天历史
const saveChatHistory = () => {
  if (!article.value) return

  const key = getChatHistoryKey(article.value.id)
  localStorage.setItem(key, JSON.stringify(chatHistory.value))
}

// 清空聊天历史
const clearChatHistory = () => {
  chatHistory.value = []
  if (article.value) {
    const key = getChatHistoryKey(article.value.id)
    localStorage.removeItem(key)
  }
  message.success('已清空聊天历史')
}

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

// 发送消息（流式）
const handleSendMessage = async () => {
  if (!inputMessage.value.trim() || isStreaming.value || !article.value) return

  const userMessage = inputMessage.value.trim()
  inputMessage.value = ''

  // 添加用户消息
  chatHistory.value.push({
    role: 'user',
    content: userMessage,
  })
  saveChatHistory()
  scrollToBottom()

  // 添加 AI 消息占位符
  const aiMessageIndex = chatHistory.value.length
  chatHistory.value.push({
    role: 'assistant',
    content: '',
  })
  currentStreamingMessage.value = ''
  isStreaming.value = true
  scrollToBottom()

  try {
    const token = getAccessToken()
    if (!token) {
      throw new Error('未登录，请先登录')
    }

    // 构建消息历史（包含系统提示）
    const messages = [
      {
        role: 'system' as const,
        content: `你是一个专业的英语学习助手。用户正在阅读一篇英语文章，标题是"${article.value.title}"。请用中文回答用户的问题，帮助用户理解文章内容、单词、句子结构等。回答要简洁明了，易于理解。`,
      },
      ...chatHistory.value.slice(0, -1).map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: 'user' as const,
        content: userMessage,
      },
    ]

    // 调用流式接口
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
    const response = await fetch(`${baseURL}/api/ai/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        messages: messages,
        model: 'gpt-3.5-turbo',
      }),
    })

    if (!response.ok) {
      throw new Error(`请求失败: ${response.status}`)
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) {
      throw new Error('无法读取响应流')
    }

    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        break
      }

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6))

            if (data.error) {
              throw new Error(data.message || 'AI 服务错误')
            }

            if (data.done) {
              // 流式传输完成
              if (chatHistory.value[aiMessageIndex]) {
                chatHistory.value[aiMessageIndex].content = currentStreamingMessage.value
              }
              saveChatHistory()
              isStreaming.value = false
              currentStreamingMessage.value = ''
              scrollToBottom()
              return
            }

            if (data.content) {
              currentStreamingMessage.value += data.content
              if (chatHistory.value[aiMessageIndex]) {
                chatHistory.value[aiMessageIndex].content = currentStreamingMessage.value
              }
              scrollToBottom()
            }
          } catch (e) {
            console.error('解析数据失败:', e)
          }
        }
      }
    }

    // 确保最终保存
    if (chatHistory.value[aiMessageIndex]) {
      chatHistory.value[aiMessageIndex].content = currentStreamingMessage.value
    }
    saveChatHistory()
  } catch (error: any) {
    console.error('发送消息失败:', error)
    message.error(error.message || '发送消息失败，请稍后重试')

    // 移除失败的 AI 消息
    const lastMessage = chatHistory.value[chatHistory.value.length - 1]
    if (chatHistory.value.length > 0 && lastMessage && lastMessage.role === 'assistant') {
      chatHistory.value.pop()
    }
  } finally {
    isStreaming.value = false
    currentStreamingMessage.value = ''
    scrollToBottom()
  }
}

// 监听文章加载，加载聊天历史
watch(
  () => article.value?.id,
  () => {
    if (article.value) {
      loadChatHistory()
    }
  },
)

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

/* AI 问答按钮 */
.ai-chat-button {
  position: fixed;
  bottom: 32px;
  right: 32px;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(79, 172, 254, 0.4);
  transition: all 0.3s ease;
}

.ai-chat-button:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(79, 172, 254, 0.6);
}

/* AI 问答抽屉样式 */
.ai-chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.ai-chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px 0;
  min-height: 300px;
  max-height: calc(100vh - 280px);
}

.empty-chat {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
  text-align: center;
  padding: 40px 20px;
}

.empty-chat p {
  margin: 16px 0 8px;
  font-size: 16px;
  color: #666;
}

.hint-text {
  font-size: 14px;
  color: #999;
}

.chat-message {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.user-message {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: #f0f0f0;
  color: #666;
}

.user-message .message-avatar {
  background: #4facfe;
  color: #fff;
}

.ai-message .message-avatar {
  background: #e8f4fd;
  color: #4facfe;
}

.message-content {
  flex: 1;
  max-width: 75%;
}

.user-message .message-content {
  text-align: right;
}

.message-text {
  padding: 12px 16px;
  border-radius: 12px;
  line-height: 1.6;
  word-wrap: break-word;
  display: inline-block;
}

.user-message .message-text {
  background: #4facfe;
  color: #fff;
  border-bottom-right-radius: 4px;
}

.ai-message .message-text {
  background: #f5f5f5;
  color: #333;
  border-bottom-left-radius: 4px;
}

.typing-indicator {
  display: inline-flex;
  gap: 4px;
  padding: 8px 0;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #4facfe;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%,
  60%,
  100% {
    transform: translateY(0);
    opacity: 0.7;
  }
  30% {
    transform: translateY(-10px);
    opacity: 1;
  }
}

.ai-chat-input {
  border-top: 1px solid #eee;
  padding-top: 16px;
  margin-top: 16px;
}

.input-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.send-button {
  min-width: 80px;
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

  .ai-chat-button {
    bottom: 20px;
    right: 20px;
  }

  .message-content {
    max-width: 85%;
  }
}
</style>
