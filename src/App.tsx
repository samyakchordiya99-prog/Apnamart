import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { ForgotPassword } from './pages/ForgotPassword';
import { CustomerHome } from './pages/CustomerHome';
import { VendorDashboard } from './pages/VendorDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { ProtectedRoute } from './components/ProtectedRoute';

function AppLayout() {
  const location = useLocation();
  const isAuthPage = ['/login', '/signup', '/forgot'].includes(location.pathname);

  return (
    <div className={`app-shell ${isAuthPage ? 'auth-mode' : ''}`}>
      {!isAuthPage && <Navbar />}
      <main className={`main ${isAuthPage ? 'main-auth' : ''}`}>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot" element={<ForgotPassword />} />
          <Route
            path="/home"
            element={
              <ProtectedRoute role={['customer', 'admin']}>
                <CustomerHome />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor"
            element={
              <ProtectedRoute role={['vendor', 'admin']}>
                <VendorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppLayout />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
