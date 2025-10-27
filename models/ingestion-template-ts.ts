import { DataTypes, Model, Optional } from 'sequelize'
import sequelize from '@/lib/db'

interface IngestionTemplateAttributes {
  id?: number
  name: string
  headers: string[] // Header dari file Excel/CSV
  mapping: Record<number, string> // Mapping kolom ke field (index ke nama field)
  createdBy?: string | null
  updatedBy?: string | null
}

type IngestionTemplateCreationAttributes = Optional<IngestionTemplateAttributes, 'id'>

class IngestionTemplate extends Model<IngestionTemplateAttributes, IngestionTemplateCreationAttributes>
  implements IngestionTemplateAttributes {
  public id!: number
  public name!: string
  public headers!: string[]
  public mapping!: Record<number, string>
  public createdBy?: string | null
  public updatedBy?: string | null

  public readonly createdAt!: Date
  public readonly updatedAt!: Date
}

IngestionTemplate.init(
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    headers: {
      type: DataTypes.JSON, // Simpan array string
      allowNull: false,
    },
    mapping: {
      type: DataTypes.JSON, // Simpan mapping seperti {0: 'fullName', 1: 'phoneNumber'}
      allowNull: false,
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
    modelName: 'IngestionTemplate',
    tableName: 'ingestion_templates',
    timestamps: true,
  }
)

export default IngestionTemplate
