import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { signInWithGoogle, signInWithEmail } from '../services/auth';
import type { UserProfile } from '../types';

type RoleTab = 'customer' | 'vendor' | 'admin';

export function Login() {
  const navigate = useNavigate();
  const { refreshProfile, loginWithProfile, loginAsDemo, user } = useAuth();

  const [activeTab, setActiveTab] = useState<RoleTab>('customer');

  // Customer Email mode toggle
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPassword, setCustomerPassword] = useState('');

  // Vendor state
  const [shopName, setShopName] = useState('');
  const [vendorPassword, setVendorPassword] = useState('');
  const [showVendorPw, setShowVendorPw] = useState(false);

  // Admin state
  const [adminEmail, setAdminEmail] = useState('samyakchordiya99@gmail.com');
  const [adminPassword, setAdminPassword] = useState('Samyak@123');
  const [showAdminPw, setShowAdminPw] = useState(false);

  // Status & loader
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/home');
    }
  }, [user, navigate]);

  const clearError = () => {
    setError(null);
    setStatusMsg(null);
  };

  const switchTab = (tab: RoleTab) => {
    setActiveTab(tab);
    clearError();
  };

  // ======================================================
  //  CUSTOMER – GOOGLE / GMAIL LOGIN
  // ======================================================
  async function handleGoogleLogin() {
    clearError();
    setLoading(true);
    setStatusMsg('Connecting with Google / Gmail…');
    try {
      const res = await signInWithGoogle();
      await refreshProfile();
      if (res.profile?.role === 'admin') navigate('/admin');
      else if (res.profile?.role === 'vendor') navigate('/vendor');
      else navigate('/home');
    } catch (err: any) {
      console.warn('Google sign-in popup error, checking fallback', err);
      // Helpful error message if domain not whitelisted or cancelled
      if (err?.message?.includes('popup-closed-by-user')) {
        setError('Google sign-in was cancelled. Please try again.');
      } else if (err?.message?.includes('unauthorized-domain')) {
        setError('Firebase Auth domain not authorized yet. You can use Quick Demo Customer to test!');
      } else {
        setError(err?.message || 'Google sign-in could not be completed.');
      }
    } finally {
      setLoading(false);
      setStatusMsg(null);
    }
  }

  // Customer Email/Password Login
  async function handleCustomerEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    if (!customerEmail.trim() || !customerPassword) {
      setError('Please enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      const res = await signInWithEmail(customerEmail.trim(), customerPassword);
      await refreshProfile();
      if (res.profile?.role === 'admin') navigate('/admin');
      else if (res.profile?.role === 'vendor') navigate('/vendor');
      else navigate('/home');
    } catch (err: any) {
      setError(err?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  }

  // Quick Demo Customer
  function handleDemoCustomer() {
    loginAsDemo('customer');
    navigate('/home');
  }

  // ======================================================
  //  VENDOR – SHOP NAME + PASSWORD
  // ======================================================
  async function handleVendorLogin(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    if (!shopName.trim()) {
      setError('Please select or enter your shop name.');
      return;
    }
    if (vendorPassword !== 'Apnamart@123') {
      setError('Invalid vendor password. (Hint: Apnamart@123)');
      return;
    }
    setLoading(true);
    try {
      const slug = shopName.trim().toLowerCase().replace(/[^a-z0-9]/g, '-');
      const vendorProfile: UserProfile = {
        uid: `vendor-${slug}`,
        email: `${slug}@vendor.com`,
        displayName: shopName.trim(),
        role: 'vendor',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      loginWithProfile(vendorProfile);
      navigate('/vendor');
    } catch (err: any) {
      setError(err?.message || 'Vendor login failed.');
    } finally {
      setLoading(false);
    }
  }

  // ======================================================
  //  ADMIN – FIXED CREDENTIALS
  // ======================================================
  async function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    const emailTrimmed = adminEmail.trim().toLowerCase();
    if (!emailTrimmed || !adminPassword) {
      setError('Please enter both admin email and password.');
      return;
    }
    setLoading(true);
    try {
      if (emailTrimmed === 'samyakchordiya99@gmail.com' && adminPassword === 'Samyak@123') {
        const adminProfile: UserProfile = {
          uid: 'admin-samyak',
          email: 'samyakchordiya99@gmail.com',
          displayName: 'Samyak (Admin)',
          role: 'admin',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        loginWithProfile(adminProfile);
        navigate('/admin');
      } else {
        setError('Invalid admin credentials. Please check email and password.');
      }
    } catch (err: any) {
      setError(err?.message || 'Admin login failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-split-page">
      {/* ---- LEFT BRAND PANEL ---- */}
      <div className="auth-brand-panel">
        <div className="auth-brand-top">
          <div className="auth-brand-logo">
            <span className="auth-brand-icon">🛒</span>
          </div>
          <h1 className="auth-brand-name">
            Apna<span className="auth-brand-accent">Mart</span>
          </h1>
          <p className="auth-brand-tagline">India's Neighborhood Kirana Delivery ⚡</p>
        </div>

        <div className="auth-brand-features">
          <div className="auth-feature-pill">
            <span className="pill-icon">🚀</span>
            <div>
              <strong>10-15 Min Delivery</strong>
              <small>From local trusted shops</small>
            </div>
          </div>
          <div className="auth-feature-pill">
            <span className="pill-icon">🏪</span>
            <div>
              <strong>Ravi Kirana & Sharma Stores</strong>
              <small>Verified authentic products</small>
            </div>
          </div>
          <div className="auth-feature-pill">
            <span className="pill-icon">📍</span>
            <div>
              <strong>Live Delivery Tracking</strong>
              <small>Real-time order updates</small>
            </div>
          </div>
        </div>

        <div className="auth-brand-footer">
          <span>🔒 100% Secure & Verified Payments</span>
        </div>
      </div>

      {/* ---- RIGHT FORM PANEL ---- */}
      <div className="auth-form-panel">
        <div className="auth-form-card">
          <div className="auth-form-header">
            <h2 className="auth-form-title">Welcome to ApnaMart</h2>
            <p className="auth-form-subtitle">Choose your portal to continue</p>
          </div>

          {/* Role Tabs */}
          <div className="auth-role-tabs">
            <button
              className={`auth-role-tab customer ${activeTab === 'customer' ? 'active' : ''}`}
              onClick={() => switchTab('customer')}
              type="button"
            >
              🛍️ Customer
            </button>
            <button
              className={`auth-role-tab vendor ${activeTab === 'vendor' ? 'active' : ''}`}
              onClick={() => switchTab('vendor')}
              type="button"
            >
              🏪 Vendor
            </button>
            <button
              className={`auth-role-tab admin ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => switchTab('admin')}
              type="button"
            >
              ⚙️ Admin
            </button>
          </div>

          {/* Error / Status Alerts */}
          {error && (
            <div className="auth-alert error">
              <span>⚠️</span> <div>{error}</div>
            </div>
          )}
          {statusMsg && (
            <div className="auth-alert info">
              <span>ℹ️</span> <div>{statusMsg}</div>
            </div>
          )}

          {/* ===================== CUSTOMER TAB ===================== */}
          {activeTab === 'customer' && (
            <div className="auth-tab-content">
              {/* PRIMARY: DIRECT GMAIL / GOOGLE SIGN-IN */}
              <div className="auth-gmail-box">
                <button
                  type="button"
                  className="auth-google-btn"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                >
                  <svg className="google-icon" viewBox="0 0 24 24" width="22" height="22">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                  </svg>
                  <span>{loading ? 'Signing in…' : 'Sign in directly with Google (Gmail)'}</span>
                </button>
                <p className="auth-hint-center">Instant 1-click access with your Gmail account</p>
              </div>

              {/* OR DIVIDER */}
              <div className="auth-divider-line">
                <span>or continue with</span>
              </div>

              {/* TOGGLE EMAIL OR QUICK DEMO */}
              {!showEmailForm ? (
                <div className="auth-secondary-actions">
                  <button
                    type="button"
                    className="auth-btn-ghost"
                    onClick={() => setShowEmailForm(true)}
                  >
                    ✉️ Sign in with Email / Password
                  </button>
                  <button
                    type="button"
                    className="auth-btn-demo"
                    onClick={handleDemoCustomer}
                  >
                    ⚡ Test as Guest Customer (1-Click)
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCustomerEmailLogin} className="auth-email-form">
                  <div className="auth-field-group">
                    <label className="auth-field-label">Email Address</label>
                    <input
                      className="auth-input"
                      type="email"
                      placeholder="you@gmail.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                  <div className="auth-field-group">
                    <label className="auth-field-label">Password</label>
                    <input
                      className="auth-input"
                      type="password"
                      placeholder="••••••••"
                      value={customerPassword}
                      onChange={(e) => setCustomerPassword(e.target.value)}
                      required
                    />
                  </div>
                  <button className="auth-btn auth-btn-customer" type="submit" disabled={loading}>
                    {loading ? 'Logging in…' : 'Sign In with Email'}
                  </button>
                  <div className="auth-sub-links">
                    <button
                      type="button"
                      className="auth-link-text"
                      onClick={() => setShowEmailForm(false)}
                    >
                      ← Back to Google Sign-in
                    </button>
                    <Link to="/signup" className="auth-link-text font-bold">
                      Create account
                    </Link>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ===================== VENDOR TAB ===================== */}
          {activeTab === 'vendor' && (
            <form onSubmit={handleVendorLogin} className="auth-tab-content">
              {/* Quick Shop Chips */}
              <div className="auth-field-group">
                <label className="auth-field-label">Choose Shop</label>
                <div className="auth-chips-row">
                  <button
                    type="button"
                    className={`auth-chip ${shopName === 'Ravi Kirana Store' ? 'active' : ''}`}
                    onClick={() => {
                      setShopName('Ravi Kirana Store');
                      setVendorPassword('Apnamart@123');
                    }}
                  >
                    🏪 Ravi Kirana
                  </button>
                  <button
                    type="button"
                    className={`auth-chip ${shopName === 'Sharma General Store' ? 'active' : ''}`}
                    onClick={() => {
                      setShopName('Sharma General Store');
                      setVendorPassword('Apnamart@123');
                    }}
                  >
                    🏪 Sharma General
                  </button>
                </div>
              </div>

              <div className="auth-field-group">
                <label className="auth-field-label">Shop Name</label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon">🏪</span>
                  <input
                    className="auth-input auth-input-icon-pad"
                    type="text"
                    placeholder="Enter shop name"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="auth-field-group">
                <label className="auth-field-label">Password</label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon">🔒</span>
                  <input
                    className="auth-input auth-input-icon-pad"
                    type={showVendorPw ? 'text' : 'password'}
                    placeholder="Apnamart@123"
                    value={vendorPassword}
                    onChange={(e) => setVendorPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="auth-pw-toggle"
                    onClick={() => setShowVendorPw((s) => !s)}
                  >
                    {showVendorPw ? '🙈' : '👁️'}
                  </button>
                </div>
                <span className="auth-hint">Default password: <code>Apnamart@123</code></span>
              </div>

              <button
                className="auth-btn auth-btn-vendor"
                type="submit"
                disabled={loading || !shopName.trim() || !vendorPassword}
              >
                {loading ? 'Accessing…' : 'Enter Vendor Portal →'}
              </button>
            </form>
          )}

          {/* ===================== ADMIN TAB ===================== */}
          {activeTab === 'admin' && (
            <form onSubmit={handleAdminLogin} className="auth-tab-content">
              <div className="auth-field-group">
                <label className="auth-field-label">Admin Email</label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon">📧</span>
                  <input
                    className="auth-input auth-input-icon-pad"
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="auth-field-group">
                <label className="auth-field-label">Admin Password</label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon">🔐</span>
                  <input
                    className="auth-input auth-input-icon-pad"
                    type={showAdminPw ? 'text' : 'password'}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="auth-pw-toggle"
                    onClick={() => setShowAdminPw((s) => !s)}
                  >
                    {showAdminPw ? '🙈' : '👁️'}
                  </button>
                </div>
                <span className="auth-hint">Pre-filled credentials for Samyak (Admin)</span>
              </div>

              <button
                className="auth-btn auth-btn-admin"
                type="submit"
                disabled={loading || !adminEmail.trim() || !adminPassword}
              >
                {loading ? 'Authenticating…' : '🔐 Access Master Admin →'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
