import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { CartDrawer } from './CartDrawer';

export function Navbar() {
  const { user, profile, deliveryLocation, setIsLocationModalOpen, signOut } = useAuth();
  const { totalCartCount, isCartDrawerOpen, setIsCartDrawerOpen } = useCart();
  const navigate = useNavigate();

  // Shorten address for display in navbar
  const formattedAddress = deliveryLocation
    ? (deliveryLocation.flat ? `${deliveryLocation.flat}, ` : '') + deliveryLocation.address
    : 'Select Delivery Location';

  return (
    <header className="navbar">
      <div className="navbar-left">
        <Link to="/" className="brand">
          <span className="brand-logo">🛒</span>
          <span>
            Apna<span className="brand-text-accent">Bazaar</span>
          </span>
        </Link>

        {/* Customer / Admin Delivery Location Indicator */}
        {(!profile || profile.role === 'customer' || profile.role === 'admin') && (
          <button
            type="button"
            className="nav-delivery-pill"
            onClick={() => {
              setIsLocationModalOpen(true);
              navigate('/home');
            }}
            title="Click to select or change your delivery location"
          >
            <span className="nav-delivery-icon">📍</span>
            <div className="nav-delivery-info">
              <span className="nav-delivery-tag">Delivering to</span>
              <span className="nav-delivery-text">
                {formattedAddress}
              </span>
            </div>
            <span className="nav-delivery-arrow">Change ▾</span>
          </button>
        )}
      </div>

      <nav className="nav-links">
        {user || profile ? (
          <>
            {(profile?.role === 'customer' || profile?.role === 'admin') && (
              <Link to="/home">🛍️ Nearby Shops</Link>
            )}

            {/* CUSTOMER CART BUTTON IN NAVBAR */}
            {(!profile || profile?.role === 'customer') && (
              <button
                type="button"
                onClick={() => setIsCartDrawerOpen(true)}
                style={{
                  position: 'relative',
                  background: 'none',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '20px',
                  padding: '6px 14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#1e1b4b',
                  fontWeight: 700,
                  fontSize: '13.5px',
                }}
                title="View your shopping cart"
              >
                <span>🛒 Cart</span>
                {totalCartCount > 0 && (
                  <span
                    style={{
                      background: '#7c3aed',
                      color: '#ffffff',
                      borderRadius: '50%',
                      minWidth: '20px',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '0 4px',
                    }}
                  >
                    {totalCartCount}
                  </span>
                )}
              </button>
            )}
            {(profile?.role === 'vendor' || profile?.role === 'admin') && (
              <Link to="/vendor">🏪 Vendor Hub</Link>
            )}
            {profile?.role === 'admin' && (
              <Link to="/admin" className="nav-admin-link">
                ⚙️ Admin Hub
              </Link>
            )}
            <span className="nav-user">
              <span>{profile?.displayName || user?.email || 'User'}</span>
              {profile?.role && (
                <span className={`nav-user-role role-${profile.role}`}>
                  {profile.role === 'admin' ? 'Master Admin' : profile.role}
                </span>
              )}
            </span>
            <button
              className="btn btn-outline small"
              onClick={async () => {
                await signOut();
                navigate('/login');
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/home">🛍️ Browse Shops</Link>
            <Link to="/login">Login</Link>
            <Link to="/signup" className="btn btn-primary small">
              Sign up
            </Link>
          </>
        )}
      </nav>
      {isCartDrawerOpen && <CartDrawer onClose={() => setIsCartDrawerOpen(false)} />}
    </header>
  );
}
