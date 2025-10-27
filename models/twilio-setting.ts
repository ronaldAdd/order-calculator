import { DataTypes, Model, Optional } from 'sequelize'
import sequelize from '@/lib/db'

interface TwilioSettingAttributes {
  id?: number
  accountSid: string
  authToken: string
  phoneNumber: string
  enabled: boolean
}

type TwilioSettingCreationAttributes = Optional<TwilioSettingAttributes, 'id'>

class TwilioSetting
  extends Model<TwilioSettingAttributes, TwilioSettingCreationAttributes>
  implements TwilioSettingAttributes
{
  public id!: number
  public accountSid!: string
  public authToken!: string
  public phoneNumber!: string
  public enabled!: boolean

  public readonly createdAt!: Date
  public readonly updatedAt!: Date
}

TwilioSetting.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    accountSid: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    authToken: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: 'TwilioSetting',
    tableName: 'twilio_settings',
    timestamps: true,
  }
)

export default TwilioSetting
