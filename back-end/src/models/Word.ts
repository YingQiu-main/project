import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import sequelize from '../config/database';

class Word extends Model<InferAttributes<Word>, InferCreationAttributes<Word>> {
  declare id: CreationOptional<number>;
  declare text: string;
  declare phonetic: CreationOptional<string>;
  declare translation: string;
}

Word.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    text: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    phonetic: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    translation: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'words',
  }
);

export default Word;
