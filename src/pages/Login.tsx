import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  setupRecaptcha,
  sendPhoneOtp,
  verifyPhoneOtp,
  formatPhoneNumber,
} from '../services/auth';
import type { ConfirmationResult } from 'firebase/auth';
import type { UserProfile } from '../types';

type RoleTab = 'customer' | 'vendor' | 'admin';

export function Login() {
  const navigate = useNavigate();
  const { refreshProfile, loginWithProfile, user } = useAuth();

  const [activeTab, setActiveTab] = useState<RoleTab>('customer');

  // ---- Customer / Phone OTP state ----
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [countdown, setCountdown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);

  // ---- Vendor state ----
  const [shopName, setShopName] = useState('');
  const [vendorPassword, setVendorPassword] = useState('');
  const [showVendorPw, setShowVendorPw] = useState(false);

  // ---- Admin state ----
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPw, setShowAdminPw] = useState(false);

  // ---- Shared state ----
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/home');
    }
  }, [user, navigate]);

  // OTP countdown
  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  // Cleanup reCAPTCHA on unmount
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

  const clearError = () => setError(null);

  const switchTab = (tab: RoleTab) => {
    setActiveTab(tab);
    clearError();
    setStatusMsg(null);
  };

  // ======================================================
  //  CUSTOMER – Phone OTP handlers
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
    setStatusMsg('Setting up verification…');
    try {
      const appVerifier = setupRecaptcha('recaptcha-container', 'invisible');
      setStatusMsg(`Sending OTP to ${cleaned}…`);
      const cr = await sendPhoneOtp(cleaned, appVerifier);
      setConfirmationResult(cr);
      setOtpSent(true);
      setCountdown(60);
      setStatusMsg(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to send OTP. Please try again.');
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
      setError('Please enter the full 6-digit OTP.');
      return;
    }
    if (!confirmationResult) {
      setError('Session expired. Please request a new OTP.');
      setOtpSent(false);
      return;
    }
    setLoading(true);
    setStatusMsg('Verifying OTP…');
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

  function handleOtpBox(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const updated = [...otp];
    updated[index] = value.slice(-1);
    setOtp(updated);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  // ======================================================
  //  VENDOR – Shop name + password
  // ======================================================

  async function handleVendorLogin(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    if (!shopName.trim()) {
      setError('Please enter your shop name.');
      return;
    }
    if (vendorPassword !== 'Apnamart@123') {
      setError('Invalid vendor credentials. Please check your password.');
      return;
    }
    setLoading(true);
    try {
      const vendorProfile: UserProfile = {
        uid: `vendor-${shopName.trim().toLowerCase().replace(/\s+/g, '-')}`,
        email: `${shopName.trim().toLowerCase().replace(/\s+/g, '')}@vendor.com`,
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
  //  ADMIN – Fixed credentials
  // ======================================================

  async function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    const emailTrimmed = adminEmail.trim().toLowerCase();
    if (!emailTrimmed || !adminPassword) {
      setError('Please enter both email and password.');
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

  // ======================================================
  //  RENDER
  // ======================================================

  return (
    <div className="auth-split-page">
      {/* ---- LEFT BRAND PANEL ---- */}
      <div className="auth-brand-panel">
        <div className="auth-brand-logo">
          <span className="auth-brand-icon">🛒</span>
        </div>
        <h1 className="auth-brand-name">
          Apna<span className="auth-brand-accent">Mart</span>
        </h1>
        <p className="auth-brand-tagline">Groceries at lightning speed 🚚</p>
        <div className="auth-brand-features">
          <div className="auth-feature-item">
            <span>⚡</span>
            <span>Fast delivery from local Kirana shops</span>
          </div>
          <div className="auth-feature-item">
            <span>🏪</span>
            <span>2 shops — Ravi Kirana & Sharma General</span>
          </div>
          <div className="auth-feature-item">
            <span>💳</span>
            <span>Pay via UPI or Cash on Delivery</span>
          </div>
          <div className="auth-feature-item">
            <span>📍</span>
            <span>Live order tracking at your doorstep</span>
          </div>
        </div>
      </div>

      {/* ---- RIGHT FORM PANEL ---- */}
      <div className="auth-form-panel">
        <div className="auth-form-card">
          <div className="auth-form-header">
            <h2 className="auth-form-title">Welcome back</h2>
            <p className="auth-form-subtitle">Sign in to continue shopping</p>
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

          {/* Error / Status */}
          {error && (
            <div className="auth-alert error">
              <span>⚠️</span> {error}
            </div>
          )}
          {statusMsg && (
            <div className="auth-alert info">
              <span>ℹ️</span> {statusMsg}
            </div>
          )}

          {/* ===================== CUSTOMER TAB ===================== */}
          {activeTab === 'customer' && (
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
                        onChange={(e) => setPhone(e.target.value)}
                        maxLength={12}
                        required
                        autoFocus
                      />
                    </div>
                    <span className="auth-hint">We'll send a 6-digit OTP via SMS</span>
                  </div>
                  <button
                    className="auth-btn auth-btn-customer"
                    type="submit"
                    disabled={loading || !phone.trim()}
                  >
                    {loading ? '⏳ Sending…' : 'Send OTP →'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp}>
                  <div className="auth-otp-sent-info">
                    <span>OTP sent to <strong>+91 {phone}</strong></span>
                    <button
                      type="button"
                      className="auth-link-btn"
                      onClick={() => { setOtpSent(false); setOtp(['','','','','','']); clearError(); }}
                    >
                      Change
                    </button>
                  </div>
                  <div className="auth-field-group">
                    <label className="auth-field-label">Enter 6-digit OTP</label>
                    <div className="auth-otp-boxes">
                      {otp.map((digit, i) => (
                        <input
                          key={i}
                          ref={(el) => { otpRefs.current[i] = el; }}
                          className="auth-otp-box"
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpBox(i, e.target.value)}
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
                    {loading ? '⏳ Verifying…' : '✅ Verify & Login'}
                  </button>
                  <div className="auth-resend-row">
                    <button
                      type="button"
                      className="auth-link-btn"
                      onClick={handleResendOtp}
                      disabled={countdown > 0 || loading}
                    >
                      {countdown > 0 ? `Resend in ${countdown}s` : '🔄 Resend OTP'}
                    </button>
                  </div>
                </form>
              )}
              <div id="recaptcha-container" ref={recaptchaContainerRef} />
            </div>
          )}

          {/* ===================== VENDOR TAB ===================== */}
          {activeTab === 'vendor' && (
            <form onSubmit={handleVendorLogin}>
              <div className="auth-field-group">
                <label className="auth-field-label">Shop Name</label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon">🏪</span>
                  <input
                    className="auth-input auth-input-icon-pad"
                    type="text"
                    placeholder="e.g. Ravi Kirana Store"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    required
                    autoFocus
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
                <span className="auth-hint">Password: Apnamart@123</span>
              </div>
              <button
                className="auth-btn auth-btn-vendor"
                type="submit"
                disabled={loading || !shopName.trim() || !vendorPassword}
              >
                {loading ? '⏳ Logging in…' : 'Enter Vendor Portal →'}
              </button>
              <div className="auth-vendor-note">
                <span>🔑</span> Use your shop name + vendor password to access your dashboard
              </div>
            </form>
          )}

          {/* ===================== ADMIN TAB ===================== */}
          {activeTab === 'admin' && (
            <form onSubmit={handleAdminLogin}>
              <div className="auth-field-group">
                <label className="auth-field-label">Admin Email</label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon">📧</span>
                  <input
                    className="auth-input auth-input-icon-pad"
                    type="email"
                    placeholder="samyakchordiya99@gmail.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>
              <div className="auth-field-group">
                <label className="auth-field-label">Password</label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon">🔐</span>
                  <input
                    className="auth-input auth-input-icon-pad"
                    type={showAdminPw ? 'text' : 'password'}
                    placeholder="Enter admin password"
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
                {loading ? '⏳ Authenticating…' : '🔐 Access Admin Panel →'}
              </button>
              <div className="auth-admin-note">
                <span>🛡️</span> Admin access is restricted to authorized personnel only
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
