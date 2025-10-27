import type { NextApiRequest, NextApiResponse } from "next"
import Debtor from "@/models/debtor-ts"
import BankAccount from "@/models/bank-account-ts"
import Relation from "@/models/relations-ts"
import sequelize from "@/lib/db"
import withAuthAPI from "@/lib/withAuthAPI"

type FieldInfo = {
  value: string
  label: string
  type: string
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    await sequelize.authenticate()

    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" })
    }

    const attributes = Debtor.rawAttributes

    // Exclude fields that should not be mapped/uploaded
    const excluded = [
      'id',
      'createdAt',
      'updatedAt',
      'createdBy',
      'updatedBy',
      'assignedCollector'
    ]

    // Relational models to expand fields from
    const relatedModels = {
      BankAccounts: BankAccount,
      Relations: Relation, // Relation model as emergency contact
    }

    // Collect fields from related models
    const expandedFields: FieldInfo[] = []

    for (const [alias, model] of Object.entries(relatedModels)) {
      const attrs = model.rawAttributes
      for (const [subField, attr] of Object.entries(attrs)) {
        // ⛔ Skip internal/foreign/meta fields
        if (['id', 'createdAt', 'updatedAt', 'debtorId', 'createdBy', 'updatedBy'].includes(subField)) continue

        let type = 'UNKNOWN'
        try {
          const rawType = attr?.type?.constructor?.name || ''
          type = getSequelizeType(rawType)
          console.log(type);
          
        } catch (e) {
          console.error(`❌ Error parsing type from ${alias}.${subField}:`, e)
        }

        expandedFields.push({
          value: `${alias}.${subField}`,
          label: `${toLabel(alias)} - ${toLabel(subField)}`,
          // type,
          type:`${alias}`,
        })
      }
    }

    // Fields directly from Debtor model
    const baseFields = Object.entries(attributes)
      .filter(([name]) => !excluded.includes(name))
      .map(([fieldName, attr]) => {
        let type = 'UNKNOWN'
        try {
          const rawType = attr?.type?.constructor?.name || ''
          if (rawType) {
            type = getSequelizeType(rawType)
          }
        } catch (err) {
          console.error(`❌ Error parsing type for ${fieldName}:`, err)
        }

        return {
          value: fieldName,
          label: toLabel(fieldName),
          type,
        }
      })

    const fields = [...baseFields, ...expandedFields]
    // const fields = [...baseFields]

    return res.status(200).json({ fields })
  } catch (error) {
    console.error("❌ Error in /api/debtors/fields:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}

// Helper to convert Sequelize DataTypes to readable strings
function getSequelizeType(rawType?: string): string {
  if (!rawType) return 'UNKNOWN'
  const upper = rawType.toUpperCase()
  if (upper.includes('STRING')) return 'STRING'
  if (upper.includes('TEXT')) return 'TEXT'
  if (upper.includes('INTEGER')) return 'INTEGER'
  if (upper.includes('DECIMAL')) return 'DECIMAL'
  if (upper.includes('BOOLEAN')) return 'BOOLEAN'
  if (upper.includes('DATEONLY')) return 'DATEONLY'
  if (upper.includes('DATE')) return 'DATE'
  if (upper.includes('JSON')) return 'JSON'
  if (upper.includes('ENUM')) return 'ENUM'
  return upper
}

// Format camelCase to readable label
function toLabel(field: string): string {
  return field
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim()
}

export default withAuthAPI(handler)
