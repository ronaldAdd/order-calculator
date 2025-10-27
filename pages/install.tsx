import Head from 'next/head';
import Link from 'next/link';
import { useState, FormEvent, ChangeEvent } from 'react';

export default function InstallPage() {
  const [step, setStep] = useState<'welcome' | 'initializing' | 'create-admin' | 'done' | 'error'>('welcome');
  const [name, setName] = useState('Super Admin');
  const [email, setEmail] = useState('admin@myapp.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleInitDB = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/_init');
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to init DB');
      setMessage(data.message || 'Database initialized');
      setStep('create-admin');
    } catch (err) {
      const error = err as Error;
      setMessage(`DB Init failed: ${error.message}`);
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create admin');
      setMessage('✅ Admin user created');
      setStep('done');
    } catch (err) {
      const error = err as Error;
      setMessage(`Create admin failed: ${error.message}`);
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (setter: (val: string) => void) => (e: ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
  };

  return (
    <>
      <Head>
        <title>🚀 Install Wizard - MyApp</title>
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-slate-900 to-gray-950 text-white flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-lg backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl shadow-xl p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl blur-2xl -z-10" />
          <h1 className="text-3xl font-bold text-center mb-6 tracking-tight">
            🚀 MyApp Installation
          </h1>

          {step === 'welcome' && (
            <>
              <p className="text-center text-slate-300 mb-6">
                Welcome! Start by initializing the database.
              </p>
              <button
                onClick={handleInitDB}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition flex items-center justify-center gap-2"
              >
                {loading ? <Spinner /> : 'Initialize Database'}
              </button>
            </>
          )}

          {step === 'create-admin' && (
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="block text-sm mb-1 text-slate-300">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={handleInputChange(setName)}
                  disabled={loading}
                  className="w-full bg-slate-800 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm mb-1 text-slate-300">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={handleInputChange(setEmail)}
                  disabled={loading}
                  className="w-full bg-slate-800 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm mb-1 text-slate-300">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={handleInputChange(setPassword)}
                  disabled={loading}
                  className="w-full bg-slate-800 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg transition flex items-center justify-center gap-2"
              >
                {loading ? <Spinner /> : 'Create Admin User'}
              </button>
            </form>
          )}

          {step === 'done' && (
            <div className="text-center space-y-3">
              <p className="text-green-400 font-semibold text-lg">✅ Installation complete!</p>
              <p className="text-slate-400">
                You can now{' '}
                <Link href="/signin" className="underline text-blue-400">
                  sign in
                </Link>{' '}
                as admin.
              </p>
            </div>
          )}

          {step === 'error' && (
            <div className="text-center space-y-4">
              <p className="text-red-500 font-semibold text-lg">❌ Installation failed.</p>
              <p className="text-slate-400">{message}</p>
              <button
                onClick={() => setStep('welcome')}
                className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded transition"
              >
                Try Again
              </button>
            </div>
          )}

          {message && step !== 'error' && (
            <p className="mt-6 text-sm text-center text-slate-400">{message}</p>
          )}
        </div>
      </main>
    </>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin h-5 w-5 text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}
