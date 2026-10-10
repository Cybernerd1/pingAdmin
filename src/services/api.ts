/**
 * Admin API client.
 *
 * Every backend response uses the envelope { status, message, data } —
 * the helpers below unwrap and return the inner `data`, so callers work
 * with typed payloads directly.
 *
 * On a 401 the client transparently tries ONE refresh (admin refresh token
 * is rotated on every use) and retries the original request. If the refresh
 * fails, the auth-failure handler fires (wired to the Redux logout action).
 */
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';
const API_PREFIX = '/api/v1';

export const TOKEN_KEYS = {
  access: 'ping_admin_access',
  refresh: 'ping_admin_refresh',
  email: 'ping_admin_email',
} as const;

export interface AdminApiError {
  status: number;
  code: string;
  message: string;
  details?: { field: string; message: string }[];
}

export class ApiError extends Error implements AdminApiError {
  status: number;
  code: string;
  details?: { field: string; message: string }[];

  constructor(err: AdminApiError) {
    super(err.message);
    this.status = err.status;
    this.code = err.code;
    this.details = err.details;
  }
}

export const getAccessToken = () => localStorage.getItem(TOKEN_KEYS.access);
export const getRefreshToken = () => localStorage.getItem(TOKEN_KEYS.refresh);

export const setTokens = (access: string, refresh: string) => {
  localStorage.setItem(TOKEN_KEYS.access, access);
  localStorage.setItem(TOKEN_KEYS.refresh, refresh);
};

export const clearTokens = () => {
  localStorage.removeItem(TOKEN_KEYS.access);
  localStorage.removeItem(TOKEN_KEYS.refresh);
  localStorage.removeItem(TOKEN_KEYS.email);
};

export const getSavedEmail = () => localStorage.getItem(TOKEN_KEYS.email);

// ── Auth failure hook (wired to Redux logout by useAuth) ───────────────
let onAuthFailure: (() => void) | null = null;
export const setAuthFailureHandler = (fn: () => void) => {
  onAuthFailure = fn;
};

const api: AxiosInstance = axios.create({
  baseURL: `${API_BASE}${API_PREFIX}`,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Endpoints that must never trigger the refresh-retry loop
const AUTH_PATHS = ['/admin/auth/login', '/admin/auth/mfa/verify', '/admin/auth/refresh'];

let refreshInFlight: Promise<string | null> | null = null;

const tryRefresh = async (): Promise<string | null> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  try {
    const res = await axios.post(
      `${API_BASE}${API_PREFIX}/admin/auth/refresh`,
      { refresh_token: refreshToken },
      { timeout: 15000 }
    );
    const { access_token, refresh_token } = res.data?.data ?? {};
    if (!access_token || !refresh_token) return null;
    setTokens(access_token, refresh_token); // rotation — old refresh is now dead
    return access_token;
  } catch {
    return null;
  }
};

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retried?: boolean };
    const status = error.response?.status;
    const path = original?.url ?? '';

    if (status === 401 && original && !original._retried && !AUTH_PATHS.some((p) => path.includes(p))) {
      original._retried = true;
      refreshInFlight = refreshInFlight ?? tryRefresh();
      const newToken = await refreshInFlight;
      refreshInFlight = null;

      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api.request(original);
      }
      // Refresh failed — session is dead
      clearTokens();
      onAuthFailure?.();
    }

    const data = error.response?.data as any;
    return Promise.reject(
      new ApiError({
        status: status ?? 0,
        code: data?.code ?? (status ? `HTTP_${status}` : 'NETWORK_ERROR'),
        message: data?.message ?? (status ? `Request failed (${status})` : 'Could not reach the server'),
        details: data?.details,
      })
    );
  }
);

// ── Envelope unwrap helper ─────────────────────────────────────────────
const unwrap = <T>(p: Promise<{ data: { data: T } }>): Promise<T> =>
  p.then((res) => res.data.data);

// ── Auth ───────────────────────────────────────────────────────────────
export interface SessionTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  recovery_codes_remaining?: number;
}

export interface MfaChallenge {
  mfa_required: true;
  mfa_token: string;
  expires_in: number;
}

export const authApi = {
  login: (email: string, password: string) =>
    unwrap<SessionTokens | MfaChallenge>(api.post('/admin/auth/login', { email, password })),
  verifyMfa: (mfa_token: string, code: string) =>
    unwrap<SessionTokens>(api.post('/admin/auth/mfa/verify', { mfa_token, code })),
  logout: (refresh_token?: string | null) =>
    unwrap<Record<string, never>>(api.post('/admin/auth/logout', { refresh_token })),
};

