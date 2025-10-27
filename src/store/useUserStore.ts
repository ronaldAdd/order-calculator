// src/store/useUserStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type User = {
  uid: string;
  email: string;
  token: string;
  role: string;
  permissions: string[];
  avatar?: string;
  name?: string;
  phoneNumber?: string; // ✅ Tambahkan di sini
};

interface UserStore {
  user: User | null;
  setUser: (user: User) => void;
  updateAvatar: (avatar: string) => void;
  updateName: (name: string) => void;
  updatePhoneNumber: (phoneNumber: string) => void; // ✅ Tambahkan method
  clearUser: () => void;
}

const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      updateAvatar: (avatar) =>
        set((state) => ({
          user: state.user ? { ...state.user, avatar } : null,
        })),
      updateName: (name) =>
        set((state) => ({
          user: state.user ? { ...state.user, name } : null,
        })),
      updatePhoneNumber: (phoneNumber) =>
        set((state) => ({
          user: state.user ? { ...state.user, phoneNumber } : null,
        })), // ✅ Tambahkan ini
      clearUser: () => set({ user: null }),
    }),
    {
      name: 'auth-user',
    }
  )
);

export default useUserStore;
