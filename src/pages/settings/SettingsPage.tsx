/**
 * SettingsPage — session/security info. There is deliberately no profile
 * editing or MFA management in the panel v1: admins are created and reset
 * via the server CLI (`npm run admin:create`) which holds the TOTP secrets.
 * This page makes that workflow discoverable instead of hiding it.
 */
import React from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import ShieldIcon from '@mui/icons-material/Shield';
import KeyIcon from '@mui/icons-material/Key';
import TerminalIcon from '@mui/icons-material/Terminal';
import { useAuth } from '../../hooks/useAuth';
import { KeyValue } from '../../components/ui/DataTable';
import { useNavigate } from 'react-router-dom';

const SECURITY_POINTS = [
  'Admin tokens use a separate signing secret and aud:"admin" — app tokens are always rejected.',
  'Your role and ban status are re-checked in the database on every request.',
  'Access tokens expire after 30 minutes; the refresh token (8 h) rotates on every use.',
  '5 failed logins lock the account for 15 minutes — per account and per IP.',
  'Every mutating action lands in the append-only audit log, including conversation reads.',
];

export const SettingsPage: React.FC = () => {
  const { email, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <Box sx={{ maxWidth: 860 }}>
      <Grid container spacing={2}>
        {/* Session */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '16px', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <KeyIcon sx={{ color: 'primary.main' }} />
                <Typography variant="h6">Session</Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid size={12}>
                  <KeyValue label="Signed in as" value={email ?? 'admin'} />
                </Grid>
                <Grid size={12}>
                  <KeyValue label="Access token lifetime" value="30 minutes (auto-refreshed)" />
                </Grid>
                <Grid size={12}>
                  <KeyValue label="Refresh token lifetime" value="8 hours, rotated on every refresh" />
                </Grid>
              </Grid>
              <Button
                variant="outlined"
                color="error"
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
                sx={{ mt: 2.5 }}
              >
                Log out of this session
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Security model */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '16px', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <ShieldIcon sx={{ color: 'primary.main' }} />
                <Typography variant="h6">Security model</Typography>
              </Box>
              <Box component="ul" sx={{ pl: 2.5, m: 0 }}>
                {SECURITY_POINTS.map((p) => (
                  <Typography component="li" variant="body2" key={p} sx={{ mb: 1, color: 'text.secondary' }}>
                    {p}
                  </Typography>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Admin lifecycle */}
        <Grid size={12}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '16px' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <TerminalIcon sx={{ color: 'primary.main' }} />
                <Typography variant="h6">Admin lifecycle runs on the server</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Creating admins, resetting passwords, and regenerating MFA secrets are CLI-only by design —
                the panel never touches TOTP secrets. On the backend host:
              </Typography>
              <Box
                component="pre"
                sx={{
                  bgcolor: '#2B1620',
                  color: '#FBDCE6',
                  borderRadius: '12px',
                  p: 2,
                  fontSize: 13,
                  overflowX: 'auto',
                  m: 0,
                }}
              >
{`# create a new admin (prints otpauth:// URI + recovery codes once)
npm run admin:create -- --email admin@yourdomain.com --password '<strong-password>'

# reset an existing admin's password + MFA (asks for confirmation)
npm run admin:create -- --email admin@yourdomain.com --force`}
              </Box>
              <Alert severity="info" variant="outlined" sx={{ mt: 2 }}>
                Recovery codes are shown exactly once at creation — store them in a password manager.
                A locked account unlocks itself after 15 minutes.
              </Alert>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
