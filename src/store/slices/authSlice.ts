/**
 * Auth slice — three states drive the whole app:
 *   'unauthenticated' → Login page (credentials step)
 *   'mfa_pending'     → Login page (code step)
 *   'authenticated'   → MainLayout
 */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type AuthStatus = 'loading' | 'unauthenticated' | 'mfa_pending' | 'authenticated';

interface AuthState {
  status: AuthStatus;
  email: string | null;
  mfaToken: string | null;
  /** Set when the backend reports the account is locked (429 ACCOUNT_LOCKED) */
  lockedUntil: string | null;
  error: string | null;
}

const initialState: AuthState = {
  status: 'loading',
  email: localStorage.getItem('ping_admin_email'),
  mfaToken: null,
  lockedUntil: null,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    sessionRestored: (state, action: PayloadAction<string>) => {
      state.status = 'authenticated';
      state.email = action.payload;
      state.mfaToken = null;
      state.error = null;
    },
    sessionInvalid: (state) => {
      state.status = 'unauthenticated';
      state.email = null;
      state.mfaToken = null;
    },
    mfaChallenge: (state, action: PayloadAction<{ email: string; mfaToken: string }>) => {
      state.status = 'mfa_pending';
      state.email = action.payload.email;
      state.mfaToken = action.payload.mfaToken;
      state.error = null;
      localStorage.setItem('ping_admin_email', action.payload.email);
    },
    signedIn: (state, action: PayloadAction<string>) => {
      state.status = 'authenticated';
      state.email = action.payload;
      state.mfaToken = null;
      state.error = null;
      state.lockedUntil = null;
      localStorage.setItem('ping_admin_email', action.payload);
    },
    authError: (state, action: PayloadAction<{ message: string; lockedUntil?: string | null }>) => {
      state.error = action.payload.message;
      state.lockedUntil = action.payload.lockedUntil ?? null;
    },
    signedOut: (state) => {
      state.status = 'unauthenticated';
      state.email = null;
      state.mfaToken = null;
      state.error = null;
      state.lockedUntil = null;
    },
  },
});

export const {
  sessionRestored,
  sessionInvalid,
  mfaChallenge,
  signedIn,
  authError,
  signedOut,
} = authSlice.actions;

export default authSlice.reducer;
