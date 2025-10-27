// config/database.ts

const databaseConfig = {
  development: {
    username: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    host: process.env.MYSQL_HOST,
    dialect: 'mysql',
    logging: false,
    port:process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT, 10) : 3306,
  },
  production: {
    username: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    host: process.env.MYSQL_HOST,
    dialect: 'mysql',
    logging: false,
    port:process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT, 10) : 3306,
  },
};

export default databaseConfig;
