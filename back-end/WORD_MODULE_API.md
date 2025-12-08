# 单词模块 API 文档

## 概述

单词模块将3178个CET4单词随机划分为多个章节，每个章节15个单词（最后一个章节可能不足15个）。用户可以通过选择章节来学习单词，系统会记录用户的学习进度。

## 数据表结构

### 1. chapters（章节表）
- `id`: 章节ID
- `name`: 章节名称（如"第1章"）
- `order_index`: 章节顺序
- `word_count`: 该章节包含的单词数量
- `createdAt`: 创建时间

### 2. chapter_words（章节单词关联表）
- `id`: 关联ID
- `chapterId`: 章节ID
- `wordId`: 单词ID
- `order_index`: 单词在章节中的顺序

### 3. user_word_progress（用户单词学习进度表）
- `id`: 进度ID
- `userId`: 用户ID
- `wordId`: 单词ID
- `chapterId`: 章节ID
- `isMastered`: 掌握程度（0-未掌握，1-已掌握，后续可扩展为其他数字）
- `lastPracticedAt`: 最后练习时间
- `createdAt`: 创建时间
- `updatedAt`: 更新时间

### 4. user_chapter_progress（用户章节学习状态表）
- `id`: 状态ID
- `userId`: 用户ID
- `chapterId`: 章节ID
- `status`: 章节学习状态（0-未学习，1-学习中，2-已完成）
- `lastPracticedAt`: 最后练习时间
- `createdAt`: 创建时间
- `updatedAt`: 更新时间

## 初始化步骤

### 1. 导入单词（如果还没有）
```bash
npm run import:words
```

### 2. 划分章节
```bash
npm run divide:chapters
```

这个脚本会：
- 将所有单词随机打乱
- 按每章15个单词划分
- 创建章节和章节单词关联记录

**注意**：如果已经划分过章节，脚本会提示。如需重新划分，请先清空 `chapters` 和 `chapter_words` 表。

## API 接口

### 1. 获取所有章节列表

**请求**
```
GET /api/words/chapters
Authorization: Bearer <token>
```

**响应**
```json
[
  {
    "id": 1,
    "name": "第1章",
    "order_index": 1,
    "word_count": 15,
    "status": 0,
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  {
    "id": 2,
    "name": "第2章",
    "order_index": 2,
    "word_count": 15,
    "status": 1,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

**说明**：
- `status`: 章节学习状态
  - `0`: 未学习（用户从未练习过该章节）
  - `1`: 学习中（用户已开始练习，但未全部完成）
  - `2`: 已完成（该章节所有单词都已掌握）

### 2. 获取指定章节的单词列表（包含用户学习状态）

**请求**
```
GET /api/words/chapters/:chapterId
Authorization: Bearer <token>
```

**响应**
```json
{
  "chapter": {
    "id": 1,
    "name": "第1章",
    "order_index": 1,
    "word_count": 15
  },
  "words": [
    {
      "id": 1,
      "text": "abandon",
      "phonetic": "/əˈbændən/",
      "translation": "v. 放弃，抛弃",
      "isMastered": 0,
      "lastPracticedAt": null
    },
    {
      "id": 2,
      "text": "ability",
      "phonetic": "/əˈbɪləti/",
      "translation": "n. 能力，才能",
      "isMastered": 1,
      "lastPracticedAt": "2024-01-01T10:00:00.000Z"
    }
  ]
}
```

**说明**：
- `chapter.status`: 章节学习状态（0-未学习，1-学习中，2-已完成）
- `words[].isMastered`: 单词掌握程度，数字类型
  - `0`: 未掌握
  - `1`: 已掌握
  - 如果用户还没有练习过该单词，默认为 `0`
- `lastPracticedAt`: 最后练习时间，如果从未练习过则为 `null`

### 3. 提交章节练习结果

**请求**
```
POST /api/words/chapters/:chapterId/practice
Authorization: Bearer <token>
Content-Type: application/json

{
  "results": [
    {
      "wordId": 1,
      "isMastered": 1
    },
    {
      "wordId": 2,
      "isMastered": 0
    }
  ]
}
```

**说明**：
- `results`: 数组，包含该章节所有单词的练习结果
- `wordId`: 单词ID
- `isMastered`: 掌握程度，必须是数字
  - `0`: 未掌握
  - `1`: 已掌握
- **重要**：前端必须发送该章节的所有单词，每个单词都必须包含 `isMastered` 字段
```

**响应**
```json
{
  "message": "练习结果已保存",
  "stats": {
    "total": 15,
    "mastered": 8,
    "notMastered": 7
  },
  "chapterStatus": 1
}
```

**说明**：
- `stats`: 学习统计信息
- `chapterStatus`: 章节学习状态
  - `0`: 未学习（理论上不会出现，因为用户已经提交了练习结果）
  - `1`: 学习中（有部分单词未掌握）
  - `2`: 已完成（所有单词都已掌握）

**说明**：
- `results`: 数组，包含该章节所有单词的练习结果
- `wordId`: 单词ID
- `isMastered`: 是否掌握（true/false）
- 系统会自动更新或创建用户的学习进度记录

### 4. 获取用户在指定章节的学习进度统计

**请求**
```
GET /api/words/chapters/:chapterId/progress
Authorization: Bearer <token>
```

**响应**
```json
{
  "chapter": {
    "id": 1,
    "name": "第1章",
    "order_index": 1,
    "word_count": 15,
    "status": 1
  },
  "stats": {
    "total": 15,
    "mastered": 8,
    "notMastered": 7
  }
}
```

**说明**：
- `chapter.status`: 章节学习状态（0-未学习，1-学习中，2-已完成）

**说明**：
- `total`: 该章节总单词数
- `mastered`: 已掌握的单词数
- `notMastered`: 未掌握的单词数

## 使用流程

1. **用户登录后，获取章节列表**
   ```
   GET /api/words/chapters
   ```

2. **用户选择章节，获取该章节的单词列表**
   ```
   GET /api/words/chapters/:chapterId
   ```
   返回的单词列表中，每个单词都有 `isMastered` 字段，表示用户是否已掌握该单词。

3. **用户完成练习后，提交练习结果**
   ```
   POST /api/words/chapters/:chapterId/practice
   ```
   提交该章节所有单词的练习结果。

4. **用户再次选择该章节时，可以看到之前的学习状态**
   ```
   GET /api/words/chapters/:chapterId
   ```
   返回的单词列表中，已练习过的单词会显示 `isMastered` 和 `lastPracticedAt` 信息。

## 注意事项

1. 所有接口都需要用户登录（需要 JWT Token）
2. 章节划分是一次性的，划分后不会改变
3. 用户的学习进度是持久化的，下次登录后仍然可以看到
4. 同一个单词在不同章节中的学习进度是独立的
5. **单词掌握程度使用数字表示**：
   - `0`: 未掌握
   - `1`: 已掌握
   - 后续可能会扩展为其他数字（如拼写错误等）
6. **章节学习状态**：
   - `0`: 未学习（用户从未练习过该章节）
   - `1`: 学习中（用户已开始练习，但未全部完成）
   - `2`: 已完成（该章节所有单词都已掌握）
7. **提交练习结果时**：
   - 前端必须发送该章节的所有单词
   - 每个单词都必须包含 `isMastered` 字段（数字 0 或 1）
   - 系统会根据所有单词的掌握情况自动更新章节状态

