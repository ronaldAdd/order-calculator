// pages/api/users/disable.ts
import type { NextApiRequest, NextApiResponse } from "next"
import withAuthAPI from '@/lib/withAuthAPI'
import sequelize from '@/lib/db'
import User from '@/models/user-ts'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method Not Allowed" })

  const { uid, disable } = req.body

  if (!uid || typeof disable !== "boolean") {
    return res.status(400).json({ error: "UID and disable(boolean) are required" })
  }

  try {
    const { getAdmin } = await import("../../../lib/firebaseAdmins")
    const admin = getAdmin()

    // 1. Update Firebase Auth
    const userRecord = await admin.auth().updateUser(uid, { disabled: disable })

    // 2. Update Firestore
    // const userDocRef = admin.firestore().collection("users").doc(uid)
    // await userDocRef.update({ disabled: disable })

    // 3. Update MySQL
    await sequelize.authenticate()
    const userInSQL = await User.findByPk(uid)
    if (userInSQL) {
      userInSQL.disabled = disable
      await userInSQL.save()
    }

    return res.status(200).json({
      message: `User ${disable ? "disabled" : "enabled"} successfully`,
      user: { uid: userRecord.uid, disabled: userRecord.disabled },
    })
  } catch (error: unknown) {
    console.error("🔥 updateUser disabled error:", error)
    if (error instanceof Error) {
      return res.status(500).json({ error: error.message || "Internal Server Error" })
    }
    return res.status(500).json({ error: "Internal Server Error" })
  }
}

export default withAuthAPI(handler)
