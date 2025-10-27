import 'mysql2'; 
import { Sequelize } from 'sequelize';
import databaseConfig from '../config/database';

type Env = 'development' | 'production';

const env: Env = process.env.NODE_ENV === 'production' ? 'production' : 'development';

const config = databaseConfig[env];

const sequelize = new Sequelize(
  config.database!,
  config.username!,
  config.password!,
  {
    host: config.host,
    dialect: config.dialect as 'mysql' | 'postgres' | 'sqlite' | 'mariadb' | 'mssql',
    logging: config.logging,
    port: config.port, // ✅ tambahkan ini
  }
);

export default sequelize;
