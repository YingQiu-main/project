import { Request, Response } from 'express';
import FavoriteModel from '../models/Favorite';

// 添加/移除收藏
export const toggleFavorite = async (req: Request, res: Response) => {
  try {
    const user = req.user as { userId: number; username: string } | undefined;
    const userId = user?.userId;
    const { type, targetId } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const existing = FavoriteModel.findByUserAndTarget(userId, type, targetId);

    if (existing) {
      FavoriteModel.delete(userId, type, targetId);
      res.json({ message: 'Removed from favorites', isFavorite: false });
    } else {
      FavoriteModel.create({ userId, type, targetId });
      res.json({ message: 'Added to favorites', isFavorite: true });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error toggling favorite', error });
  }
};

// 获取收藏列表
export const getFavorites = async (req: Request, res: Response) => {
  try {
    const user = req.user as { userId: number; username: string } | undefined;
    const userId = user?.userId;
    const { type } = req.query; // 可选筛选类型

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const favorites = FavoriteModel.findAllByUser(userId, type as string | undefined);
    res.json(favorites);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching favorites', error });
  }
};
