import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { signUpWithEmail, isFirebaseConfigured } from '../services/auth';
import { Spinner } from '../components/Spinner';

export function Signup() {
  const navigate = useNavigate();
  const { refreshProfile, loginAsDemo } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'customer' | 'vendor'>('customer');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function validate() {
    if (!name.trim()) return 'Please enter your name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Please enter a valid email.';
    if (password.length < 6) return 'Password must be at least 6 characters.';
    if (password !== confirm) return 'Passwords do not match.';
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setLoading(true);
    try {
      if (!isFirebaseConfigured) {
        // Smooth offline demo fallback: Create session with user's selected name, email & role
        loginAsDemo(role);
        setSuccess('Account created in demo mode! Redirecting…');
        setTimeout(() => {
          navigate(role === 'vendor' ? '/vendor' : '/home');
        }, 800);
        return;
      }

      const res = await signUpWithEmail(email.trim(), password, name.trim(), role);
      await refreshProfile();
      setSuccess('Account created successfully! Redirecting…');
      navigate(res.profile?.role === 'vendor' ? '/vendor' : '/home');
    } catch (err: any) {
      setError(err?.message || 'Signup failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Create your account</h1>
        <p className="muted">Join ApnaMart as a Customer or Vendor.</p>
        {error && <div className="alert error">{error}</div>}
        {success && <div className="alert success">{success}</div>}
        <form onSubmit={handleSubmit} className="form">
          <label>
            Full Name
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahul Verma"
              required
            />
          </label>
          <label>
            Email Address
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>
          <label>
            Account Type
            <div className="role-toggle">
              <button
                type="button"
                className={role === 'customer' ? 'active' : ''}
                onClick={() => setRole('customer')}
              >
                🛍️ Customer
              </button>
              <button
                type="button"
                className={role === 'vendor' ? 'active' : ''}
                onClick={() => setRole('vendor')}
              >
                🏪 Vendor
              </button>
            </div>
            <p className="muted small" style={{ margin: '6px 0 0' }}>
              {role === 'customer'
                ? 'Order daily groceries and essentials from trusted neighborhood shops with doorstep delivery.'
                : 'Register your local shop, showcase products, and receive orders from nearby customers.'}
            </p>
          </label>
          <label>
            Password
            <div className="pw-wrap">
              <input
                className="input"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
              />
              <button
                type="button"
                className="pw-toggle"
                onClick={() => setShowPw((s) => !s)}
              >
                {showPw ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>
          <label>
            Confirm Password
            <input
              className="input"
              type={showPw ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat password"
              required
            />
          </label>
          <button className="btn btn-primary full" type="submit" disabled={loading}>
            {loading ? 'Creating account…' : `Sign Up as ${role === 'customer' ? 'Customer' : 'Vendor'}`}
          </button>
        </form>
        {loading && <Spinner label="Creating account…" />}
        <p className="small muted" style={{ marginTop: '16px' }}>
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
}
