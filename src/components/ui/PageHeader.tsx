// src/components/ui/PageHeader.tsx
import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { theme } from '../../constants/theme';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, action }) => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: '24px' }}>
      <Box>
        <Typography variant='h5' sx={{ fontWeight: 'bold', color: theme.colors.text }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant='body2' sx={{ color: theme.colors.textSecondary, mt: '4px' }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {action && <Box>{action}</Box>}
    </Box>
  );
};