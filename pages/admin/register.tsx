'use client';

import { useState } from 'react';
import MainLayout from '@/components/MainLayout';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Role } from '@/lib/roles';  // Import rolePermissions dan Role dari roles.ts

// type Role = 'admin' | 'collector' | 'client';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<Role>('user');
  const [loading, setLoading] = useState(false);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to create user');
      }

      toast.success('User created successfully!');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setDisplayName('');
      setRole('user');

    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Unexpected error';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-md mx-auto mt-12 p-8 bg-white dark:bg-gray-900 rounded-lg shadow-lg transition-colors duration-300">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-gray-100">
          Register New User
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block mb-1 text-gray-700 dark:text-gray-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block mb-1 text-gray-700 dark:text-gray-300">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block mb-1 text-gray-700 dark:text-gray-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block mb-1 text-gray-700 dark:text-gray-300">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block mb-1 text-gray-700 dark:text-gray-300">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
            >
              <option value="admin">Admin</option>
              <option value="user">user</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md disabled:opacity-50 transition"
          >
            {loading ? 'Creating...' : 'Register'}
          </button>
        </form>
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </MainLayout>
  );
}
