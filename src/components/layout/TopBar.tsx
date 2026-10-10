/**
 * TopBar — sticky header: page title on the left, admin identity on the right.
 * The title derives from the current route so pages don't repeat it.
 */
import React from 'react';
import { useLocation } from 'react-router-dom';
import { AppBar, Avatar, Box, Toolbar, Typography } from '@mui/material';
import { useAuth } from '../../hooks/useAuth';
import { pingColors } from '../../theme/muiTheme';

const TITLES: { match: (p: string) => boolean; title: string }[] = [
  { match: (p) => p === '/', title: 'Dashboard' },
  { match: (p) => p.startsWith('/users'), title: 'Users' },
  { match: (p) => p.startsWith('/reports'), title: 'Reports' },
  { match: (p) => p.startsWith('/audit'), title: 'Audit Log' },
  { match: (p) => p.startsWith('/support'), title: 'Support & Feedback' },
  { match: (p) => p.startsWith('/settings'), title: 'Settings' },
];

export const TopBar: React.FC = () => {
  const location = useLocation();
  const { email } = useAuth();
  const title = TITLES.find((t) => t.match(location.pathname))?.title ?? 'Ping Admin';

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Toolbar sx={{ gap: 2 }}>
        <Typography variant="h6" sx={{ flexGrow: 1, color: 'text.primary' }}>
          {title}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: pingColors.primary,
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {(email ?? 'A').slice(0, 2).toUpperCase()}
          </Avatar>
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
            {email ?? 'Admin'}
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  );
};
