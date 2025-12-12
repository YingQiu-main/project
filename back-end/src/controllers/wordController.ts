import { Request, Response } from 'express';
import WordModel from '../models/Word';
import ChapterModel from '../models/Chapter';
import ChapterWordModel from '../models/ChapterWord';
import UserWordProgressModel, { UserWordProgress } from '../models/UserWordProgress';
import UserChapterProgressModel from '../models/UserChapterProgress';

// 获取所有章节列表（包含用户学习状态）
// 支持通过查询参数 level 过滤：?level=cet4 或 ?level=cet6
export const getChapters = async (req: Request, res: Response) => {
  try {
    const user = req.user as { userId: number; username: string } | undefined;
    const userId = user?.userId;

    if (!userId) {
      return res.status(401).json({ message: '未授权' });
    }

    // 获取查询参数中的level（可选）
    const level = req.query.level as 'cet4' | 'cet6' | undefined;
    
    // 根据level过滤章节，如果没有指定level则返回所有章节
    const chapters = level 
      ? ChapterModel.findByLevel(level)
      : ChapterModel.findAll();
    
    // 获取用户所有章节的学习状态
    const userChapterProgressList = UserChapterProgressModel.findAllByUser(userId);
    const progressMap = new Map<number, number>(); // chapterId -> status
    userChapterProgressList.forEach(progress => {
      progressMap.set(progress.chapterId, progress.status);
    });

    // 组合章节信息和用户学习状态
    const chaptersWithStatus = chapters.map(chapter => {
      const status = progressMap.get(chapter.id) ?? 0; // 如果没有记录，默认为0（未学习）
      return {
        ...chapter,
        status // 0-未学习，1-学习中，2-已完成
      };
    });

    res.json(chaptersWithStatus);
  } catch (error) {
    console.error('获取章节列表失败:', error);
    res.status(500).json({ message: '获取章节列表失败' });
  }
};

// 获取指定章节的单词列表（包含用户学习状态）
export const getChapterWords = async (req: Request, res: Response) => {
  try {
    const { chapterId } = req.params;
    const user = req.user as { userId: number; username: string } | undefined;
    const userId = user?.userId;

    if (!userId) {
      return res.status(401).json({ message: '未授权' });
    }

    // 检查章节是否存在
    const chapter = ChapterModel.findById(Number(chapterId));
    if (!chapter) {
      return res.status(404).json({ message: '章节不存在' });
    }

    // 获取该章节的所有单词ID（按顺序）
    const wordIds = ChapterWordModel.findWordIdsByChapterId(Number(chapterId));
    
    // 获取该章节的所有单词信息
    const words = wordIds
      .map(wordId => WordModel.findById(wordId))
      .filter(word => word !== undefined) as Array<NonNullable<ReturnType<typeof WordModel.findById>>>;

    // 获取用户在该章节的学习进度
    const progressList = UserWordProgressModel.findByUserChapter(userId, Number(chapterId));
    const progressMap = new Map<number, UserWordProgress>();
    progressList.forEach(progress => {
      progressMap.set(progress.wordId, progress);
    });

    // 组合单词信息和学习状态
    const wordsWithProgress = words.map(word => {
      const progress = progressMap.get(word.id);
      return {
        ...word,
        isMastered: progress ? progress.isMastered : 0, // 如果没有进度记录，默认为0（未掌握），否则返回数字 0 或 1
        lastPracticedAt: progress?.lastPracticedAt || null
      };
    });

    // 获取用户在该章节的学习状态
    const chapterProgress = UserChapterProgressModel.findByUserChapter(userId, Number(chapterId));
    const chapterStatus = chapterProgress ? chapterProgress.status : 0; // 如果没有记录，默认为0（未学习）

    res.json({
      chapter: {
        id: chapter.id,
        name: chapter.name,
        order_index: chapter.order_index,
        word_count: chapter.word_count,
        status: chapterStatus // 0-未学习，1-学习中，2-已完成
      },
      words: wordsWithProgress
    });
  } catch (error) {
    console.error('获取章节单词失败:', error);
    res.status(500).json({ message: '获取章节单词失败' });
  }
};

