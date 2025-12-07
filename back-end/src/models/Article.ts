import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

interface ArticleAttributes {
  id?: number;
  title: string;
  content: string;
  translation?: string;
  difficulty?: number;
}

class Article extends Model<ArticleAttributes> implements ArticleAttributes {
  public id!: number;
  public title!: string;
  public content!: string;
  public translation!: string;
  public difficulty!: number;
}

Article.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '文章标题',
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '文章内容',
    },
    translation: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '中文翻译',
    },
    difficulty: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: '难度等级',
    },
  },
  {
    sequelize,
    modelName: 'Article',
    tableName: 'articles',
  }
);

export default Article;

