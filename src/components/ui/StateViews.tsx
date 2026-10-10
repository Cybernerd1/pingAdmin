/**
 * StateViews — the three states every screen must handle
 * (PRD Phase 5: loading, empty, error — error text from the API envelope).
 */
import React from 'react';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import InboxIcon from '@mui/icons-material/Inbox';

export const EmptyState: React.FC<{
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}> = ({ title, subtitle, action }) => (
  <Box sx={{ py: 8, textAlign: 'center' }}>
    <InboxIcon sx={{ fontSize: 44, color: 'text.disabled', mb: 1 }} />
    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
      {title}
    </Typography>
    {subtitle && (
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        {subtitle}
      </Typography>
    )}
    {action && <Box sx={{ mt: 2 }}>{action}</Box>}
  </Box>
);

export const ErrorState: React.FC<{
  message: string;
  onRetry?: () => void;
}> = ({ message, onRetry }) => (
  <Box sx={{ py: 8, textAlign: 'center' }}>
    <ErrorOutlineOutlinedIcon sx={{ fontSize: 44, color: 'error.light', mb: 1 }} />
    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
      Something went wrong
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 480, mx: 'auto' }}>
      {message}
    </Typography>
    {onRetry && (
      <Button variant="outlined" size="small" sx={{ mt: 2 }} onClick={onRetry}>
        Try again
      </Button>
    )}
  </Box>
);

export const LoadingState: React.FC<{ label?: string }> = ({ label }) => (
  <Box sx={{ py: 8, textAlign: 'center' }}>
    <CircularProgress size={32} sx={{ color: 'primary.main' }} />
    {label && (
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
        {label}
      </Typography>
    )}
  </Box>
);
