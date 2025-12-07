import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

interface FavoriteAttributes {
  id?: number;
  userId: number;
  type: 'word' | 'article' | 'sentence';
  targetId: number;
}

class Favorite extends Model<FavoriteAttributes> implements FavoriteAttributes {
  public id!: number;
  public userId!: number;
  public type!: 'word' | 'article' | 'sentence';
  public targetId!: number;
}

Favorite.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '用户ID',
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '收藏类型: word, article, sentence',
    },
    targetId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '收藏目标的ID',
    },
  },
  {
    sequelize,
    modelName: 'Favorite',
    tableName: 'favorites',
  }
);

export default Favorite;

