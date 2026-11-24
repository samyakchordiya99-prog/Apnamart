import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { Role } from '../types';
import { Spinner } from './Spinner';

interface ProtectedRouteProps {
  children: any;
  role?: Role | Role[];
}

export function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner label="Checking session…" />;

  // Must be authenticated (either via Firebase or demo session)
  if (!user && !profile) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role && profile) {
    const userRole = profile.role;
    const allowed = Array.isArray(role) ? role.includes(userRole) : userRole === role;

    // Super admin can access all dashboards
    if (!allowed && userRole !== 'admin') {
      if (userRole === 'vendor') {
        return <Navigate to="/vendor" replace />;
      }
      return <Navigate to="/home" replace />;
    }
  }

  return children;
}
