/**
 * useAuth — the single auth interface used by the whole app.
 *
 * Backend contract (pingbckd ADMIN.md):
 *   login  → { mfa_required, mfa_token } | { access_token, refresh_token, ... }
 *   verify → { access_token, refresh_token, ... }
 * The role check lives server-side (requireAdmin re-reads the DB on every
 * request), so the panel stores no user record — just tokens + email.
 */
import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../store';
import {
  sessionRestored,
  sessionInvalid,
  mfaChallenge,
  signedIn,
  authError,
  signedOut,
} from '../store/slices/authSlice';
import {
  authApi,
  setTokens,
  clearTokens,
  getAccessToken,
  getRefreshToken,
  getSavedEmail,
  setAuthFailureHandler,
  usersApi,
  ApiError,
} from '../services/api';

export const useAuth = () => {
  const dispatch = useDispatch();
  const { status, email, mfaToken, lockedUntil, error } = useSelector(
    (state: RootState) => state.auth
  );

  // Any 401 that survives the auto-refresh kills the session globally
  useEffect(() => {
    setAuthFailureHandler(() => {
      clearTokens();
      dispatch(sessionInvalid());
    });
  }, [dispatch]);

  /** On app boot: validate the stored access token with a cheap admin call. */
  const restoreSession = useCallback(async () => {
    if (!getAccessToken() || !getRefreshToken()) {
      clearTokens();
      dispatch(sessionInvalid());
      return;
    }
    try {
      await usersApi.list({ limit: 1 }); // 401s are auto-refreshed by the client
      dispatch(sessionRestored(getSavedEmail() ?? 'admin'));
    } catch {
      clearTokens();
      dispatch(sessionInvalid());
    }
  }, [dispatch]);

  const login = useCallback(
    async (emailAddr: string, password: string) => {
      try {
        const res = await authApi.login(emailAddr.trim().toLowerCase(), password);
        if ('mfa_required' in res && res.mfa_required) {
          dispatch(mfaChallenge({ email: emailAddr.trim().toLowerCase(), mfaToken: res.mfa_token }));
          return;
        }
        if ('access_token' in res) {
          setTokens(res.access_token, res.refresh_token);
          dispatch(signedIn(emailAddr.trim().toLowerCase()));
        }
      } catch (err) {
        const apiErr = err as ApiError;
        dispatch(
          authError({
            message: apiErr.message,
            lockedUntil: apiErr.code === 'ACCOUNT_LOCKED' ? apiErr.message : null,
          })
        );
        throw err;
      }
    },
    [dispatch]
  );

  const verifyMfa = useCallback(
    async (code: string) => {
      if (!mfaToken) {
        dispatch(authError({ message: 'MFA session expired — log in again' }));
        return;
      }
      try {
        const res = await authApi.verifyMfa(mfaToken, code);
        setTokens(res.access_token, res.refresh_token);
        dispatch(signedIn(getSavedEmail() ?? 'admin'));
      } catch (err) {
        const apiErr = err as ApiError;
        // An expired pending token flips back to the credentials step
        if (apiErr.message.includes('expired') || apiErr.message.includes('log in again')) {
          dispatch(sessionInvalid());
        }
        dispatch(authError({ message: apiErr.message }));
        throw err;
      }
    },
    [dispatch, mfaToken]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout(getRefreshToken());
    } catch {
      // best-effort — clear locally regardless
    } finally {
      clearTokens();
      dispatch(signedOut());
    }
  }, [dispatch]);

  return {
    status,
    isAuthenticated: status === 'authenticated',
    isMfaPending: status === 'mfa_pending',
    email,
    lockedUntil,
    error,
    restoreSession,
    login,
    verifyMfa,
    logout,
  };
};
