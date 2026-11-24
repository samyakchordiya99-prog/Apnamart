import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendReset } from '../services/auth';
import { Spinner } from '../components/Spinner';

export function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!email.trim()) { setError('Enter your email.'); return; }
    setLoading(true);
    try {
      await sendReset(email.trim());
      setSuccess('Password reset email sent. Check your inbox.');
    } catch (err: any) {
      setError(err?.message || 'Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Reset password</h1>
        <p className="muted">We'll send a reset link to your email.</p>
        {error && <div className="alert error">{error}</div>}
        {success && <div className="alert success">{success}</div>}
        <form onSubmit={handleSubmit} className="form">
          <label>Email
            <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
          </label>
          <button className="btn btn-primary full" type="submit" disabled={loading}>
            {loading ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
        {loading && <Spinner label="Sending…" />}
        <p className="small muted"><button className="link" onClick={() => navigate('/login')}>Back to login</button></p>
      </div>
    </div>
  );
}