// 提交章节练习结果
export const submitChapterPractice = async (req: Request, res: Response) => {
  try {
    const { chapterId } = req.params;
    const { results } = req.body; // results: [{ wordId, isMastered }] 其中 isMastered 是数字 0 或 1
    const user = req.user as { userId: number; username: string } | undefined;
    const userId = user?.userId;

    if (!userId) {
      return res.status(401).json({ message: '未授权' });
    }

    // 检查章节是否存在
    const chapter = ChapterModel.findById(Number(chapterId));
    if (!chapter) {
      return res.status(404).json({ message: '章节不存在' });
    }

    // 验证results格式
    if (!Array.isArray(results)) {
      return res.status(400).json({ message: '练习结果格式错误' });
    }

    // 验证每个结果项
    for (const result of results) {
      if (typeof result.wordId !== 'number' || typeof result.isMastered !== 'number') {
        return res.status(400).json({ message: '练习结果格式错误：wordId 和 isMastered 必须是数字' });
      }
      if (result.isMastered !== 0 && result.isMastered !== 1) {
        return res.status(400).json({ message: '练习结果格式错误：isMastered 只能是 0 或 1' });
      }
    }

    // 准备进度数据（isMastered 已经是数字 0 或 1）
    const now = new Date().toISOString();
    const progresses = results.map((result: { wordId: number; isMastered: number }) => ({
      userId,
      wordId: result.wordId,
      chapterId: Number(chapterId),
      isMastered: result.isMastered, // 直接使用数字，0-未掌握，1-已掌握
      lastPracticedAt: now
    }));

    // 批量更新用户单词学习进度
    UserWordProgressModel.batchUpsert(progresses);

    // 计算章节完成状态
    // 如果所有单词都已掌握（isMastered === 1），则章节状态为已完成（2）
    // 如果有部分单词已掌握，则章节状态为学习中（1）
    // 如果没有任何单词已掌握，则章节状态为学习中（1）
    const allMastered = results.every((result: { isMastered: number }) => result.isMastered === 1);
    const chapterStatus = allMastered ? 2 : 1; // 2-已完成，1-学习中

    // 更新用户章节学习状态
    UserChapterProgressModel.upsert({
      userId,
      chapterId: Number(chapterId),
      status: chapterStatus,
      lastPracticedAt: now
    });

    // 获取更新后的统计信息
    const stats = UserWordProgressModel.getChapterStats(userId, Number(chapterId));

    res.json({
      message: '练习结果已保存',
      stats,
      chapterStatus // 返回章节状态：0-未学习，1-学习中，2-已完成
    });
  } catch (error) {
    console.error('提交练习结果失败:', error);
    res.status(500).json({ message: '提交练习结果失败' });
  }
};

// 获取用户在指定章节的学习进度统计
export const getChapterProgress = async (req: Request, res: Response) => {
  try {
    const { chapterId } = req.params;
    const user = req.user as { userId: number; username: string } | undefined;
    const userId = user?.userId;

    if (!userId) {
      return res.status(401).json({ message: '未授权' });
    }

    // 检查章节是否存在
    const chapter = ChapterModel.findById(Number(chapterId));
    if (!chapter) {
      return res.status(404).json({ message: '章节不存在' });
    }

    // 获取统计信息
    const stats = UserWordProgressModel.getChapterStats(userId, Number(chapterId));

    // 获取用户在该章节的学习状态
    const chapterProgress = UserChapterProgressModel.findByUserChapter(userId, Number(chapterId));
    const chapterStatus = chapterProgress ? chapterProgress.status : 0; // 如果没有记录，默认为0（未学习）

    res.json({
      chapter: {
        id: chapter.id,
        name: chapter.name,
        order_index: chapter.order_index,
        word_count: chapter.word_count,
        status: chapterStatus // 0-未学习，1-学习中，2-已完成
      },
      stats
    });
  } catch (error) {
    console.error('获取章节进度失败:', error);
    res.status(500).json({ message: '获取章节进度失败' });
  }
};

// 获取随机单词（保留原有接口）
export const getRandomWord = async (req: Request, res: Response) => {
  try {
    const word = WordModel.findRandom();

    if (!word) {
      return res.status(404).json({ message: '数据库中没有单词' });
    }

    res.json(word);
  } catch (error) {
    console.error('获取随机单词失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};
