import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

interface SentenceAttributes {
  id?: number;
  content: string;
  translation: string;
  analysis?: string;
}

class Sentence extends Model<SentenceAttributes> implements SentenceAttributes {
  public id!: number;
  public content!: string;
  public translation!: string;
  public analysis!: string;
}

Sentence.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '英文句子内容',
    },
    translation: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '中文翻译',
    },
    analysis: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '句子解析/语法分析',
    },
  },
  {
    sequelize,
    modelName: 'Sentence',
    tableName: 'sentences',
  }
);

export default Sentence;

