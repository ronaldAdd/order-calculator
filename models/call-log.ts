import { DataTypes, Model, Optional } from 'sequelize'
import sequelize from '@/lib/db'

interface CallLogAttributes {
  id?: number
  data_json: Record<string, any>
}

type CallLogCreationAttributes = Optional<CallLogAttributes, 'id'>

class CallLog extends Model<CallLogAttributes, CallLogCreationAttributes>
  implements CallLogAttributes {
  public id!: number
  public data_json!: Record<string, any>

  public readonly createdAt!: Date
  public readonly updatedAt!: Date
}

CallLog.init(
  {
    data_json: {
      type: DataTypes.JSON,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'CallLog',
    tableName: 'call_logs',
    timestamps: true,
  }
)

export default CallLog
