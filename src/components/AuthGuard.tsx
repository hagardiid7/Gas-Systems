import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface AuthGuardProps {
  allowedRoles?: string[];
}

const AuthGuard: React.FC<AuthGuardProps> = ({ allowedRoles = [] }) => {
  const { user, loading, getUser } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    if (!user && !loading) {
      getUser();
    }
  }, [user, loading, getUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default AuthGuard;