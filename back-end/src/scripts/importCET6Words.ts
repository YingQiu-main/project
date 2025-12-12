import fs from 'fs';
import path from 'path';
import { initDatabase } from '../config/database';
import WordModel from '../models/Word';

/**
 * 解析六级词汇条目
 * 格式：
 * 序号. 单词	音标
 * 词性. 释义
 * (空行)
 */
function parseCET6WordEntry(lines: string[]): { text: string; phonetic: string; translation: string } | null {
  if (lines.length < 2) return null;

  const line1 = lines[0].trim(); // 序号. 单词	音标
  const line2 = lines[1].trim(); // 词性. 释义

  if (!line1 || !line2) return null;

  // 解析第一行：序号. 单词	音标
  // 匹配格式：数字. 单词	音标 或 数字. 单词	音标1; 音标2
  const match1 = line1.match(/^\d+\.\s+([^\t]+)\t(.+)$/);
  if (!match1) return null;

  const text = match1[1].trim();
  let phonetic = match1[2].trim();
  
  // 如果音标包含分号，只取第一个
  if (phonetic.includes(';')) {
    phonetic = phonetic.split(';')[0].trim();
  }

  // 解析第二行：词性. 释义
  const translation = line2.trim();

  // 验证基本格式
  if (!text || !translation) return null;

  return { text, phonetic, translation };
}

/**
 * 导入六级词汇到数据库
 */
async function importCET6Words() {
  try {
    console.log('开始导入六级词汇...');
    
    // 初始化数据库
    initDatabase();
    console.log('数据库初始化完成');
    
    // 读取词汇文件
    const wordsFilePath = path.join(__dirname, '../../../words/六级.txt');
    
    if (!fs.existsSync(wordsFilePath)) {
      throw new Error(`词汇文件不存在: ${wordsFilePath}`);
    }
    
    const fileContent = fs.readFileSync(wordsFilePath, 'utf-8');
    const lines = fileContent.split('\n');
    
    console.log(`读取文件完成，共 ${lines.length} 行`);
    
    // 解析所有单词
    const allWords: Array<{ text: string; phonetic: string; translation: string }> = [];
    let lineNumber = 0;
    let entryLines: string[] = [];
    
    for (const line of lines) {
      lineNumber++;
      
      const trimmed = line.trim();
      
      // 如果是空行，说明一个单词条目结束
      if (trimmed === '') {
        if (entryLines.length >= 2) {
          const word = parseCET6WordEntry(entryLines);
          if (word) {
            allWords.push(word);
          }
        }
        entryLines = [];
        continue;
      }
      
      // 收集当前条目的行
      entryLines.push(line);
      
      // 如果收集到2行（单词行和释义行），尝试解析
      if (entryLines.length === 2) {
        const word = parseCET6WordEntry(entryLines);
        if (word) {
          allWords.push(word);
          entryLines = []; // 清空，准备下一个条目
        }
      }
      
      if (lineNumber % 1000 === 0) {
        console.log(`已处理 ${lineNumber} 行，提取 ${allWords.length} 个单词...`);
      }
    }
    
    // 处理最后一个条目（如果文件末尾没有空行）
    if (entryLines.length >= 2) {
      const word = parseCET6WordEntry(entryLines);
      if (word) {
        allWords.push(word);
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
        // 如果音标不同，保留更完整的音标
        if (word.phonetic && (!existing.phonetic || word.phonetic.length > existing.phonetic.length)) {
          existing.phonetic = word.phonetic;
        }
      }
    }
    
    console.log(`去重后共 ${uniqueWords.size} 个唯一单词`);
    
    // 批量导入到数据库
    const wordsArray = Array.from(uniqueWords.values());
    let imported = 0;
    let skipped = 0;
    let updated = 0;
    
    // 分批导入，每批100个
    const batchSize = 100;
    for (let i = 0; i < wordsArray.length; i += batchSize) {
      const batch = wordsArray.slice(i, i + batchSize);
      
      for (const word of batch) {
        try {
          const existing = WordModel.findByText(word.text);
          if (existing) {
            // 如果已存在，检查是否需要更新
            if (existing.translation !== word.translation || existing.phonetic !== word.phonetic) {
              WordModel.update(existing.id, {
                phonetic: word.phonetic || existing.phonetic,
                translation: word.translation
              });
              updated++;
            } else {
              skipped++;
            }
          } else {
            WordModel.create({
              text: word.text,
              phonetic: word.phonetic || null,
              translation: word.translation,
              level: 'cet6'
            });
            imported++;
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
    console.log(`- 更新: ${updated} 个单词`);
    console.log(`- 跳过（已存在且未变）: ${skipped} 个单词`);
    
    // 统计数据库中的总单词数
    const totalCount = WordModel.count();
    console.log(`\n数据库中现有单词总数: ${totalCount}`);
    
    process.exit(0);
  } catch (error) {
    console.error('导入过程中出错:', error);
    process.exit(1);
  }
}

// 执行导入
importCET6Words();

