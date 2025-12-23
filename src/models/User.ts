import type { Optional } from 'sequelize';
import { DataTypes, Model } from 'sequelize';
import database from '../config/database.js';
import NoteShare from './NoteShare.js';

interface UserAttributes {
  id: number;
  username: string;
  email: string;
  password: string;
  refreshToken?: string | null;
  refreshTokenExpiresAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id'> {}

class User extends Model<UserAttributes, UserCreationAttributes> {
  declare id: number;
  declare username: string;
  declare email: string;
  declare password: string;
  declare refreshToken: string | null;
  declare refreshTokenExpiresAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  public toJSON(): any {
    const values = { ...this.get() } as Partial<UserAttributes>;
    delete values.password;
    delete values.refreshToken;
    delete values.refreshTokenExpiresAt;
    return values;
  }

  public isRefreshTokenExpired(): boolean {
    if (!this.refreshTokenExpiresAt) {
      return true;
    }
    return new Date() > this.refreshTokenExpiresAt;
  }
}


User.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 50]
      },
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    refreshToken: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: null,
    },
    refreshTokenExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize: database.sequelize,
    tableName: 'users',
    timestamps: true,
    underscored: true,
    indexes: [],
  }
);

export default User;