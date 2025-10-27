'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // contoh: kalau mau relasi ke Debtor
      // User.hasMany(models.Debtor, { foreignKey: 'assignedCollector', sourceKey: 'id' });
    }
  }

  User.init({
    id: {
      type: DataTypes.STRING,
      primaryKey: true, // karena pakai UID dari Firebase
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true,
      },
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
    createdBy: {
      type: DataTypes.STRING,
      allowNull: true, // bisa diubah ke false jika wajib
    },
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'Users',
    timestamps: true,
  });

  return User;
};
