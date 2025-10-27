import type { NextApiResponse } from "next"
import User from "@/models/user-ts"
import sequelize from "@/lib/db"
import withAuthAPI from "@/lib/withAuthAPI"
import { Op } from "sequelize"
import type { WhereOptions } from "sequelize"
import type { AuthenticatedRequest } from "@/lib/withAuthAPI"

type UserWhere = WhereOptions & {
  [Op.or]?: WhereOptions[]
}

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    await sequelize.authenticate()
    console.log("✅ DB connected")

    if (req.method === "GET") {
      const {
        sortBy = "createdAt",
        sortOrder = "DESC",
        email,
        id,
        search,
      } = req.query

      const currentUser = req.user
      const role = currentUser?.role || "guest"
      const uid = currentUser?.uid

      const where: UserWhere = {
        disabled: false,
      }

      // Role-based filtering
      if (role === "admin") {
        where.role = "collector" // admin lihat semua collector
      } else {
        where.id = uid // non-admin cuma lihat dirinya sendiri
      }

      const whereLikeCI = (column: string, value: string) =>
        sequelize.where(
          sequelize.fn("LOWER", sequelize.col(column)),
          { [Op.like]: `%${value.toLowerCase()}%` }
        )

      if (email) where.email = whereLikeCI("email", email as string)
      if (id) where.id = id as string

      if (search) {
        const keyword = (search as string).toLowerCase()
        where[Op.or] = [
          whereLikeCI("email", keyword),
          whereLikeCI("id", keyword),
        ]
      }

      const allowedSortFields = ["createdAt", "email", "id"]
      const orderField = allowedSortFields.includes(sortBy as string) ? (sortBy as string) : "createdAt"
      const orderDirection = (sortOrder as string).toUpperCase() === "DESC" ? "DESC" : "ASC"

      const rows = await User.findAll({
        where,
        order: [[orderField, orderDirection]],
        attributes: ["id", "name", "email", "role", "createdAt"],
      })

      return res.status(200).json({
        data: rows,
        total: rows.length,
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
