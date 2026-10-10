/**
 * Shared domain types for the admin panel.
 *
 * NOTE on casing: list endpoints return camelCase (Drizzle select), while
 * GET /admin/reports/:id uses raw SQL and returns snake_case. The helpers
 * below read either, defensively.
 */

export interface UserRow {
  id: string;
  email: string;
  fullName: string | null;
  username: string | null;
  gender: string | null;
  role: 'user' | 'admin';
  isVerified: boolean;
  isBanned: boolean;
  isDeleted: boolean;
  isAccountDeleted: boolean;
  isDemo: boolean;
  onboardingCompleted: boolean;
  onboardingStep: string;
  lastActiveAt: string | null;
  bannedAt: string | null;
  bannedReason: string | null;
  createdAt: string;
}

export interface PhotoRow {
  id: string;
  url: string;
  order: number;
}

export interface AuditEntry {
  id: string;
  adminId: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata: Record<string, unknown>;
  ip: string | null;
  createdAt: string;
}

export interface UserDetail extends UserRow {
  photos: PhotoRow[];
  reports_filed: number;
  times_reported: number;
  ban_history: Pick<AuditEntry, 'action' | 'metadata' | 'adminId' | 'createdAt'>[];
  // admin accounts (via detail endpoint) may also carry these
  googleAvatar?: string | null;
}

export type ReportStatus = 'pending' | 'reviewed' | 'actioned' | 'dismissed';
export type ReportReason =
  | 'spam'
  | 'inappropriate_content'
  | 'harassment'
  | 'fake_profile'
  | 'underage'
  | 'hate_speech'
  | 'other';

export interface ReportRow {
  id: string;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  adminNote: string | null;
  messageId: string | null;
  conversationId: string | null;
  createdAt: string;
  reviewedAt: string | null;
  reporter: { id: string; fullName: string | null; email: string } | null;
}

/** GET /admin/reports/:id returns a raw-SQL row — snake_case. */
export interface ReportDetail {
  id: string;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  admin_note: string | null;
  conversation_id: string | null;
  message_id: string | null;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  reporter_id: string;
  reporter_name: string | null;
  reporter_email: string;
  reported_id: string;
  reported_name: string | null;
  reported_email: string;
  reported_is_banned: boolean;
  prior_reports: number;
}

export interface MessageRow {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType: 'text' | 'image' | 'voice';
  mediaUrl: string | null;
  isRead: boolean;
  status: 'sent' | 'delivered' | 'read';
  createdAt: string;
}

export interface ConversationPage {
  report_id: string;
  conversation_id: string;
  participants: { reporter_id: string; reported_id: string };
  messages: MessageRow[];
  hasMore: boolean;
  nextCursor: string | null;
}

export interface AuditRow {
  id: string;
  adminId: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata: Record<string, unknown>;
  ip: string | null;
  createdAt: string;
}

export interface OverviewStats {
  total_users: number;
  active_7d: number;
  total_matches: number;
  total_messages: number;
  reports: Partial<Record<ReportStatus, number>>;
}

export interface SeriesPoint {
  day: string;
  count: number;
}

/** Support panel (ADMIN_PRD §6 — backend table + endpoints are pending). */
export type SupportStatus = 'open' | 'acknowledged' | 'resolved';
export type SupportType = 'report' | 'bug' | 'complaint' | 'feature_request';

export interface SupportRow {
  id: string;
  userId: string | null;
  type: SupportType;
  message: string;
  status: SupportStatus;
  adminResponse: string | null;
  resolvedAt: string | null;
  createdAt: string;
  reporter?: { fullName: string | null; email: string } | null;
}
