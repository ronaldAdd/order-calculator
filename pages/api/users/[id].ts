import type { NextApiResponse } from "next";
import type { AuthenticatedRequest } from "@/lib/withAuthAPI";
import withAuthAPI from "@/lib/withAuthAPI";
import sequelize from "@/lib/db";
import User from "@/models/user-ts";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  try {
    await sequelize.authenticate();
    console.log("✅ DB connected");

    const { id } = req.query;

    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "Invalid or missing user ID" });
    }

    // GET user by ID
    if (req.method === "GET") {
      const user = await User.findByPk(id);
      if (!user) return res.status(404).json({ error: "User not found" });

      return res.status(200).json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          phoneNumber: user.phoneNumber,
          bio: user.bio,
          disabled: user.disabled,
        },
      });
    }

    // PUT: Only admin can update user
    if (req.method === "PUT") {
      // if (req.user?.role !== "admin") {
      //   return res.status(403).json({ error: "Forbidden: Only admin can update users" });
      // }

      const { name, email, role, avatar, disabled, phoneNumber, bio } = req.body;

      const user = await User.findByPk(id);
      if (!user) return res.status(404).json({ error: "User not found" });

      user.name = name ?? user.name;
      user.email = email ?? user.email;
      user.role = role ?? user.role;
      user.avatar = avatar ?? user.avatar;
      user.phoneNumber = phoneNumber ?? user.phoneNumber;
      user.bio = bio ?? user.bio;
      if (typeof disabled === "boolean") user.disabled = disabled;

      await user.save();

      return res.status(200).json({ message: "User updated", user });
    }

    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (error) {
    console.error("❌ User API error:", error);
    if (error instanceof Error) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}

export default withAuthAPI(handler);
