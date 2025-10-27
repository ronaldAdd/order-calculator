'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('debtors', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      firstName: {
        type: Sequelize.STRING
      },
      lastName: {
        type: Sequelize.STRING
      },
      sex: {
        type: Sequelize.STRING
      },
      dob: {
        type: Sequelize.DATEONLY
      },
      nationalId: {
        type: Sequelize.STRING
      },
      religion: {
        type: Sequelize.STRING
      },
      maritalStatus: {
        type: Sequelize.STRING
      },
      email: {
        type: Sequelize.STRING
      },
      mobilePhones: {
        type: Sequelize.JSON
      },
      homePhone: {
        type: Sequelize.STRING
      },
      officePhone: {
        type: Sequelize.STRING
      },
      address: {
        type: Sequelize.TEXT
      },
      jobTitle: {
        type: Sequelize.STRING
      },
      employerName: {
        type: Sequelize.STRING
      },
      officeAddress: {
        type: Sequelize.TEXT
      },
      loanId: {
        type: Sequelize.STRING
      },
      productName: {
        type: Sequelize.STRING
      },
      outstandingAmount: {
        type: Sequelize.DECIMAL
      },
      principalAmount: {
        type: Sequelize.DECIMAL
      },
      lastPaymentAmount: {
        type: Sequelize.DECIMAL
      },
      lastPaymentDate: {
        type: Sequelize.DATEONLY
      },
      totalPaid: {
        type: Sequelize.DECIMAL
      },
      status: {
        type: Sequelize.STRING
      },
      forecast: {
        type: Sequelize.STRING
      },
      nextFollowUpDate: {
        type: Sequelize.DATEONLY
      },
      emergencyContacts: {
        type: Sequelize.JSON
      },
      bankAccounts: {
        type: Sequelize.JSON
      },
      assignedCollector: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      createdBy: { // ✅ Tambahan kolom createdBy
        type: Sequelize.STRING,
        allowNull: true,
        // uncomment jika ingin foreign key ke tabel Users:
        // references: {
        //   model: 'Users',
        //   key: 'id'
        // },
        // onUpdate: 'CASCADE',
        // onDelete: 'SET NULL'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('debtors');
  }
};
