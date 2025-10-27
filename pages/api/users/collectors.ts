import type { NextApiRequest, NextApiResponse } from "next"
import sequelize from "@/lib/db"
import UserFactory from "@/models/user"
import withAuthAPI from "@/lib/withAuthAPI"
import { Op, DataTypes } from "sequelize"
import type { WhereOptions } from "sequelize"

const User = UserFactory(sequelize, DataTypes)

type UserWhere = WhereOptions & {
  [Op.or]?: WhereOptions[]
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await sequelize.authenticate()
    console.log("✅ DB connected")

    if (req.method === "GET") {
      const {
        page = "1",
        limit = "10",
        sortBy = "createdAt",
        sortOrder = "DESC",
        email,
        role,
        id,
        search,
      } = req.query

      const pageNumber = parseInt(page as string, 10)
      const limitNumber = parseInt(limit as string, 10)
      const offset = (pageNumber - 1) * limitNumber

      const where: UserWhere = {}

      const whereLikeCI = (column: string, value: string) =>
        sequelize.where(
          sequelize.fn("LOWER", sequelize.col(column)),
          { [Op.like]: `%${value.toLowerCase()}%` }
        )

      if (email) where.email = whereLikeCI("email", email as string)
      if (role) where.role = whereLikeCI("role", role as string)
      if (id) where.id = id as string

      if (search) {
        const keyword = (search as string).toLowerCase()
        where[Op.or] = [
          whereLikeCI("email", keyword),
          whereLikeCI("role", keyword),
          whereLikeCI("id", keyword),
        ]
      }

      const allowedSortFields = ["createdAt", "email", "role"]
      const orderField = allowedSortFields.includes(sortBy as string) ? (sortBy as string) : "createdAt"
      const orderDirection = (sortOrder as string).toUpperCase() === "DESC" ? "DESC" : "ASC"

      const { count, rows } = await User.findAndCountAll({
        where,
        limit: limitNumber,
        offset,
        order: [[orderField, orderDirection]],
      })

      return res.status(200).json({
        data: rows,
        total: count,
        page: pageNumber,
        totalPages: Math.ceil(count / limitNumber),
      })
    }

    if (req.method === "POST") {
      const newUser = await User.create(req.body)
      return res.status(201).json(newUser)
    }

    return res.status(405).json({ error: "Method Not Allowed" })
  } catch (error) {
    console.error("❌ User API error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}

export default withAuthAPI(handler)
