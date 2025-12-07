import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

interface StudyRecordAttributes {
  id?: number;
  userId: number;
  type: 'word' | 'article' | 'sentence';
  targetId: number; // 单词ID 或 文章ID
  isCorrect?: boolean; // 仅针对单词练习
  action: string; // e.g., 'practice', 'read', 'view'
}

class StudyRecord extends Model<StudyRecordAttributes> implements StudyRecordAttributes {
  public id!: number;
  public userId!: number;
  public type!: 'word' | 'article' | 'sentence';
  public targetId!: number;
  public isCorrect!: boolean;
  public action!: string;
}

StudyRecord.init(
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
      comment: '记录类型: word, article, sentence',
    },
    targetId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '目标内容的ID',
    },
    isCorrect: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      comment: '是否正确 (针对单词练习)',
    },
    action: {
      type: DataTypes.STRING,
      defaultValue: 'practice',
      comment: '具体操作: practice, read, view',
    }
  },
  {
    sequelize,
    modelName: 'StudyRecord',
    tableName: 'study_records',
  }
);

export default StudyRecord;

