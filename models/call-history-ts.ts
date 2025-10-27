// models/call-history-ts.ts
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@/lib/db';
import Debtor from './debtor-ts';
import User from './user-ts';

interface CallHistoryAttributes {
  id?: number;
  debtorId: number;
  collectorId: string;
  timestamp: Date;
  notes: string;
  callOutcome: string;
  ptpDate?: Date;
  ptpAmount?: number;
  callSid?: string | null;
  callDuration?: number | null;
  callStatus?: string | null;
  recordingUrl?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
}

type CallHistoryCreationAttributes = Optional<CallHistoryAttributes, 'id'>;

class CallHistory extends Model<CallHistoryAttributes, CallHistoryCreationAttributes> implements CallHistoryAttributes {
  public id!: number;
  public debtorId!: number;
  public collectorId!: string;
  public timestamp!: Date;
  public notes!: string;
  public callOutcome!: string;
  public ptpDate?: Date;
  public ptpAmount?: number;
  public callSid?: string | null;
  public callDuration?: number | null;
  public callStatus?: string | null;
  public recordingUrl?: string | null;
  public createdBy?: string | null;
  public updatedBy?: string | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

CallHistory.init(
  {
    debtorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'debtors',
        key: 'id',
      },
    },
    collectorId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    notes: {
      type: DataTypes.STRING(1000),
      allowNull: false,
    },
    callOutcome: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    ptpDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    ptpAmount: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    callSid: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    callDuration: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    callStatus: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    recordingUrl: {
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
    modelName: 'CallHistory',
    tableName: 'call_histories',
    timestamps: true,
  }
);

export default CallHistory;
