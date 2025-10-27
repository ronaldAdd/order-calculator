// models/audit-trail-ts.ts
import { DataTypes, Model, Optional } from 'sequelize'
import sequelize from '@/lib/db'

interface AuditTrailAttributes {
  id?: number
  timestamp: Date
  actorId: string
  actorName: string
  actionType: string
  targetEntityType: string
  targetEntityId: string
  description: string
  details: object
  createdBy?: string | null
  updatedBy?: string | null
}

type AuditTrailCreationAttributes = Optional<AuditTrailAttributes, 'id'>

class AuditTrail extends Model<AuditTrailAttributes, AuditTrailCreationAttributes> implements AuditTrailAttributes {
  public id!: number
  public timestamp!: Date
  public actorId!: string
  public actorName!: string
  public actionType!: string
  public targetEntityType!: string
  public targetEntityId!: string
  public description!: string
  public details!: object
  public createdBy?: string | null
  public updatedBy?: string | null

  public readonly createdAt!: Date
  public readonly updatedAt!: Date
}

AuditTrail.init(
  {
    timestamp: { type: DataTypes.DATE, allowNull: false },
    actorId: { type: DataTypes.STRING, allowNull: false },
    actorName: { type: DataTypes.STRING, allowNull: false },
    actionType: { type: DataTypes.STRING, allowNull: false },
    targetEntityType: { type: DataTypes.STRING, allowNull: false },
    targetEntityId: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.STRING(1000), allowNull: false },
    details: { type: DataTypes.JSON, allowNull: false },
    createdBy: { type: DataTypes.STRING, allowNull: true },
    updatedBy: { type: DataTypes.STRING, allowNull: true },
  },
  {
    sequelize,
    modelName: 'AuditTrail',
    tableName: 'audit_trails',
    timestamps: true,
  }
)

export default AuditTrail
