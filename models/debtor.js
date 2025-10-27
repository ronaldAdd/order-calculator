'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Debtor extends Model {
    static associate(models) {
      // associations jika ada
    }
  }

  Debtor.init({
    firstName: { type: DataTypes.STRING, allowNull: true },
    lastName: { type: DataTypes.STRING, allowNull: true },
    sex: { type: DataTypes.STRING, allowNull: true },
    dob: { type: DataTypes.DATEONLY, allowNull: true },
    nationalId: { type: DataTypes.STRING, allowNull: true },
    religion: { type: DataTypes.STRING, allowNull: true },
    maritalStatus: { type: DataTypes.STRING, allowNull: true },
    email: { type: DataTypes.STRING, allowNull: true },
    mobilePhones: { type: DataTypes.JSON, allowNull: true },
    homePhone: { type: DataTypes.STRING, allowNull: true },
    officePhone: { type: DataTypes.STRING, allowNull: true },
    address: { type: DataTypes.TEXT, allowNull: true },
    jobTitle: { type: DataTypes.STRING, allowNull: true },
    employerName: { type: DataTypes.STRING, allowNull: true },
    officeAddress: { type: DataTypes.TEXT, allowNull: true },
    loanId: { type: DataTypes.STRING, allowNull: true },
    productName: { type: DataTypes.STRING, allowNull: true },
    outstandingAmount: { type: DataTypes.DECIMAL, allowNull: true },
    principalAmount: { type: DataTypes.DECIMAL, allowNull: true },
    lastPaymentAmount: { type: DataTypes.DECIMAL, allowNull: true },
    lastPaymentDate: { type: DataTypes.DATEONLY, allowNull: true },
    totalPaid: { type: DataTypes.DECIMAL, allowNull: true },
    status: { type: DataTypes.STRING, allowNull: true },
    forecast: { type: DataTypes.STRING, allowNull: true },
    nextFollowUpDate: { type: DataTypes.DATEONLY, allowNull: true },
    emergencyContacts: { type: DataTypes.JSON, allowNull: true },
    bankAccounts: { type: DataTypes.JSON, allowNull: true },
    assignedCollector: { type: DataTypes.STRING, allowNull: true },
    createdBy: { type: DataTypes.STRING, allowNull: true },  // ✅ createdBy
    updatedBy: { type: DataTypes.STRING, allowNull: true },  // ✅ updatedBy
  }, {
    sequelize,
    modelName: 'Debtor',
    tableName: 'Debtors',
    timestamps: true,
  });

  return Debtor;
};
