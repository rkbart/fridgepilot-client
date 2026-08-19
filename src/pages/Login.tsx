import { useState } from 'react';
import { Link } from 'react-router-dom';
import { login } from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login({ email, password });
      window.location.href = '/recipes';
    } catch (err: unknown) {
      const msg = (err as { error?: { message?: string } })?.error?.message || 'Invalid email or password';
      setError(msg);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <h1>Welcome back</h1>
        <p className="auth-subtitle">Sign in to your kitchen</p>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input className="form-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary">Sign in</button>
        </form>
        <div className="auth-footer">
          New here? <Link to="/signup">Create an account</Link>
        </div>
      </div>
    </div>
  );
}
