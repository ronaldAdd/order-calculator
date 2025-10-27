// models/debtor-ts.ts
//FINAL
// field statusAccount

import { DataTypes, Model, Optional } from 'sequelize'
import sequelize from '@/lib/db'

export interface DebtorAttributes {
  id?: number
  firstName?: string
  lastName?: string
  fullName?: string
  size?: string
  sex?: string
  dob?: Date
  nationalId?: string
  religion?: string
  maritalStatus?: string
  email?: string
  mobilePhones?: any
  homePhone?: string
  officePhone?: string
  address?: string
  homeAddress1?: string
  homeAddress2?: string
  homeAddress3?: string
  homeLocation?: string
  homeZip?: string
  jobTitle?: string
  employerName?: string
  officeAddress?: string
  officeAddress1?: string
  officeAddress2?: string
  officeAddress3?: string
  officeLocation?: string
  officeZip?: string
  loanId?: string
  productName?: string
  schemeCd?: string
  outstandingAmount?: number
  principalAmount?: number
  lastPaymentAmount?: number
  lastPaymentDate?: Date
  interestRate?: number
  penaltyFees?: number
  totalPaid?: number
  status?: string
  statusAccount?: string
  forecast?: string
  nextFollowUpDate?: Date
  chargeOff?: Date
  installment?: number
  startDate?: Date
  tenor?: string
  rutinAmount?: number
  handle?: string
  isHighPriority?: boolean
  assignedCollector?: string | null
  createdBy?: string | null
  updatedBy?: string | null
}

type DebtorCreationAttributes = Optional<DebtorAttributes, 'id'>

class Debtor extends Model<DebtorAttributes, DebtorCreationAttributes>
  implements DebtorAttributes {
  public id!: number
  public firstName?: string
  public lastName?: string
  public fullName?: string
  public size?: string
  public sex?: string
  public dob?: Date
  public nationalId?: string
  public religion?: string
  public maritalStatus?: string
  public email?: string
  public mobilePhones?: any
  public homePhone?: string
  public officePhone?: string
  public address?: string
  public homeAddress1?: string
  public homeAddress2?: string
  public homeAddress3?: string
  public homeLocation?: string
  public homeZip?: string  
  public jobTitle?: string
  public employerName?: string
  public officeAddress?: string
  public officeAddress1?: string
  public officeAddress2?: string
  public officeAddress3?: string
  public officeLocation?: string
  public officeZip?: string  
  public loanId?: string
  public productName?: string
  public schemeCd?: string
  public outstandingAmount?: number
  public principalAmount?: number
  public lastPaymentAmount?: number
  public lastPaymentDate?: Date
  public interestRate?: number
  public penaltyFees?: number
  public totalPaid?: number
  public status?: string
  public statusAccount?: string
  public forecast?: string
  public nextFollowUpDate?: Date
  public chargeOff?: Date 
  public installment?: number
  public startDate?: Date
  public tenor?: string
  public rutinAmount?: number
  public handle?: string
  public isHighPriority?: boolean
  public assignedCollector?: string | null
  public createdBy?: string | null
  public updatedBy?: string | null

  public readonly createdAt!: Date
  public readonly updatedAt!: Date
}

Debtor.init(
  {
    firstName: { type: DataTypes.STRING, allowNull: true },
    lastName: { type: DataTypes.STRING, allowNull: true },
    fullName: { type: DataTypes.STRING, allowNull: true },
    size: { type: DataTypes.STRING, allowNull: true },
    sex: { type: DataTypes.STRING, allowNull: true },
    dob: { type: DataTypes.DATEONLY, allowNull: true },
    nationalId: { type: DataTypes.STRING, allowNull: true, unique: true },
    religion: { type: DataTypes.STRING, allowNull: true },
    maritalStatus: { type: DataTypes.STRING, allowNull: true },
    email: { type: DataTypes.STRING, allowNull: true, unique: true },
    mobilePhones: { type: DataTypes.JSON, allowNull: true },
    homePhone: { type: DataTypes.STRING, allowNull: true },
    officePhone: { type: DataTypes.STRING, allowNull: true },
    address: { type: DataTypes.TEXT, allowNull: true },
    homeAddress1: { type: DataTypes.STRING, allowNull: true },
    homeAddress2: { type: DataTypes.STRING, allowNull: true },
    homeAddress3: { type: DataTypes.STRING, allowNull: true },
    homeLocation: { type: DataTypes.STRING, allowNull: true },
    homeZip: { type: DataTypes.STRING, allowNull: true },    
    jobTitle: { type: DataTypes.STRING, allowNull: true },
    employerName: { type: DataTypes.STRING, allowNull: true },
    officeAddress: { type: DataTypes.TEXT, allowNull: true },
    officeAddress1: { type: DataTypes.STRING, allowNull: true },
    officeAddress2: { type: DataTypes.STRING, allowNull: true },
    officeAddress3: { type: DataTypes.STRING, allowNull: true },
    officeLocation: { type: DataTypes.STRING, allowNull: true },
    officeZip: { type: DataTypes.STRING, allowNull: true },    
    loanId: { type: DataTypes.STRING, allowNull: true },
    productName: { type: DataTypes.STRING, allowNull: true },
    schemeCd: { type: DataTypes.STRING, allowNull: true },
    outstandingAmount: { type: DataTypes.DECIMAL, allowNull: true },
    principalAmount: { type: DataTypes.DECIMAL, allowNull: true },
    lastPaymentAmount: { type: DataTypes.DECIMAL, allowNull: true },
    lastPaymentDate: { type: DataTypes.DATEONLY, allowNull: true },
    interestRate: { type: DataTypes.DECIMAL, allowNull: true, defaultValue: 0 },
    penaltyFees: { type: DataTypes.DECIMAL, allowNull: true, defaultValue: 0 },
    totalPaid: { type: DataTypes.DECIMAL, allowNull: true },
    status: { type: DataTypes.STRING, allowNull: true },
    statusAccount: { type: DataTypes.STRING, allowNull: true },
    forecast: { type: DataTypes.STRING, allowNull: true },
    nextFollowUpDate: { type: DataTypes.DATEONLY, allowNull: true },
    chargeOff: { type: DataTypes.DATE, allowNull: true },
    installment: { type: DataTypes.DECIMAL, allowNull: true },
    startDate: { type: DataTypes.DATE, allowNull: true },
    tenor: { type: DataTypes.STRING, allowNull: true },
    rutinAmount: { type: DataTypes.DECIMAL, allowNull: true },
    handle: { type: DataTypes.STRING, allowNull: true },
    isHighPriority: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
    assignedCollector: { type: DataTypes.STRING, allowNull: true },
    createdBy: { type: DataTypes.STRING, allowNull: true },
    updatedBy: { type: DataTypes.STRING, allowNull: true },
  },
  {
    sequelize,
    modelName: 'Debtor',
    tableName: 'debtors',
    timestamps: true,
  }
)

export default Debtor
