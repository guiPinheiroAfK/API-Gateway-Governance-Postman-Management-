import { useState, FormEvent } from 'react';
import { login } from '../api/gateway';

interface Props {
  onLogin: (token: string, email: string, role: string) => void;
}

export default function LoginPage({ onLogin }: Props) {
  const [email, setEmail] = useState('admin@orquestra.dev');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { accessToken, user } = await login(email, password);
      localStorage.setItem('token', accessToken);
      onLogin(accessToken, user.email, user.role);
    } catch {
      setError('Invalid credentials. Try admin@orquestra.dev / admin123');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-600 mb-4 glow-blue">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Orquestra Gateway</h1>
          <p className="text-gray-400 text-sm mt-1">API Gateway Control Panel</p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
                placeholder="admin@orquestra.dev"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="bg-red-950 border border-red-800 rounded-lg px-4 py-3 text-red-300 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition duration-150"
            >
              {loading ? 'Authenticating…' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-800">
            <p className="text-xs text-gray-500 text-center mb-3">Quick access credentials</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { setEmail('admin@orquestra.dev'); setPassword('admin123'); }}
                className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg px-3 py-2 text-gray-300 transition"
              >
                Admin user
              </button>
              <button
                onClick={() => { setEmail('user@orquestra.dev'); setPassword('user123'); }}
                className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg px-3 py-2 text-gray-300 transition"
              >
                Regular user
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          JWT authenticated · Rate limited · RFC 7807 errors
        </p>
      </div>
    </div>
  );
}
