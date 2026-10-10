/**
 * StatCard — dashboard KPI card with optional delta/subtext.
 */
import React from 'react';
import { Card, CardContent, Typography, Box, Skeleton } from '@mui/material';
import { pingColors } from '../../theme/muiTheme';

interface StatCardProps {
  label: string;
  value: number | string | undefined;
  loading?: boolean;
  icon?: React.ReactNode;
  tint?: string; // icon bubble color
  subtext?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, loading, icon, tint, subtext }) => (
  <Card
    elevation={0}
    sx={{
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: '16px',
      height: '100%',
    }}
  >
    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {icon && (
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: '14px',
            display: 'grid',
            placeItems: 'center',
            bgcolor: tint ?? pingColors.surface,
            color: tint ? '#fff' : pingColors.primary,
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
      )}
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          {label}
        </Typography>
        <Typography variant="h4" sx={{ lineHeight: 1.15, color: 'text.primary' }}>
          {loading ? <Skeleton width={72} /> : typeof value === 'number' ? value.toLocaleString() : (value ?? '—')}
        </Typography>
        {subtext && (
          <Typography variant="caption" color="text.secondary">
            {subtext}
          </Typography>
        )}
      </Box>
    </CardContent>
  </Card>
);
