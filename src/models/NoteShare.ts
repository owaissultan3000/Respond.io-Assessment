import type { Optional } from 'sequelize';
import { DataTypes, Model } from 'sequelize';
import database from '../config/database.js';
import Note from './Note.js';
import User from './User.js';

export type NotePermission = 'READ' | 'EDIT';

interface NoteShareAttributes {
  id: number;
  noteId: number;
  userId: number;
  permission: NotePermission;
  createdAt?: Date;
  updatedAt?: Date;
}

interface NoteShareCreationAttributes
  extends Optional<NoteShareAttributes, 'id'> {}

class NoteShare
  extends Model<NoteShareAttributes, NoteShareCreationAttributes>
  implements NoteShareAttributes {
  declare id: number;
  declare noteId: number;
  declare userId: number;
  declare permission: NotePermission;
  declare note?: Note;
  declare user?: User;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

NoteShare.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    noteId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'notes', key: 'id' },
      onDelete: 'CASCADE',
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    permission: {
      type: DataTypes.ENUM('READ', 'EDIT'),
      allowNull: false,
      defaultValue: 'READ',
    },
  },
  {
    sequelize: database.sequelize,
    tableName: 'note_shares',
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['note_id', 'user_id'] },
    ],
  }
);

export default NoteShare;
