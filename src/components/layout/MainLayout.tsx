/**
 * MainLayout — sidebar + top bar + routed page content.
 * The session has already been verified by ProtectedRoute.
 */
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, CssBaseline, Drawer } from '@mui/material';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

const DRAWER_WIDTH = 248;

export const MainLayout: React.FC = () => (
  <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
    <CssBaseline />

    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          borderRight: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      <Sidebar />
    </Drawer>

    <Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <TopBar />
      <Box component="main" sx={{ p: 3, flexGrow: 1 }}>
        <Outlet />
      </Box>
    </Box>
  </Box>
);
