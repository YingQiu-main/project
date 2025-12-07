import fs from 'fs';
import path from 'path';
import { initDB, Word } from '../models';

/**
 * 解析单词条目 - 支持两种格式
 * 格式1: 单词/音标/词性.释义 (例如: crystal/'kristl/n.水晶，结晶体;晶粒)
 * 格式2: 单词[音标]词性.释义 (例如: differ['difə]vi.不同,相异)
 */
function parseWordEntry(entry: string): { text: string; phonetic: string; translation: string } | null {
  // 移除首尾空格
  entry = entry.trim();
  if (!entry) return null;

  let text = '';
  let phonetic = '';
  let translation = '';

  // 尝试格式1: 单词/音标/词性.释义
  const slashMatch = entry.match(/^([^/]+)\/([^/]+)\/(.+)$/);
  if (slashMatch) {
    text = slashMatch[1].trim();
    phonetic = slashMatch[2].trim();
    translation = slashMatch[3].trim();
  } else {
    // 尝试格式2: 单词[音标]词性.释义
    const bracketMatch = entry.match(/^([a-zA-Z][a-zA-Z0-9'-]*)\[([^\]]+)\](.+)$/);
    if (bracketMatch) {
      text = bracketMatch[1].trim();
      phonetic = bracketMatch[2].trim();
      translation = bracketMatch[3].trim();
    } else {
      return null;
    }
  }

  // 验证基本格式
  if (!text || !translation) return null;

  return { text, phonetic, translation };
}

/**
 * 判断是否为词汇行
 * 现在文件里全部都是单词，只需要检查是否为空行
 */
function isWordLine(line: string): boolean {
  const trimmed = line.trim();
  // 跳过空行
  return trimmed.length > 0;
}

/**
 * 从一行中提取所有单词条目
 * 一行可能包含多个单词，用空格分隔
 * 支持两种格式:
 * - 单词/音标/词性.释义
 * - 单词[音标]词性.释义
 */
function extractWordsFromLine(line: string): Array<{ text: string; phonetic: string; translation: string }> {
  const words: Array<{ text: string; phonetic: string; translation: string }> = [];
  
  // 使用正则表达式匹配所有单词条目
  // 匹配格式1: 单词/音标/词性.释义 (例如: crystal/'kristl/n.水晶，结晶体;晶粒)
  // 匹配到下一个单词开始（单词/ 或 单词[）或行尾
  const slashPattern = /([a-zA-Z][a-zA-Z0-9'-]*)\/([^/]+)\/([^/]+?)(?=\s+[a-zA-Z][a-zA-Z0-9'-]*[\/\[]|$)/g;
  
  // 匹配格式2: 单词[音标]词性.释义 (例如: differ['difə]vi.不同,相异)
  // 匹配到下一个单词开始（单词/ 或 单词[）或行尾
  const bracketPattern = /([a-zA-Z][a-zA-Z0-9'-]*)\[([^\]]+)\]([^\[]+?)(?=\s+[a-zA-Z][a-zA-Z0-9'-]*[\/\[]|$)/g;
  
  // 收集所有匹配项及其位置
  const matches: Array<{ text: string; phonetic: string; translation: string; start: number; end: number }> = [];
  
  // 匹配格式1
  let match;
  while ((match = slashPattern.exec(line)) !== null) {
    const text = match[1].trim();
    const translation = match[3].trim();
    if (text && translation) {
      matches.push({
        text,
        phonetic: match[2].trim(),
        translation,
        start: match.index,
        end: match.index + match[0].length,
      });
    }
  }
  
  // 匹配格式2
  bracketPattern.lastIndex = 0;
  while ((match = bracketPattern.exec(line)) !== null) {
    const text = match[1].trim();
    const translation = match[3].trim();
    if (text && translation) {
      matches.push({
        text,
        phonetic: match[2].trim(),
        translation,
        start: match.index,
        end: match.index + match[0].length,
      });
    }
  }
  
  // 按位置排序，去除重叠的匹配
  matches.sort((a, b) => a.start - b.start);
  
  let lastEnd = -1;
  for (const m of matches) {
    // 如果当前匹配与上一个不重叠，则添加
    if (m.start >= lastEnd) {
      words.push({
        text: m.text,
        phonetic: m.phonetic,
        translation: m.translation,
      });
      lastEnd = m.end;
    }
  }
  
  // 如果正则匹配失败，尝试按多个空格分割（备用方案）
  if (words.length === 0) {
    // 按两个或更多空格分割（单词之间通常有多个空格）
    const parts = line.split(/\s{2,}/);
    for (const part of parts) {
      const parsed = parseWordEntry(part.trim());
      if (parsed) {
        words.push(parsed);
      }
    }
  }
  
  return words;
}

/**
 * 导入词汇到数据库
 */
async function importWords() {
  try {
    console.log('开始导入词汇...');
    
    // 初始化数据库
    await initDB();
    console.log('数据库初始化完成');
    
    // 读取词汇文件
    const wordsFilePath = path.join(__dirname, '../../../words/四级词汇总表.txt');
    
    if (!fs.existsSync(wordsFilePath)) {
      throw new Error(`词汇文件不存在: ${wordsFilePath}`);
    }
    
    const fileContent = fs.readFileSync(wordsFilePath, 'utf-8');
    const lines = fileContent.split('\n');
    
    console.log(`读取文件完成，共 ${lines.length} 行`);
    
    // 解析所有单词
    const allWords: Array<{ text: string; phonetic: string; translation: string }> = [];
    let lineNumber = 0;
    
    for (const line of lines) {
      lineNumber++;
      
      // 跳过非词汇行
      if (!isWordLine(line)) {
        continue;
      }
      
      // 提取该行中的所有单词
      const words = extractWordsFromLine(line);
      allWords.push(...words);
      
      if (lineNumber % 100 === 0) {
        console.log(`已处理 ${lineNumber} 行，提取 ${allWords.length} 个单词...`);
      }
    }
    
    console.log(`\n共提取 ${allWords.length} 个单词`);
    
    // 去重（基于单词文本）
    const uniqueWords = new Map<string, { text: string; phonetic: string; translation: string }>();
    for (const word of allWords) {
      const key = word.text.toLowerCase();
      if (!uniqueWords.has(key)) {
        uniqueWords.set(key, word);
      } else {
        // 如果已存在，合并翻译（如果不同）
        const existing = uniqueWords.get(key)!;
        if (existing.translation !== word.translation) {
          existing.translation += '; ' + word.translation;
        }
      }
    }
    
    console.log(`去重后共 ${uniqueWords.size} 个唯一单词`);
    
    // 批量导入到数据库
    const wordsArray = Array.from(uniqueWords.values());
    let imported = 0;
    let skipped = 0;
    
    // 分批导入，每批100个
    const batchSize = 100;
    for (let i = 0; i < wordsArray.length; i += batchSize) {
      const batch = wordsArray.slice(i, i + batchSize);
      
      for (const word of batch) {
        try {
          // 使用 findOrCreate 避免重复插入
          const [instance, created] = await Word.findOrCreate({
            where: { text: word.text },
            defaults: {
              text: word.text,
              phonetic: word.phonetic,
              translation: word.translation,
            },
          });
          
          if (created) {
            imported++;
          } else {
            // 如果已存在，更新翻译和音标（如果需要）
            if (instance.translation !== word.translation || instance.phonetic !== word.phonetic) {
              await instance.update({
                phonetic: word.phonetic,
                translation: word.translation,
              });
              imported++;
            } else {
              skipped++;
            }
          }
        } catch (error) {
          console.error(`导入单词 "${word.text}" 时出错:`, error);
        }
      }
      
      if ((i + batchSize) % 500 === 0 || i + batchSize >= wordsArray.length) {
        console.log(`已处理 ${Math.min(i + batchSize, wordsArray.length)}/${wordsArray.length} 个单词...`);
      }
    }
    
    console.log(`\n导入完成！`);
    console.log(`- 新导入: ${imported} 个单词`);
    console.log(`- 跳过（已存在）: ${skipped} 个单词`);
    console.log(`- 总计: ${imported + skipped} 个单词`);
    
    // 统计数据库中的总单词数
    const totalCount = await Word.count();
    console.log(`\n数据库中现有单词总数: ${totalCount}`);
    
    process.exit(0);
  } catch (error) {
    console.error('导入过程中出错:', error);
    process.exit(1);
  }
}

// 执行导入
importWords();
