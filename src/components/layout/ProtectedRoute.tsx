/**
 * ProtectedRoute — gates the MainLayout subtree on session state.
 * 'loading' → splash spinner; 'unauthenticated'/'mfa_pending' → /login.
 */
import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../../hooks/useAuth';

export const ProtectedRoute: React.FC = () => {
  const { status, restoreSession } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (status === 'loading') restoreSession();
  }, [status, restoreSession]);

  if (status === 'loading') {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', bgcolor: 'background.default' }}>
        <CircularProgress sx={{ color: 'primary.main' }} />
      </Box>
    );
  }

  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
};
