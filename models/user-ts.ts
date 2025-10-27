import { Model, DataTypes } from "sequelize";
import sequelize from "@/lib/db";

class User extends Model {
  declare id: string;
  declare name: string | null;
  declare email: string;
  declare role: string;
  declare avatar: string | null;
  declare bio: string | null;
  declare phoneNumber: string | null;
  declare disabled: boolean;
  declare createdBy: string | null; // ✅ tambahkan deklarasi field
}

User.init({
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  avatar: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  disabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  createdBy: { // ✅ tambahkan definisi init field
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  sequelize,
  modelName: "User",
  tableName: "Users",
  timestamps: true,
});

export default User;
