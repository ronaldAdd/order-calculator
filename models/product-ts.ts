import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@/lib/db';

// Definisikan atribut untuk Product
interface ProductAttributes {
  id?: number;
  productName: string; // Nama produk (Akulaku, Kredivo, BNI, dll)
  description?: string; // Deskripsi opsional untuk produk
  createdBy?: string | null; // Siapa yang membuat produk (misal admin)
  updatedBy?: string | null; // Siapa yang terakhir mengupdate produk
  clientId?: number; // Relasi dengan client (optional, jika produk untuk client tertentu)
}

type ProductCreationAttributes = Optional<ProductAttributes, 'id'>;

class Product extends Model<ProductAttributes, ProductCreationAttributes> implements ProductAttributes {
  public id!: number;
  public productName!: string;
  public description?: string;
  public createdBy?: string | null;
  public updatedBy?: string | null;
  public clientId?: number; // Client yang memiliki produk ini

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Inisialisasi model Product
Product.init(
  {
    productName: { type: DataTypes.STRING, allowNull: false, unique: true },
    description: { type: DataTypes.STRING, allowNull: true },
    createdBy: { type: DataTypes.STRING, allowNull: true },
    updatedBy: { type: DataTypes.STRING, allowNull: true },
    clientId: { type: DataTypes.INTEGER, allowNull: true }, // Relasi ke Client
  },
  {
    sequelize,
    modelName: 'Product',
    tableName: 'products',
    timestamps: true,
  }
);

export default Product;
