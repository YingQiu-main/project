import { initDatabase } from '../config/database';
import WordModel from '../models/Word';
import ChapterModel from '../models/Chapter';
import ChapterWordModel from '../models/ChapterWord';

/**
 * 将四级单词随机划分为章节
 * 每个章节15个单词，最后一个章节可不足15个
 */
async function divideCET4WordsIntoChapters() {
  try {
    console.log('开始划分四级单词章节...');
    
    // 初始化数据库
    initDatabase();
    console.log('数据库初始化完成');
    
    // 获取所有四级单词
    const allWords = WordModel.findByLevel('cet4');
    const totalWords = allWords.length;
    
    if (totalWords === 0) {
      throw new Error('数据库中没有四级单词，请先导入四级单词');
    }
    
    console.log(`共找到 ${totalWords} 个四级单词`);
    
    // 检查是否已经划分过四级章节
    const existingChapters = ChapterModel.findByLevel('cet4');
    if (existingChapters.length > 0) {
      console.log(`检测到已存在 ${existingChapters.length} 个四级章节，是否要重新划分？`);
      console.log('如需重新划分，请先清空 chapters 和 chapter_words 表中对应的四级数据');
      return;
    }
    
    // 随机打乱单词顺序
    const shuffledWords = [...allWords].sort(() => Math.random() - 0.5);
    
    // 计算需要的章节数（每个章节15个单词）
    const wordsPerChapter = 15;
    const totalChapters = Math.ceil(totalWords / wordsPerChapter);
    
    console.log(`将划分为 ${totalChapters} 个四级章节，每个章节最多 ${wordsPerChapter} 个单词`);
    
    // 创建章节并分配单词
    const chapterWords: Array<{ chapterId: number; wordId: number; order_index: number }> = [];
    
    for (let i = 0; i < totalChapters; i++) {
      const startIndex = i * wordsPerChapter;
      const endIndex = Math.min(startIndex + wordsPerChapter, totalWords);
      const chapterWordsList = shuffledWords.slice(startIndex, endIndex);
      
      // 创建章节
      const chapter = ChapterModel.create({
        name: `四级-第${i + 1}章`,
        order_index: i + 1,
        word_count: chapterWordsList.length,
        level: 'cet4'
      });
      
      console.log(`创建四级章节: ${chapter.name}，包含 ${chapterWordsList.length} 个单词`);
      
      // 准备章节单词关联数据
      chapterWordsList.forEach((word, index) => {
        chapterWords.push({
          chapterId: chapter.id,
          wordId: word.id,
          order_index: index + 1
        });
      });
    }
    
    // 批量插入章节单词关联
    console.log('正在保存四级章节单词关联...');
    ChapterWordModel.batchCreate(chapterWords);
    
    console.log(`\n四级章节划分完成！`);
    console.log(`- 总章节数: ${totalChapters}`);
    console.log(`- 总单词数: ${totalWords}`);
    console.log(`- 每个章节单词数: ${wordsPerChapter}（最后一个章节可能不足）`);
    
    // 验证数据
    const chapters = ChapterModel.findByLevel('cet4');
    let totalWordsInChapters = 0;
    for (const chapter of chapters) {
      const wordIds = ChapterWordModel.findWordIdsByChapterId(chapter.id);
      totalWordsInChapters += wordIds.length;
    }
    
    console.log(`\n验证结果:`);
    console.log(`- 四级章节数: ${chapters.length}`);
    console.log(`- 四级章节中单词总数: ${totalWordsInChapters}`);
    console.log(`- 数据一致性: ${totalWordsInChapters === totalWords ? '✓ 一致' : '✗ 不一致'}`);
    
    process.exit(0);
  } catch (error) {
    console.error('划分四级章节过程中出错:', error);
    process.exit(1);
  }
}

// 执行划分
divideCET4WordsIntoChapters();

