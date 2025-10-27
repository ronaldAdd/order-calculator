import type { NextApiRequest, NextApiResponse } from "next";
import User from "@/models/user-ts";
import sequelize from "@/lib/db";
import withAuthAPI from "@/lib/withAuthAPI";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await sequelize.authenticate();
    console.log("✅ DB connected");

    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const { id, name, email, role, avatar } = req.body;

    // Validasi sederhana
    if (!id || !email || !role) {
      return res.status(400).json({ error: "id, email, and role are required." });
    }

    // Cek jika user dengan email yang sama sudah ada
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: "User with this email already exists." });
    }

    const newUser = await User.create({
      id,
      name: name ?? null,
      email,
      role,
      avatar: avatar ?? null,
    });

    return res.status(201).json({
      message: "User created successfully",
      user: newUser,
    });
  } catch (error: unknown) {
    console.error("❌ Create User API error:", error);
    if (error instanceof Error) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}

export default withAuthAPI(handler);
