// pages/api/users.ts
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(_: NextApiRequest, res: NextApiResponse) {
  try {
    const snap = await getDocs(collection(db, 'users'));
    const users = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
}
