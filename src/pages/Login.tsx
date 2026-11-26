import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  signInWithGoogle,
  setupRecaptcha,
  sendPhoneOtp,
  verifyPhoneOtp,
  formatPhoneNumber,
} from '../services/auth';
import type { ConfirmationResult } from 'firebase/auth';
import type { UserProfile } from '../types';

type RoleTab = 'customer' | 'vendor' | 'admin';
type CustomerAuthMethod = 'phone' | 'google';

export function Login() {
  const navigate = useNavigate();
  const { refreshProfile, loginWithProfile, loginAsDemo, user } = useAuth();

  const [activeTab, setActiveTab] = useState<RoleTab>('customer');
  const [customerMethod, setCustomerMethod] = useState<CustomerAuthMethod>('phone');

  // Phone OTP state
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [countdown, setCountdown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);

  // Vendor state
  const [shopName, setShopName] = useState('');
  const [vendorPassword, setVendorPassword] = useState('');
  const [showVendorPw, setShowVendorPw] = useState(false);

  // Admin state
  const [adminEmail, setAdminEmail] = useState('samyakchordiya99@gmail.com');
  const [adminPassword, setAdminPassword] = useState('Samyak@123');
  const [showAdminPw, setShowAdminPw] = useState(false);

  // Status & loaders
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/home');
    }
  }, [user, navigate]);

  // Countdown for OTP
  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  // Cleanup recaptcha on unmount
  useEffect(() => {
    return () => {
      try {
        if ((window as any).recaptchaVerifier) {
          (window as any).recaptchaVerifier.clear();
          (window as any).recaptchaVerifier = null;
        }
      } catch {}
    };
  }, []);

  const clearError = () => {
    setError(null);
    setStatusMsg(null);
  };

  const switchTab = (tab: RoleTab) => {
    setActiveTab(tab);
    clearError();
  };

  // ======================================================
  //  CUSTOMER: PHONE NUMBER OTP
  // ======================================================
  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    const cleaned = formatPhoneNumber(phone);
    if (!cleaned || cleaned.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setLoading(true);
    setStatusMsg('Preparing reCAPTCHA verification…');
    try {
      const appVerifier = setupRecaptcha('recaptcha-container', 'invisible');
      setStatusMsg(`Sending OTP to ${cleaned}…`);
      const cr = await sendPhoneOtp(cleaned, appVerifier);
      setConfirmationResult(cr);
      setOtpSent(true);
      setCountdown(60);
      setStatusMsg(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to send OTP. Please check the mobile number.');
    } finally {
      setLoading(false);
      setStatusMsg(null);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    const otpStr = otp.join('');
    if (otpStr.length < 6) {
      setError('Please enter the complete 6-digit OTP code.');
      return;
    }
    if (!confirmationResult) {
      setError('Session expired. Please request a new OTP code.');
      setOtpSent(false);
      return;
    }
    setLoading(true);
    setStatusMsg('Verifying OTP code…');
    try {
      const res = await verifyPhoneOtp(confirmationResult, otpStr);
      await refreshProfile();
      if (res.profile?.role === 'admin') navigate('/admin');
      else if (res.profile?.role === 'vendor') navigate('/vendor');
      else navigate('/home');
    } catch (err: any) {
      setError(err?.message || 'OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
      setStatusMsg(null);
    }
  }

  async function handleResendOtp() {
    if (countdown > 0) return;
    clearError();
    setLoading(true);
    try {
      const appVerifier = setupRecaptcha('recaptcha-container', 'invisible');
      const cr = await sendPhoneOtp(formatPhoneNumber(phone), appVerifier);
      setConfirmationResult(cr);
      setCountdown(60);
    } catch (err: any) {
      setError(err?.message || 'Could not resend OTP.');
    } finally {
      setLoading(false);
    }
  }

  function handleOtpDigit(index: number, val: string) {
    if (!/^\d*$/.test(val)) return;
    const nextOtp = [...otp];
    nextOtp[index] = val.slice(-1);
    setOtp(nextOtp);
    if (val && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  // ======================================================
  //  CUSTOMER: GOOGLE / GMAIL LOGIN
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
      console.warn('Google sign-in error:', err);
      if (err?.message?.includes('unauthorized-domain')) {
        setError(
          'Firebase Domain Not Authorized: In Firebase Console -> Authentication -> Settings -> Authorized Domains, add "apnamart-teal.vercel.app". Or use Phone Login / Quick Guest below!'
        );
      } else if (err?.message?.includes('popup-closed-by-user')) {
        setError('Google sign-in was closed before completion. Please try again.');
      } else {
        setError(err?.message || 'Google sign-in failed.');
      }
    } finally {
      setLoading(false);
      setStatusMsg(null);
    }
  }

  // Quick Demo Customer
  function handleDemoCustomer() {
    loginAsDemo('customer');
    navigate('/home');
  }

  // ======================================================
  //  VENDOR LOGIN
  // ======================================================
  async function handleVendorLogin(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    if (!shopName.trim()) {
      setError('Please enter or select your shop name.');
      return;
    }
    if (vendorPassword !== 'Apnamart@123') {
      setError('Invalid vendor password. (Hint: Apnamart@123)');
      return;
    }
    setLoading(true);
    try {
      const isShop2 =
        shopName.toLowerCase().includes('krishna') ||
        shopName.includes('02') ||
        shopName.toLowerCase().includes('sharma');
      const targetShopId = isShop2 ? 'SHOP_02' : 'SHOP_01';
      const vendorUid = isShop2 ? 'demo-kirana-vendor-2' : 'demo-kirana-vendor-1';
      const cleanName = isShop2
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
  async function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    const emailTrimmed = adminEmail.trim().toLowerCase();
    if (!emailTrimmed || !adminPassword) {
      setError('Please enter admin email and password.');
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
              <strong>Ravi Kirana & Sharma General</strong>
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
          <span>🔒 Safe, verified & SSL-encrypted platform</span>
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

          {/* Alerts */}
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
              {/* Method Sub-Tabs: Phone OTP or Google */}
              <div className="auth-method-switcher">
                <button
                  type="button"
                  className={`auth-method-btn ${customerMethod === 'phone' ? 'active' : ''}`}
                  onClick={() => {
                    setCustomerMethod('phone');
                    clearError();
                  }}
                >
                  📱 Mobile (OTP)
                </button>
                <button
                  type="button"
                  className={`auth-method-btn ${customerMethod === 'google' ? 'active' : ''}`}
                  onClick={() => {
                    setCustomerMethod('google');
                    clearError();
                  }}
                >
                  🌐 Google (Gmail)
                </button>
              </div>

              {/* METHOD 1: PHONE NUMBER WITH OTP */}
              {customerMethod === 'phone' && (
                <div>
                  {!otpSent ? (
                    <form onSubmit={handleSendOtp}>
                      <div className="auth-field-group">
                        <label className="auth-field-label">Mobile Number</label>
                        <div className="auth-phone-row">
                          <div className="auth-country-code">🇮🇳 +91</div>
                          <input
                            className="auth-input auth-phone-input"
                            type="tel"
                            placeholder="Enter 10-digit number"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                            maxLength={10}
                            required
                            autoFocus
                          />
                        </div>
                        <span className="auth-hint">We'll send an official SMS code to verify.</span>
                      </div>
                      <button
                        className="auth-btn auth-btn-customer"
                        type="submit"
                        disabled={loading || phone.trim().length < 10}
                      >
                        {loading ? 'Sending OTP…' : '📲 Send Verification OTP'}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyOtp}>
                      <div className="auth-otp-sent-info">
                        <span>
                          Code sent to: <strong>+91 {phone}</strong>
                        </span>
                        <button
                          type="button"
                          className="auth-link-text font-bold"
                          onClick={() => {
                            setOtpSent(false);
                            setOtp(['', '', '', '', '', '']);
                            clearError();
                          }}
                        >
                          Change Number
                        </button>
                      </div>

                      <div className="auth-field-group">
                        <label className="auth-field-label">Enter 6-Digit OTP</label>
                        <div className="auth-otp-boxes">
                          {otp.map((digit, i) => (
                            <input
                              key={i}
                              ref={(el) => {
                                otpRefs.current[i] = el;
                              }}
                              className="auth-otp-box"
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              value={digit}
                              onChange={(e) => handleOtpDigit(i, e.target.value)}
                              onKeyDown={(e) => handleOtpKeyDown(i, e)}
                              autoFocus={i === 0}
                            />
                          ))}
                        </div>
                      </div>

                      <button
                        className="auth-btn auth-btn-customer"
                        type="submit"
                        disabled={loading || otp.join('').length < 6}
                      >
                        {loading ? 'Verifying OTP…' : '✅ Verify & Continue'}
                      </button>

                      <div className="auth-resend-row">
                        <button
                          type="button"
                          className="auth-link-text"
                          onClick={handleResendOtp}
                          disabled={countdown > 0 || loading}
                        >
                          {countdown > 0 ? `Resend OTP in ${countdown}s` : '🔄 Resend OTP Code'}
                        </button>
                      </div>
                    </form>
                  )}
                  <div id="recaptcha-container" ref={recaptchaContainerRef} />
                </div>
              )}

              {/* METHOD 2: GOOGLE / GMAIL */}
              {customerMethod === 'google' && (
                <div className="auth-gmail-box">
                  <button
                    type="button"
                    className="auth-google-btn"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                  >
                    <svg className="google-icon" viewBox="0 0 24 24" width="22" height="22">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                    <span>{loading ? 'Connecting Google…' : 'Sign in with Google (Gmail)'}</span>
                  </button>
                  <p className="auth-hint-center">Instant 1-click login with your Google account</p>
                </div>
              )}

              {/* Instant 1-Click Guest Test */}
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
              <div className="auth-field-group">
                <label className="auth-field-label">Quick Shop Selection</label>
                <div className="auth-chips-row">
                  <button
                    type="button"
                    className={`auth-chip ${shopName === 'Apna Kirana & General Store' ? 'active' : ''}`}
                    onClick={() => {
                      setShopName('Apna Kirana & General Store');
                      setVendorPassword('Apnamart@123');
                    }}
                  >
                    🏪 Apna Kirana (SHOP_01)
                  </button>
                  <button
                    type="button"
                    className={`auth-chip ${shopName === 'Shri Krishna Kirana & Provision Store' ? 'active' : ''}`}
                    onClick={() => {
                      setShopName('Shri Krishna Kirana & Provision Store');
                      setVendorPassword('Apnamart@123');
                    }}
                  >
                    🏪 Shri Krishna (SHOP_02)
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
                    placeholder="e.g. Apna Kirana & General Store"
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
                <span className="auth-hint">
                  Password: <code>Apnamart@123</code>
                </span>
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
