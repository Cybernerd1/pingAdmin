/**
 * ReportsPage — moderation queue.
 * Filter chips by status + reason dropdown; row click opens the detail
 * drawer where status can be patched, the report actioned (ban + close in
 * one server-side transaction), or the linked conversation read (every
 * read is audit-logged server-side).
 */
import React, { useState } from 'react';
import useSWR from 'swr';
import {
  Box,
  Chip,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { reportsApi, ApiError } from '../../services/api';
import { DataTable, Column } from '../../components/ui/DataTable';
import { StatusChip } from '../../components/ui/StatusChip';
import { SuccessSnackbar } from '../../components/ui/ConfirmModal';
import { ReportDetailDrawer } from './ReportDetailDrawer';
import { ReportRow, ReportStatus } from '../../types/admin';
import { formatRelative, truncate } from '../../utils/format';

const STATUSES: (ReportStatus | undefined)[] = [undefined, 'pending', 'reviewed', 'actioned', 'dismissed'];

const REASONS = [
  { value: undefined, label: 'All reasons' },
  { value: 'spam', label: 'Spam' },
  { value: 'inappropriate_content', label: 'Inappropriate content' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'fake_profile', label: 'Fake profile' },
  { value: 'underage', label: 'Underage' },
  { value: 'hate_speech', label: 'Hate speech' },
  { value: 'other', label: 'Other' },
];

export const ReportsPage: React.FC = () => {
  const [status, setStatus] = useState<ReportStatus | undefined>('pending');
  const [reason, setReason] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);

  const { data, error, isLoading, mutate } = useSWR(
    ['reports', status, reason, page, limit],
    () => reportsApi.list({ status, reason, page: page + 1, limit }),
    { keepPreviousData: true }
  );

  const [detailId, setDetailId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const columns: Column<ReportRow>[] = [
    {
      key: 'reason',
      label: 'Report',
      render: (r) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
            {r.reason.replaceAll('_', ' ')}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {truncate(r.details, 70)}
          </Typography>
        </Box>
      ),
    },
    {
      key: 'reporter',
      label: 'Reporter',
      width: 200,
      render: (r) => (
        <Box>
          <Typography variant="body2">{r.reporter?.fullName ?? '—'}</Typography>
          <Typography variant="caption" color="text.secondary">
            {r.reporter?.email}
          </Typography>
        </Box>
      ),
    },
    { key: 'status', label: 'Status', width: 120, render: (r) => <StatusChip status={r.status} /> },
    { key: 'createdAt', label: 'Filed', width: 110, sortable: true, render: (r) => formatRelative(r.createdAt) },
    {
      key: 'reviewedAt',
      label: 'Reviewed',
      width: 110,
      render: (r) => (r.reviewedAt ? formatRelative(r.reviewedAt) : '—'),
    },
    {
      key: 'conversationId',
      label: 'Evidence',
      width: 100,
      align: 'center',
      render: (r) => (
        <Tooltip title={r.conversationId ? 'Linked conversation' : 'No conversation linked'}>
          <Typography variant="body2">{r.conversationId ? '💬' : '—'}</Typography>
        </Tooltip>
      ),
    },
  ];

  return (
    <Box>
      {/* Toolbar */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2.5 }}>
        <Stack direction="row" spacing={1}>
          {STATUSES.map((s) => (
            <Chip
              key={s ?? 'all'}
              label={s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
              clickable
              color={status === s ? 'primary' : 'default'}
              variant={status === s ? 'filled' : 'outlined'}
              onClick={() => {
                setStatus(s);
                setPage(0);
              }}
            />
          ))}
        </Stack>
        <Box sx={{ flexGrow: 1 }} />
        <TextField
          select
          size="small"
          label="Reason"
          value={reason ?? ''}
          onChange={(e) => {
            setReason(e.target.value || undefined);
            setPage(0);
          }}
          sx={{ width: 220 }}
        >
          {REASONS.map((r) => (
            <MenuItem key={r.label} value={r.value ?? ''}>
              {r.label}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      <DataTable<ReportRow>
        columns={columns}
        rows={data?.reports ?? []}
        rowKey={(r) => r.id}
        loading={isLoading}
        error={error ? (error as ApiError).message : null}
        onRowClick={(r) => setDetailId(r.id)}
        emptyTitle="No reports here"
        emptySubtitle={
          status === 'pending' ? 'Queue is clear — nothing waiting for review' : 'Try a different filter'
        }
        total={data?.total}
        page={page}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={(l) => {
          setLimit(l);
          setPage(0);
        }}
      />

      <ReportDetailDrawer
        open={!!detailId}
        reportId={detailId}
        onClose={() => setDetailId(null)}
        onChanged={(msg) => {
          mutate();
          if (msg) setToast(msg);
        }}
      />

      <SuccessSnackbar message={toast} onClose={() => setToast(null)} />
    </Box>
  );
};
