/**
 * StatusChip — one colored pill for every domain status.
 * Keep colors semantic: banned/error = red, verified/success = green,
 * pending = amber, muted states = gray.
 */
import React from 'react';
import { Chip } from '@mui/material';
import { ReportStatus, SupportStatus, SupportType } from '../../types/admin';

const styles: Record<string, { bg: string; fg: string; label: string }> = {
  // report status
  pending: { bg: '#FEF3C7', fg: '#92400E', label: 'Pending' },
  reviewed: { bg: '#DBEAFE', fg: '#1E40AF', label: 'Reviewed' },
  actioned: { bg: '#DCFCE7', fg: '#166534', label: 'Actioned' },
  dismissed: { bg: '#E5E7EB', fg: '#374151', label: 'Dismissed' },
  // support status
  open: { bg: '#FEF3C7', fg: '#92400E', label: 'Open' },
  acknowledged: { bg: '#DBEAFE', fg: '#1E40AF', label: 'Acknowledged' },
  resolved: { bg: '#DCFCE7', fg: '#166534', label: 'Resolved' },
  // support type
  report: { bg: '#FCE7F3', fg: '#9D174D', label: 'Report' },
  bug: { bg: '#EDE9FE', fg: '#5B21B6', label: 'Bug' },
  complaint: { bg: '#FFEDD5', fg: '#9A3412', label: 'Complaint' },
  feature_request: { bg: '#E0F2FE', fg: '#075985', label: 'Feature request' },
  // user flags
  banned: { bg: '#FEE2E2', fg: '#991B1B', label: 'Banned' },
  active: { bg: '#DCFCE7', fg: '#166534', label: 'Active' },
  verified: { bg: '#DCFCE7', fg: '#166534', label: 'Verified' },
  unverified: { bg: '#F3F4F6', fg: '#6B7280', label: 'Unverified' },
  admin: { bg: '#EDE9FE', fg: '#5B21B6', label: 'Admin' },
  user: { bg: '#F3F4F6', fg: '#6B7280', label: 'User' },
  demo: { bg: '#FFEDD5', fg: '#9A3412', label: 'Demo' },
  deleted: { bg: '#FEE2E2', fg: '#991B1B', label: 'Deleted' },
};

export const StatusChip: React.FC<{ status: string; label?: string }> = ({ status, label }) => {
  const s = styles[status] ?? { bg: '#F3F4F6', fg: '#6B7280', label };
  return (
    <Chip
      size="small"
      label={label ?? s.label}
      sx={{ bgcolor: s.bg, color: s.fg, fontWeight: 600, letterSpacing: '0.01em' }}
    />
  );
};

export const reportStatusChip = (s: ReportStatus) => <StatusChip status={s} />;
export const supportStatusChip = (s: SupportStatus) => <StatusChip status={s} />;
export const supportTypeChip = (t: SupportType) => <StatusChip status={t} />;
