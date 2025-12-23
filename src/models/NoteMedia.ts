import type { Optional } from 'sequelize';
import { DataTypes, Model } from 'sequelize';
import database from '../config/database.js';

interface NoteMediaAttributes {
  id: number;
  noteId: number;
  filename: string;
  mimeType: string;
  size: number;
  data: Buffer;
  createdAt?: Date;
}

interface NoteMediaCreationAttributes
  extends Optional<NoteMediaAttributes, 'id'> {}

class NoteMedia
  extends Model<NoteMediaAttributes, NoteMediaCreationAttributes>
  implements NoteMediaAttributes
{
  declare id: number;
  declare noteId: number;
  declare filename: string;
  declare mimeType: string;
  declare size: number;
  declare data: Buffer;
  declare readonly createdAt: Date;
}

NoteMedia.init(
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
    filename: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    mimeType: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    size: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    data: {
      type: DataTypes.BLOB('long'), // supports large media
      allowNull: false,
    },
  },
  {
    sequelize: database.sequelize,
    tableName: 'note_media',
    timestamps: true,
    updatedAt: false,
    underscored: true,
  }
);

export default NoteMedia;
