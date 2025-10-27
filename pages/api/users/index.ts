// pages/api/users/index.ts
import type { NextApiResponse } from "next";
import type { AuthenticatedRequest } from "@/lib/withAuthAPI";
import User from "@/models/user-ts";
import sequelize from "@/lib/db";
import withAuthAPI from "@/lib/withAuthAPI";
import { Op } from "sequelize";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    await sequelize.authenticate();
    console.log("✅ DB connected");

    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const { page = "1", limit = "10", search = "" } = req.query;

    const pageNumber = parseInt(page as string, 10) || 1;
    const limitNumber = parseInt(limit as string, 10) || 10;
    const offset = (pageNumber - 1) * limitNumber;

    const whereClause = search
      ? {
          [Op.or]: [
            { name: { [Op.like]: `%${search}%` } },
            { email: { [Op.like]: `%${search}%` } },
          ],
        }
      : {};

    const { rows: users, count: total } = await User.findAndCountAll({
      where: whereClause,
      limit: limitNumber,
      offset,
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      data: users,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    });
  } catch (error: unknown) {
    console.error("❌ Get User List API error:", error);
    if (error instanceof Error) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}

export default withAuthAPI(handler);
