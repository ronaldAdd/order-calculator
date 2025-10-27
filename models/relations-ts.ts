import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@/lib/db';  // Pastikan import sequelize sesuai dengan proyekmu
import Debtor from './debtor-ts';  // Import model Debtor

// Definisikan atribut untuk Relations
interface RelationAttributes {
  id?: number;
  debtorId: number;
  relationName: string;
  relationshipType: string;
  relationPhone?: string | null; // ✅ ubah dari wajib string → opsional
  relationAddress?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
}

type RelationCreationAttributes = Optional<RelationAttributes, 'id'>;

class Relation extends Model<RelationAttributes, RelationCreationAttributes> implements RelationAttributes {
  public id!: number;
  public debtorId!: number;
  public relationName!: string;
  public relationshipType!: string;
  public relationPhone!: string;
  public relationAddress?: string | null;
  public createdBy?: string | null;  // Tambahkan properti createdBy
  public updatedBy?: string | null;  // Tambahkan properti updatedBy

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Inisialisasi model Relation
Relation.init(
  {
    debtorId: { 
      type: DataTypes.INTEGER, 
      allowNull: false, 
      references: {
        model: Debtor,
        key: 'id',
      },
      onDelete: 'CASCADE', // Jika debitur dihapus, data relasi ini akan ikut terhapus
    },
    relationName: { 
      type: DataTypes.STRING, 
      allowNull: true 
    },
    relationshipType: { 
      type: DataTypes.STRING, 
      allowNull: true 
    },
    relationPhone: { 
      type: DataTypes.STRING, 
      allowNull: true 
    },
    relationAddress: {  // ✅ Tambahkan field baru
      type: DataTypes.STRING,
      allowNull: true,
    },    
    createdBy: {  // Tambahkan field createdBy
      type: DataTypes.STRING,
      allowNull: true,
    },
    updatedBy: {  // Tambahkan field updatedBy
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Relation',
    tableName: 'relations',
    timestamps: true,
  }
);

export default Relation;
