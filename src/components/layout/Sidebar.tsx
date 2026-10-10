/**
 * Sidebar — fixed navigation with active-state highlighting.
 * Nav items are data-driven so adding a section is one array entry.
 */
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import FlagIcon from '@mui/icons-material/Flag';
import HistoryIcon from '@mui/icons-material/History';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../../hooks/useAuth';
import { pingColors } from '../../theme/muiTheme';

const NAV_ITEMS = [
  { label: 'Dashboard', to: '/', icon: <DashboardIcon fontSize="small" /> },
  { label: 'Users', to: '/users', icon: <PeopleIcon fontSize="small" /> },
  { label: 'Reports', to: '/reports', icon: <FlagIcon fontSize="small" /> },
  { label: 'Audit Log', to: '/audit', icon: <HistoryIcon fontSize="small" /> },
  { label: 'Support', to: '/support', icon: <SupportAgentIcon fontSize="small" /> },
  { label: 'Settings', to: '/settings', icon: <SettingsIcon fontSize="small" /> },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { email, logout } = useAuth();

  const isActive = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
      }}
    >
      {/* Brand */}
      <Box sx={{ px: 3, pt: 3, pb: 2 }}>
        <Typography
          sx={{
            fontFamily: '"Fredoka", sans-serif',
            fontWeight: 700,
            fontSize: 22,
            color: pingColors.primary,
          }}
        >
          Ping Admin
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Real people. Happier conversations.
        </Typography>
      </Box>

      <Divider sx={{ mx: 2, borderColor: 'divider' }} />

      {/* Nav */}
      <List sx={{ px: 1.5, py: 2, flexGrow: 1 }}>
        {NAV_ITEMS.map((item) => (
          <ListItemButton
            key={item.to}
            onClick={() => navigate(item.to)}
            selected={isActive(item.to)}
            sx={{
              borderRadius: '12px',
              mb: 0.5,
              py: 1.1,
              '&.Mui-selected': {
                bgcolor: pingColors.surface,
                color: pingColors.primary,
                '& .MuiListItemIcon-root': { color: pingColors.primary },
                '&:hover': { bgcolor: pingColors.surface },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
            <Typography variant="body2" sx={{ fontWeight: isActive(item.to) ? 700 : 500 }}>
              {item.label}
            </Typography>
          </ListItemButton>
        ))}
      </List>

      {/* Footer: signed-in admin + logout */}
      <Box sx={{ px: 2, pb: 2.5 }}>
        <Divider sx={{ mb: 1.5, borderColor: 'divider' }} />
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', px: 1, mb: 1, wordBreak: 'break-all' }}>
          {email ?? 'Signed in'}
        </Typography>
        <ListItemButton
          onClick={handleLogout}
          sx={{ borderRadius: '12px', py: 1 }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <Typography variant="body2">Log out</Typography>
        </ListItemButton>
      </Box>
    </Box>
  );
};
