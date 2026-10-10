/**
 * Login — two-step admin sign-in per the backend contract:
 *   Step 1: email + password → either a session or { mfa_required, mfa_token }
 *   Step 2: 6-digit TOTP (or XXXX-XXXX recovery code) → session
 *
 * The step is driven by redux auth.status; errors (invalid credentials,
 * ACCOUNT_LOCKED with retry time, expired MFA session) render inline.
 */
import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  TextField,
  Typography,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import ShieldIcon from '@mui/icons-material/Shield';
import { useAuth } from '../../hooks/useAuth';
import { pingColors } from '../../theme/muiTheme';

export const LoginPage: React.FC = () => {
  const { status, email, login, verifyMfa, error, lockedUntil } = useAuth();
  const location = useLocation() as { state?: { from?: string } };

  const [emailAddr, setEmailAddr] = useState(email ?? '');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  if (status === 'authenticated') {
    return <Navigate to={location.state?.from ?? '/'} replace />;
  }

  const isMfaStep = status === 'mfa_pending';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (isMfaStep) {
        await verifyMfa(code.trim());
      } else {
        await login(emailAddr, password);
      }
    } catch {
      // error state is rendered from redux
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        display: 'grid',
        placeItems: 'center',
        p: 2,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 400 }}>
        {/* Brand */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography sx={{ fontFamily: '"Fredoka", sans-serif', fontWeight: 700, fontSize: 34, color: pingColors.primary }}>
            Ping Admin
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Real people. Happier conversations.
          </Typography>
        </Box>

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '24px' }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
              {isMfaStep ? (
                <ShieldIcon sx={{ color: pingColors.primary }} />
              ) : (
                <LockIcon sx={{ color: pingColors.primary }} />
              )}
              <Typography variant="h5">
                {isMfaStep ? 'Two-factor verification' : 'Sign in'}
              </Typography>
            </Box>

            {!isMfaStep ? (
              <Box component="form" onSubmit={submit}>
                <TextField
                  fullWidth
                  label="Admin email"
                  type="email"
                  autoComplete="username"
                  value={emailAddr}
                  onChange={(e) => setEmailAddr(e.target.value)}
                  sx={{ mb: 2 }}
                  required
                />
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  sx={{ mb: 1 }}
                  required
                />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                  5 failed attempts lock the account for 15 minutes.
                </Typography>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={busy || !emailAddr || !password}
                  startIcon={busy ? <CircularProgress size={18} color="inherit" /> : undefined}
                >
                  {busy ? 'Signing in…' : 'Continue'}
                </Button>
              </Box>
            ) : (
              <Box component="form" onSubmit={submit}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Enter the 6-digit code from your authenticator app for{' '}
                  <strong>{email}</strong> — or paste a recovery code (XXXX-XXXX).
                </Typography>
                <TextField
                  fullWidth
                  label="Verification code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  sx={{ mb: 2 }}
                  autoFocus
                  slotProps={{ htmlInput: { maxLength: 10, inputMode: 'numeric' } }}
                  required
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={busy || code.trim().length < 6}
                  startIcon={busy ? <CircularProgress size={18} color="inherit" /> : undefined}
                >
                  {busy ? 'Verifying…' : 'Verify & sign in'}
                </Button>
              </Box>
            )}

            {error && (
              <Alert severity={lockedUntil ? 'warning' : 'error'} sx={{ mt: 2.5 }}>
                {error}
              </Alert>
            )}
          </CardContent>
        </Card>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 3 }}>
          Admin sessions are short-lived (30 min) and fully audited.
        </Typography>
      </Box>
    </Box>
  );
};
