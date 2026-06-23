import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { UserRole } from '../types';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuthStore();
  const location = useLocation();

  // Show a premium glassmorphic loading screen while checking auth
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          backgroundColor: '#0b0f19',
        }}
      >
        <CircularProgress color="primary" size={50} />
      </Box>
    );
  }

  // Redirect to landing page if user is not authenticated
  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Check role authorization if allowedRoles list is provided
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
