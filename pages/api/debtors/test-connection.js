// pages/api/test-connection.js
import sequelize from "@/lib/db"

export default async function handler(req, res) {
  try {
    await sequelize.authenticate();
    res.status(200).json({ message: 'Database connection successful!' });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ error: 'Database connection failed', details: error.message });
  }
}