// ── Users ──────────────────────────────────────────────────────────────
export interface UserListQuery {
  search?: string;
  filter?: 'banned' | 'verified' | 'deleted' | 'demo' | 'admin' | 'incomplete';
  sort?: 'created_at' | 'last_active';
  page?: number;
  limit?: number;
}

export const usersApi = {
  list: (params: UserListQuery = {}) =>
    unwrap<{ users: any[]; total: number; page: number; limit: number }>(
      api.get('/admin/users', { params })
    ),
  detail: (id: string) => unwrap<{ user: any }>(api.get(`/admin/users/${id}`)),
  ban: (id: string, reason: string) =>
    unwrap<{ user_id: string; banned: boolean; already_banned: boolean }>(
      api.post(`/admin/users/${id}/ban`, { reason })
    ),
  unban: (id: string) =>
    unwrap<{ user_id: string; banned: boolean; was_banned: boolean }>(
      api.post(`/admin/users/${id}/unban`)
    ),
  verify: (id: string, verified: boolean) =>
    unwrap<{ user_id: string; is_verified: boolean }>(
      api.patch(`/admin/users/${id}/verify`, { verified })
    ),
  softDelete: (id: string, reason?: string) =>
    unwrap<{ user_id: string; deleted: boolean }>(
      api.delete(`/admin/users/${id}`, { data: { reason } })
    ),
};

// ── Reports ────────────────────────────────────────────────────────────
export interface ReportListQuery {
  status?: 'pending' | 'reviewed' | 'actioned' | 'dismissed';
  reason?: string;
  page?: number;
  limit?: number;
}

export const reportsApi = {
  list: (params: ReportListQuery = {}) =>
    unwrap<{ reports: any[]; total: number; page: number; limit: number }>(
      api.get('/admin/reports', { params })
    ),
  detail: (id: string) => unwrap<{ report: any }>(api.get(`/admin/reports/${id}`)),
  patch: (id: string, body: { status?: string; admin_note?: string }) =>
    unwrap<{ report: any }>(api.patch(`/admin/reports/${id}`, body)),
  action: (id: string, admin_note?: string) =>
    unwrap<{ report: any; reported_user_id: string; banned: boolean }>(
      api.post(`/admin/reports/${id}/action`, admin_note !== undefined ? { admin_note } : {})
    ),
  conversation: (id: string, cursor?: string, limit = 50) =>
    unwrap<{
      report_id: string;
      conversation_id: string;
      participants: { reporter_id: string; reported_id: string };
      messages: any[];
      hasMore: boolean;
      nextCursor: string | null;
    }>(api.get(`/admin/reports/${id}/conversation`, { params: { cursor, limit } })),
};

// ── Audit log ──────────────────────────────────────────────────────────
export interface AuditListQuery {
  admin_id?: string;
  target_type?: 'user' | 'report' | 'conversation';
  target_id?: string;
  action?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export const auditApi = {
  list: (params: AuditListQuery = {}) =>
    unwrap<{ entries: any[]; total: number; page: number; limit: number }>(
      api.get('/admin/audit-log', { params })
    ),
};

// ── Stats ──────────────────────────────────────────────────────────────
export interface OverviewStats {
  total_users: number;
  active_7d: number;
  total_matches: number;
  total_messages: number;
  reports: Record<string, number>;
}

export interface SeriesPoint {
  day: string;
  count: number;
}

export const statsApi = {
  overview: () => unwrap<OverviewStats>(api.get('/admin/stats/overview')),
  signups: (days = 30) => unwrap<{ days: number; series: SeriesPoint[] }>(api.get(`/admin/stats/signups?days=${days}`)),
  matches: (days = 30) => unwrap<{ days: number; series: SeriesPoint[] }>(api.get(`/admin/stats/matches?days=${days}`)),
};

// ── Support (backend endpoints pending — see ADMIN_PRD §6) ─────────────
export interface SupportListQuery {
  status?: 'open' | 'acknowledged' | 'resolved';
  type?: 'report' | 'bug' | 'complaint' | 'feature_request';
  page?: number;
  limit?: number;
}

export const supportApi = {
  list: (params: SupportListQuery = {}) =>
    unwrap<{ entries: any[]; total: number; page: number; limit: number }>(
      api.get('/admin/support', { params })
    ),
  patch: (id: string, body: { status?: string; admin_response?: string }) =>
    unwrap<any>(api.patch(`/admin/support/${id}`, body)),
  resolve: (id: string, admin_response: string) =>
    unwrap<any>(api.post(`/admin/support/${id}/resolve`, { admin_response })),
};
