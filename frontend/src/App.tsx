import { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';

interface Session {
  token: string;
  email: string;
  role: string;
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('email');
    const role = localStorage.getItem('role');
    if (token && email && role) setSession({ token, email, role });
  }, []);

  function handleLogin(token: string, email: string, role: string) {
    localStorage.setItem('token', token);
    localStorage.setItem('email', email);
    localStorage.setItem('role', role);
    setSession({ token, email, role });
  }

  function handleLogout() {
    localStorage.clear();
    setSession(null);
  }

  if (!session) return <LoginPage onLogin={handleLogin} />;
  return <Dashboard email={session.email} role={session.role} onLogout={handleLogout} />;
}
