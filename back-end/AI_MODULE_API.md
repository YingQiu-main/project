# AI 模块 API 文档

## 概述

AI 模块提供了与 AI 大模型交互的接口，支持非流式和流式两种调用方式。所有接口都需要用户认证（Bearer Token）。

**基础路径**: `/api/ai`

**认证方式**: 在请求头中添加 `Authorization: Bearer <token>`

---

## 接口列表

### 1. 非流式聊天接口

**接口地址**: `POST /api/ai/chat`

**描述**: 发送消息给 AI，等待完整回复后一次性返回。

**请求头**:
```
Content-Type: application/json
Authorization: Bearer <token>
```

**请求体**（方式一：单条消息）:
```json
{
  "message": "你是谁创造的？",
  "model": "gpt-3.5-turbo"  // 可选，默认为 gpt-3.5-turbo
}
```

**请求体**（方式二：多轮对话）:
```json
{
  "messages": [
    { "role": "system", "content": "你是一个专业的英语学习助手。" },
    { "role": "user", "content": "请解释一下 'apple' 这个单词" },
    { "role": "assistant", "content": "Apple 是一个名词，意思是苹果。" },
    { "role": "user", "content": "那复数形式是什么？" }
  ],
  "model": "gpt-3.5-turbo"  // 可选，默认为 gpt-3.5-turbo
}
```

**响应示例**:
```json
{
  "reply": "我是由OpenAI开发和训练的人工智能语言模型。有什么我可以帮你的吗？",
  "raw": {
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "我是由OpenAI开发和训练的人工智能语言模型。有什么我可以帮你的吗？",
      "annotations": []
    },
    "logprobs": null,
    "finish_reason": "stop"
  }
}
```

**错误响应**:
```json
{
  "message": "Invalid request: message is required and must be a string"
}
```

---

### 2. 流式聊天接口

**接口地址**: `POST /api/ai/chat/stream`

**描述**: 使用 Server-Sent Events (SSE) 实时推送 AI 回复，适合需要实时显示回复的场景。

**请求头**:
```
Content-Type: application/json
Authorization: Bearer <token>
```

**请求体**（方式一：单条消息）:
```json
{
  "message": "鲁迅和周树人的关系",
  "model": "gpt-3.5-turbo"  // 可选，默认为 gpt-3.5-turbo
}
```

**请求体**（方式二：多轮对话）:
```json
{
  "messages": [
    { "role": "system", "content": "你是一个专业的英语学习助手。" },
    { "role": "user", "content": "请解释一下 'apple' 这个单词" },
    { "role": "assistant", "content": "Apple 是一个名词，意思是苹果。" },
    { "role": "user", "content": "那复数形式是什么？" }
  ],
  "model": "gpt-3.5-turbo"  // 可选，默认为 gpt-3.5-turbo
}
```

**响应格式**: Server-Sent Events (SSE)

**响应示例**:
```
data: {"content":"鲁迅"}

data: {"content":"和"}

data: {"content":"周树人"}

data: {"content":"是同一个人。"}

data: {"done":true,"finish_reason":"stop"}
```

**错误响应**:
```
data: {"error":true,"message":"Invalid request: message or messages is required"}
```

---

## 前端调用示例

### JavaScript/TypeScript 非流式调用

```typescript
async function chatWithAI(message: string, model: string = 'gpt-3.5-turbo') {
  const response = await fetch('http://localhost:3000/api/ai/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${yourToken}`
    },
    body: JSON.stringify({
      message: message,
      model: model
    })
  });
  
  const data = await response.json();
  return data.reply;
}

// 使用示例
chatWithAI('你是谁创造的？').then(reply => {
  console.log('AI回复:', reply);
});
```

### JavaScript/TypeScript 流式调用

```typescript
async function chatWithAIStream(
  message: string, 
  onChunk: (content: string) => void,
  onComplete: () => void,
  model: string = 'gpt-3.5-turbo'
) {
  const response = await fetch('http://localhost:3000/api/ai/chat/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${yourToken}`
    },
    body: JSON.stringify({
      message: message,
      model: model
    })
  });
  
  if (!response.ok) {
    throw new Error('请求失败');
  }
  
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  
  if (!reader) {
    throw new Error('无法读取响应流');
  }
  
  let buffer = '';
  
  while (true) {
    const { done, value } = await reader.read();
    
    if (done) {
      onComplete();
      break;
    }
    
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || ''; // 保留最后一个不完整的行
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          
          if (data.error) {
            console.error('AI错误:', data.message);
            break;
          }
          
          if (data.done) {
            onComplete();
            return;
          }
          
          if (data.content) {
            onChunk(data.content);
          }
        } catch (e) {
          console.error('解析数据失败:', e);
        }
      }
    }
  }
}

// 使用示例
let fullReply = '';
chatWithAIStream(
  '鲁迅和周树人的关系',
  (chunk) => {
    fullReply += chunk;
    console.log('收到数据块:', chunk);
    // 更新 UI，实时显示回复
    document.getElementById('ai-reply')!.textContent = fullReply;
  },
  () => {
    console.log('流式传输完成，完整回复:', fullReply);
  }
);
```

### React 组件示例（流式调用）

```tsx
import { useState } from 'react';

