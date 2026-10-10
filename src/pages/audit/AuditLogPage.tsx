/**
 * AuditLogPage — append-only trail of every admin action.
 * Filters: action name, target type, admin/target UUID, date range.
 * The log itself can never be edited from here (by design).
 */
import React, { useMemo, useState } from 'react';
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
import SearchIcon from '@mui/icons-material/Search';
import { auditApi, ApiError } from '../../services/api';
import { DataTable, Column } from '../../components/ui/DataTable';
import { AuditRow } from '../../types/admin';
import { formatDateTime, humanizeAction, truncate } from '../../utils/format';

const ACTIONS = [
  '', 'ban_user', 'unban_user', 'verify_user', 'unverify_user', 'soft_delete_user',
  'update_report_status', 'action_report', 'view_conversation', 'admin_login',
];

const TARGET_TYPES = [
  { value: '', label: 'All targets' },
  { value: 'user', label: 'User' },
  { value: 'report', label: 'Report' },
  { value: 'conversation', label: 'Conversation' },
];

/** Compact, safe one-line render of the metadata JSONB. */
const MetaCell: React.FC<{ meta: Record<string, unknown> | null | undefined }> = ({ meta }) => {
  if (!meta || Object.keys(meta).length === 0) return <Typography variant="body2">—</Typography>;
  return (
    <Tooltip title={<pre style={{ margin: 0, maxWidth: 420, whiteSpace: 'pre-wrap' }}>{JSON.stringify(meta, null, 2)}</pre>}>
      <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
        {truncate(JSON.stringify(meta), 60)}
      </Typography>
    </Tooltip>
  );
};

export const AuditLogPage: React.FC = () => {
  const [action, setAction] = useState('');
  const [targetType, setTargetType] = useState('');
  const [targetId, setTargetId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(25);

  // Date inputs are yyyy-MM-dd; the API expects full ISO timestamps
  const query = useMemo(
    () => ({
      action: action || undefined,
      target_type: (targetType || undefined) as 'user' | 'report' | 'conversation' | undefined,
      target_id: targetId.trim() || undefined,
      from: from ? new Date(`${from}T00:00:00`).toISOString() : undefined,
      to: to ? new Date(`${to}T23:59:59`).toISOString() : undefined,
      page: page + 1,
      limit,
    }),
    [action, targetType, targetId, from, to, page, limit]
  );

  const { data, error, isLoading } = useSWR(['audit', query], () => auditApi.list(query), {
    keepPreviousData: true,
  });

  const columns: Column<AuditRow>[] = [
    {
      key: 'createdAt',
      label: 'When (IST)',
      width: 170,
      sortable: true,
      render: (r) => <Typography variant="body2">{formatDateTime(r.createdAt)}</Typography>,
    },
    {
      key: 'action',
      label: 'Action',
      width: 180,
      render: (r) => (
        <Chip
          size="small"
          label={humanizeAction(r.action)}
          sx={{
            bgcolor: r.action.includes('ban') ? '#FEE2E2' : r.action === 'admin_login' ? '#EDE9FE' : '#FCE7F3',
            color: r.action.includes('ban') ? '#991B1B' : r.action === 'admin_login' ? '#5B21B6' : '#9D174D',
            fontWeight: 600,
          }}
        />
      ),
    },
    {
      key: 'targetType',
      label: 'Target',
      width: 150,
      render: (r) => (
        <Typography variant="body2">
          <strong style={{ textTransform: 'capitalize' }}>{r.targetType}</strong>{' '}
          <Typography component="span" variant="caption" sx={{ fontFamily: 'monospace' }}>
            {r.targetId.slice(0, 8)}…
          </Typography>
        </Typography>
      ),
    },
    {
      key: 'adminId',
      label: 'Admin',
      width: 130,
      render: (r) => (
        <Tooltip title={r.adminId}>
          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
            {r.adminId.slice(0, 8)}…
          </Typography>
        </Tooltip>
      ),
    },
    { key: 'metadata', label: 'Metadata', render: (r) => <MetaCell meta={r.metadata} /> },
    {
      key: 'ip',
      label: 'IP',
      width: 130,
      render: (r) => (
        <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
          {r.ip ?? '—'}
        </Typography>
      ),
    },
  ];

  return (
    <Box>
      {/* Filter toolbar */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2.5 }}>
        <TextField
          select
          size="small"
          label="Action"
          value={action}
          onChange={(e) => { setAction(e.target.value); setPage(0); }}
          sx={{ minWidth: 200 }}
        >
          {ACTIONS.map((a) => (
            <MenuItem key={a || 'any'} value={a}>
              {a ? humanizeAction(a) : 'Any action'}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          size="small"
          label="Target type"
          value={targetType}
          onChange={(e) => { setTargetType(e.target.value); setPage(0); }}
          sx={{ minWidth: 160 }}
        >
          {TARGET_TYPES.map((t) => (
            <MenuItem key={t.value || 'all'} value={t.value}>
              {t.label}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          size="small"
          label="Target / admin UUID"
          placeholder="Paste a UUID…"
          value={targetId}
          onChange={(e) => { setTargetId(e.target.value); setPage(0); }}
          slotProps={{ input: { startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.disabled' }} /> } }}
          sx={{ minWidth: 240 }}
        />

        <TextField
          size="small"
          type="date"
          label="From"
          value={from}
          onChange={(e) => { setFrom(e.target.value); setPage(0); }}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          size="small"
          type="date"
          label="To"
          value={to}
          onChange={(e) => { setTo(e.target.value); setPage(0); }}
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </Stack>

      <DataTable<AuditRow>
        columns={columns}
        rows={data?.entries ?? []}
        rowKey={(r) => r.id}
        loading={isLoading}
        error={error ? (error as ApiError).message : null}
        emptyTitle="No audit entries"
        emptySubtitle="No admin actions match these filters"
        total={data?.total}
        page={page}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={(l) => { setLimit(l); setPage(0); }}
        dense
      />

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
        The audit log is append-only — there is no edit or delete anywhere in the API.
      </Typography>
    </Box>
  );
};
