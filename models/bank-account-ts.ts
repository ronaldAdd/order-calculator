import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@/lib/db';
import Debtor from './debtor-ts'; // Import model Debtor

interface BankAccountAttributes {
  id?: number;
  debtorId: number; // Relasi dengan Debtor
  accountType: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  createdBy?: string | null;
  updatedBy?: string | null;
}

type BankAccountCreationAttributes = Optional<BankAccountAttributes, 'id'>;

class BankAccount extends Model<BankAccountAttributes, BankAccountCreationAttributes> implements BankAccountAttributes {
  public id!: number;
  public debtorId!: number;
  public accountType!: string;
  public bankName!: string;
  public accountNumber!: string;
  public accountHolder!: string;
  public createdBy?: string | null;
  public updatedBy?: string | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

BankAccount.init(
  {
    debtorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'debtors', // Relasi ke Debtor
        key: 'id',
      },
       onDelete: 'CASCADE',
    },
    accountType: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [['Bank Account', 'Virtual Account']],
      },
    },
    bankName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    accountNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    accountHolder: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    updatedBy: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'BankAccount',
    tableName: 'bank_accounts',
    timestamps: true,
  }
);


export default BankAccount;