function AIChatComponent() {
  const [message, setMessage] = useState('');
  const [reply, setReply] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const token = localStorage.getItem('token'); // 从存储中获取 token

  const handleStreamChat = async () => {
    setIsLoading(true);
    setReply('');
    
    try {
      const response = await fetch('http://localhost:3000/api/ai/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: message,
          model: 'gpt-3.5-turbo'
        })
      });
      
      if (!response.ok) {
        throw new Error('请求失败');
      }
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) return;
      
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          setIsLoading(false);
          break;
        }
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.content) {
                setReply(prev => prev + data.content);
              }
              
              if (data.done) {
                setIsLoading(false);
                return;
              }
            } catch (e) {
              console.error('解析失败:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('错误:', error);
      setIsLoading(false);
    }
  };

  return (
    <div>
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="输入你的问题..."
      />
      <button onClick={handleStreamChat} disabled={isLoading}>
        {isLoading ? '发送中...' : '发送'}
      </button>
      <div>
        <h3>AI 回复:</h3>
        <p>{reply || (isLoading ? '正在思考...' : '')}</p>
      </div>
    </div>
  );
}

export default AIChatComponent;
```

### Vue 3 组件示例（流式调用）

```vue
<template>
  <div>
    <input v-model="message" placeholder="输入你的问题..." />
    <button @click="handleStreamChat" :disabled="isLoading">
      {{ isLoading ? '发送中...' : '发送' }}
    </button>
    <div>
      <h3>AI 回复:</h3>
      <p>{{ reply || (isLoading ? '正在思考...' : '') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const message = ref('');
const reply = ref('');
const isLoading = ref(false);
const token = localStorage.getItem('token'); // 从存储中获取 token

const handleStreamChat = async () => {
  isLoading.value = true;
  reply.value = '';
  
  try {
    const response = await fetch('http://localhost:3000/api/ai/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        message: message.value,
        model: 'gpt-3.5-turbo'
      })
    });
    
    if (!response.ok) {
      throw new Error('请求失败');
    }
    
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    
    if (!reader) return;
    
    let buffer = '';
    
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        isLoading.value = false;
        break;
      }
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            
            if (data.content) {
              reply.value += data.content;
            }
            
            if (data.done) {
              isLoading.value = false;
              return;
            }
          } catch (e) {
            console.error('解析失败:', e);
          }
        }
      }
    }
  } catch (error) {
    console.error('错误:', error);
    isLoading.value = false;
  }
};
</script>
```

---

## 多轮对话示例

### 非流式多轮对话

```typescript
async function multiTurnChat(messages: Array<{role: 'user' | 'assistant' | 'system', content: string}>) {
  const response = await fetch('http://localhost:3000/api/ai/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${yourToken}`
    },
    body: JSON.stringify({
      messages: messages, // 发送完整的对话历史
      model: 'gpt-3.5-turbo'
    })
  });
  
  return await response.json();
}

// 使用示例
const conversationHistory = [
  { role: 'system', content: '你是一个专业的英语学习助手。' },
  { role: 'user', content: '请解释一下 apple 这个单词' },
  { role: 'assistant', content: 'Apple 是一个名词，意思是苹果。' },
  { role: 'user', content: '那复数形式是什么？' }
];

multiTurnChat(conversationHistory).then(result => {
  console.log('AI回复:', result.reply);
  // 将AI回复添加到对话历史
  conversationHistory.push({ role: 'assistant', content: result.reply });
});
```

### 流式多轮对话

```typescript
async function multiTurnChatStream(
  messages: Array<{role: 'user' | 'assistant' | 'system', content: string}>,
  onChunk: (content: string) => void
) {
  const response = await fetch('http://localhost:3000/api/ai/chat/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${yourToken}`
    },
    body: JSON.stringify({
      messages: messages, // 发送完整的对话历史
      model: 'gpt-3.5-turbo'
    })
  });
  
  // ... 处理流式响应的代码（同上面的流式调用示例）
}
```

---

## 环境变量配置

在 `back-end` 目录下创建 `.env` 文件：

```env
# OpenAI API 配置
OPENAI_API_KEY=sk-SaLr3FQeW3PeqAHD2hFSY0ycgBli6NwmW9TvTajY3igUZPAC
OPENAI_BASE_URL=https://api.chatanywhere.tech/v1
```

如果不配置环境变量，代码会使用默认值（来自示例配置）。

---

## 错误处理

### 常见错误码

- `400`: 请求参数错误（缺少 message 或 messages）
- `401`: 未授权（token 无效或过期）
- `500`: 服务器内部错误或 AI API 调用失败

### 错误响应格式

**非流式接口**:
```json
{
  "message": "错误描述",
  "error": "详细错误信息"
}
```

**流式接口**:
```
data: {"error":true,"message":"错误描述"}
```

---

## 注意事项

1. **认证要求**: 所有接口都需要在请求头中携带有效的 JWT token
2. **流式传输**: 流式接口使用 SSE 协议，前端需要使用 `EventSource` 或 `fetch` 的流式读取方式
3. **模型选择**: 当前默认使用 `gpt-3.5-turbo`，可以通过 `model` 参数指定其他模型
4. **多轮对话**: 流式接口支持多轮对话，非流式接口目前只支持单条消息
5. **超时处理**: 建议在前端设置合理的超时时间，避免长时间等待
6. **错误重试**: 建议实现错误重试机制，提高用户体验

---

## 更新日志

- **2024-01-XX**: 初始版本，支持非流式和流式两种调用方式

