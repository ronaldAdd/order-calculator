// lib/logActivity.ts
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

const db = getFirestore();

export async function logActivity({ uid, email, activity }: { uid: string, email: string | null, activity: string }) {
  try {
    const ipRes = await fetch("https://api.ipify.org?format=json");
    const ipData = await ipRes.json();

    await addDoc(collection(db, "logs_collection"), {
      uid,
      email,
      activity,
      ip_address: ipData.ip,
      user_agent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("🔥 Failed to log activity:", err);
  }
}
