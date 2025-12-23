import type { Optional } from 'sequelize';
import { DataTypes, Model } from 'sequelize';
import database from '../config/database.js';
import User from './User.js';
import NoteShare from './NoteShare.js';

interface NoteAttributes {
  id: number;
  title: string;
  content: string;
  userId: number;
  version: number; 
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface NoteCreationAttributes extends Optional<NoteAttributes, 'id' | 'deletedAt' | 'version'> {}

class Note extends Model<NoteAttributes, NoteCreationAttributes> implements NoteAttributes {
  declare id: number;
  declare title: string;
  declare content: string;
  declare userId: number;
  declare version: number;
  declare deletedAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Note.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255],
      },
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    version: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize: database.sequelize,
    tableName: 'notes',
    timestamps: true,
    underscored: true,
    paranoid: true,
    indexes: [
      {
        fields: ['user_id'],
      },
      {
        type: 'FULLTEXT',
        fields: ['title', 'content'],
      },
    ],
  }
);

export default Note;