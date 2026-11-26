import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { UserProfile } from '../types';

type RoleTab = 'customer' | 'vendor' | 'admin';

export function Login() {
  const navigate = useNavigate();
  const { loginWithProfile, loginAsDemo, user } = useAuth();

  const [activeTab, setActiveTab] = useState<RoleTab>('customer');

  // Customer state
  const [custPhone, setCustPhone] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custName, setCustName]   = useState('');

  // Vendor state
  const [shopName, setShopName]           = useState('');
  const [vendorPassword, setVendorPassword] = useState('');
  const [showVendorPw, setShowVendorPw]   = useState(false);

  // Admin state
  const [adminEmail, setAdminEmail]       = useState('samyakchordiya99@gmail.com');
  const [adminPassword, setAdminPassword] = useState('Samyak@123');
  const [showAdminPw, setShowAdminPw]     = useState(false);

  // Status
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (user) navigate('/home');
  }, [user, navigate]);

  const clearError = () => setError(null);
  const switchTab  = (tab: RoleTab) => { setActiveTab(tab); clearError(); };

  // ======================================================
  //  CUSTOMER: simple phone + email login
  // ======================================================
  function handleCustomerLogin(e: React.FormEvent) {
    e.preventDefault();
    clearError();

    const phone = custPhone.replace(/\D/g, '');
    const email = custEmail.trim().toLowerCase();
    const name  = custName.trim();

    if (phone.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const uid = `cust-${phone}`;
      const displayName = name || email.split('@')[0];
      const profile: UserProfile = {
        uid,
        email,
        phone: `+91${phone}`,
        displayName,
        role: 'customer',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      loginWithProfile(profile);
      navigate('/home');
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Quick Guest
  function handleDemoCustomer() {
    loginAsDemo('customer');
    navigate('/home');
  }

  // ======================================================
  //  VENDOR LOGIN
  // ======================================================
  function handleVendorLogin(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    if (!shopName.trim()) { setError('Please select a shop.'); return; }
    if (vendorPassword !== 'Apnamart@123') {
      setError('Invalid vendor password. Hint: Apnamart@123');
      return;
    }
    setLoading(true);
    try {
      const isShop2 =
        shopName.toLowerCase().includes('krishna') ||
        shopName.includes('02') ||
        shopName.toLowerCase().includes('sharma');
      const targetShopId = isShop2 ? 'SHOP_02' : 'SHOP_01';
      const vendorUid    = isShop2 ? 'demo-kirana-vendor-2' : 'demo-kirana-vendor-1';
      const cleanName    = isShop2
        ? 'Shri Krishna Kirana & Provision Store'
        : 'Apna Kirana & General Store';

      localStorage.setItem('apnabazaar_active_vendor_shop_id', targetShopId);

      const vendorProfile: UserProfile = {
        uid: vendorUid,
        email: `${targetShopId.toLowerCase()}@apnamart.com`,
        displayName: cleanName,
        role: 'vendor',
        shopId: targetShopId,
        vendorShopId: targetShopId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      loginWithProfile(vendorProfile);
      navigate(`/vendor?shopId=${targetShopId}`);
    } catch (err: any) {
      setError(err?.message || 'Vendor login failed.');
    } finally {
      setLoading(false);
    }
  }

  // ======================================================
  //  ADMIN LOGIN
  // ======================================================
  function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    const emailTrimmed = adminEmail.trim().toLowerCase();
    if (!emailTrimmed || !adminPassword) {
      setError('Please enter admin email and password.');
      return;
    }
    setLoading(true);
    try {
      if (
        emailTrimmed === 'samyakchordiya99@gmail.com' &&
        adminPassword === 'Samyak@123'
      ) {
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
        setError('Invalid admin credentials.');
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
              <small>Delivered fresh from local stores</small>
            </div>
          </div>
          <div className="auth-feature-pill">
            <span className="pill-icon">🏪</span>
            <div>
              <strong>Apna Kirana &amp; Shri Krishna</strong>
              <small>Real inventory with verified prices</small>
            </div>
          </div>
          <div className="auth-feature-pill">
            <span className="pill-icon">📍</span>
            <div>
              <strong>Doorstep GPS Tracking</strong>
              <small>Real-time delivery partner coordinates</small>
            </div>
          </div>
        </div>

        <div className="auth-brand-footer">
          <span>🔒 Safe, verified &amp; SSL-encrypted platform</span>
        </div>
      </div>

      {/* ---- RIGHT FORM PANEL ---- */}
      <div className="auth-form-panel">
        <div className="auth-form-card">
          <div className="auth-form-header">
            <h2 className="auth-form-title">Welcome to ApnaMart</h2>
            <p className="auth-form-subtitle">Select your login portal to proceed</p>
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

          {/* Error */}
          {error && (
            <div className="auth-alert error">
              <span>⚠️</span> <div>{error}</div>
            </div>
          )}

          {/* ===================== CUSTOMER TAB ===================== */}
          {activeTab === 'customer' && (
            <div className="auth-tab-content">
              <form onSubmit={handleCustomerLogin}>
                {/* Phone */}
                <div className="auth-field-group">
                  <label className="auth-field-label">Mobile Number</label>
                  <div className="auth-phone-row">
                    <div className="auth-country-code">🇮🇳 +91</div>
                    <input
                      className="auth-input auth-phone-input"
                      type="tel"
                      placeholder="Enter 10-digit number"
                      value={custPhone}
                      onChange={(e) => setCustPhone(e.target.value.replace(/\D/g, ''))}
                      maxLength={10}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="auth-field-group">
                  <label className="auth-field-label">Email Address</label>
                  <div className="auth-input-wrapper">
                    <span className="auth-input-icon">📧</span>
                    <input
                      className="auth-input auth-input-icon-pad"
                      type="email"
                      placeholder="yourname@gmail.com"
                      value={custEmail}
                      onChange={(e) => setCustEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Name (optional) */}
                <div className="auth-field-group">
                  <label className="auth-field-label">
                    Your Name <span style={{ fontWeight: 400, color: '#9ca3af' }}>(Optional)</span>
                  </label>
                  <div className="auth-input-wrapper">
                    <span className="auth-input-icon">👤</span>
                    <input
                      className="auth-input auth-input-icon-pad"
                      type="text"
                      placeholder="e.g. Rohit Sharma"
                      value={custName}
                      onChange={(e) => setCustName(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  className="auth-btn auth-btn-customer"
                  type="submit"
                  disabled={loading || custPhone.length < 10 || !custEmail.includes('@')}
                >
                  {loading ? 'Logging in…' : '⚡ Continue to ApnaMart'}
                </button>
              </form>

              {/* Quick Guest */}
              <div className="auth-divider-line">
                <span>or instant access</span>
              </div>
              <button type="button" className="auth-btn-demo" onClick={handleDemoCustomer}>
                ⚡ Browse Instantly as Guest Customer (1-Click)
              </button>
            </div>
          )}

          {/* ===================== VENDOR TAB ===================== */}
          {activeTab === 'vendor' && (
            <form onSubmit={handleVendorLogin} className="auth-tab-content">
              {/* Credentials hint */}
              <div className="auth-creds-hint">
                <div className="auth-cred-row">
                  <span>🏪 Shop 1</span><code>Apna Kirana (SHOP_01)</code>
                </div>
                <div className="auth-cred-row">
                  <span>🏪 Shop 2</span><code>Shri Krishna (SHOP_02)</code>
                </div>
                <div className="auth-cred-row">
                  <span>🔒 Password</span><code>Apnamart@123</code>
                </div>
              </div>

              <div className="auth-field-group">
                <label className="auth-field-label">Select Your Shop</label>
                <div className="auth-chips-row">
                  <button
                    type="button"
                    className={`auth-chip ${shopName === 'Apna Kirana & General Store' ? 'active' : ''}`}
                    onClick={() => { setShopName('Apna Kirana & General Store'); setVendorPassword('Apnamart@123'); }}
                  >
                    🏪 Apna Kirana (SHOP_01)
                  </button>
                  <button
                    type="button"
                    className={`auth-chip ${shopName === 'Shri Krishna Kirana & Provision Store' ? 'active' : ''}`}
                    onClick={() => { setShopName('Shri Krishna Kirana & Provision Store'); setVendorPassword('Apnamart@123'); }}
                  >
                    🏪 Shri Krishna (SHOP_02)
                  </button>
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
              {/* Credentials hint */}
              <div className="auth-creds-hint">
                <div className="auth-cred-row">
                  <span>📧 Email</span><code>samyakchordiya99@gmail.com</code>
                </div>
                <div className="auth-cred-row">
                  <span>🔐 Password</span><code>Samyak@123</code>
                </div>
              </div>

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
