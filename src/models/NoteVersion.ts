import type { Optional } from 'sequelize';
import { DataTypes, Model } from 'sequelize';
import database from '../config/database.js';
import Note from './Note.js';

interface NoteVersionAttributes {
  id: number;
  noteId: number;
  title: string;
  content: string;
  versionNumber: number;
  createdBy: number;
  createdAt?: Date;
}

interface NoteVersionCreationAttributes 
  extends Optional<NoteVersionAttributes, 'id'> {}

class NoteVersion extends Model<NoteVersionAttributes, NoteVersionCreationAttributes> 
  implements NoteVersionAttributes {
  declare id: number;
  declare noteId: number;
  declare title: string;
  declare content: string;
  declare versionNumber: number;
  declare createdBy: number;
  declare readonly createdAt: Date;
}

NoteVersion.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    noteId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'notes',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    versionNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    createdBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
  },
  {
    sequelize: database.sequelize,
    tableName: 'note_versions',
    timestamps: true,
    updatedAt: false,
    underscored: true,
    indexes: [
      {
        fields: ['note_id', 'version_number'],
      },
    ],
  }
);

export default NoteVersion;