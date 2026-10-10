/**
 * SupportPage — complaints & feedback inbox (ADMIN_PRD §6).
 *
 * ⚠️ Backend status: the /admin/support endpoints are specced in the PRD
 * but NOT yet implemented in pingbckd. This page is built against the
 * agreed contract and shows a clear "backend pending" notice on 404 so it
 * lights up the moment the endpoints ship. No code change will be needed.
 */
import React, { useState } from 'react';
import useSWR from 'swr';
import {
  Alert,
  Box,
  Button,
  Chip,
  Drawer,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { supportApi, ApiError } from '../../services/api';
import { DataTable, Column, KeyValue } from '../../components/ui/DataTable';
import { StatusChip } from '../../components/ui/StatusChip';
import { SuccessSnackbar } from '../../components/ui/ConfirmModal';
import { SupportRow } from '../../types/admin';
import { formatDateTime, formatRelative, truncate } from '../../utils/format';

const STATUSES = [undefined, 'open', 'acknowledged', 'resolved'] as const;
const TYPES = [
  { value: undefined, label: 'All types' },
  { value: 'report', label: 'Report' },
  { value: 'bug', label: 'Bug' },
  { value: 'complaint', label: 'Complaint' },
  { value: 'feature_request', label: 'Feature request' },
];

export const SupportPage: React.FC = () => {
  const [status, setStatus] = useState<(typeof STATUSES)[number]>(undefined);
  const [type, setType] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);

  const { data, error, isLoading, mutate } = useSWR(
    ['support', status, type, page, limit],
    () => supportApi.list({ status, type: type as SupportRow['type'], page: page + 1, limit }),
    { keepPreviousData: true }
  );

  // 404 → endpoints not implemented yet in pingbckd
  const backendPending = (error as ApiError | undefined)?.status === 404;

  // drawer + resolve form
  const [detailId, setDetailId] = useState<string | null>(null);
  const [response, setResponse] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const selected = data?.entries.find((e: SupportRow) => e.id === detailId) ?? null;

  const acknowledge = async () => {
    if (!selected) return;
    setBusy(true);
    setFormError(null);
    try {
      await supportApi.patch(selected.id, { status: 'acknowledged' });
      mutate();
      setToast('Marked as acknowledged');
    } catch (err) {
      setFormError((err as ApiError).message);
    } finally {
      setBusy(false);
    }
  };

  const resolve = async () => {
    if (!selected) return;
    setBusy(true);
    setFormError(null);
    try {
      await supportApi.resolve(selected.id, response.trim());
      setDetailId(null);
      setResponse('');
      mutate();
      setToast('Ticket resolved');
    } catch (err) {
      setFormError((err as ApiError).message);
    } finally {
      setBusy(false);
    }
  };

  const columns: Column<SupportRow>[] = [
    {
      key: 'type',
      label: 'Type',
      width: 150,
      render: (s) => <StatusChip status={s.type} />,
    },
    {
      key: 'message',
      label: 'Message',
      render: (s) => (
        <Box>
          <Typography variant="body2">{truncate(s.message, 90)}</Typography>
          <Typography variant="caption" color="text.secondary">
            {s.reporter ? `${s.reporter.fullName ?? s.reporter.email}` : 'Anonymous'}
          </Typography>
        </Box>
      ),
    },
    { key: 'status', label: 'Status', width: 140, render: (s) => <StatusChip status={s.status} /> },
    {
      key: 'adminResponse',
      label: 'Response',
      width: 200,
      render: (s) => (s.adminResponse ? truncate(s.adminResponse, 50) : <Typography variant="body2">—</Typography>),
    },
    { key: 'createdAt', label: 'Filed', width: 110, render: (s) => formatRelative(s.createdAt) },
    {
      key: 'resolvedAt',
      label: 'Resolved',
      width: 110,
      render: (s) => (s.resolvedAt ? formatRelative(s.resolvedAt) : '—'),
    },
  ];

  return (
    <Box>
      {backendPending && (
        <Alert severity="info" sx={{ mb: 2.5 }}>
          The support endpoints (<code>/api/v1/admin/support</code>) aren't implemented in the backend yet —
          see ADMIN_PRD §6. This page will work as soon as they ship.
        </Alert>
      )}

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
              onClick={() => { setStatus(s); setPage(0); }}
            />
          ))}
        </Stack>
        <Box sx={{ flexGrow: 1 }} />
        <TextField
          select
          size="small"
          label="Type"
          value={type ?? ''}
          onChange={(e) => { setType(e.target.value || undefined); setPage(0); }}
          sx={{ width: 180 }}
        >
          {TYPES.map((t) => (
            <MenuItem key={t.label} value={t.value ?? ''}>
              {t.label}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      {!backendPending && (
        <DataTable<SupportRow>
          columns={columns}
          rows={data?.entries ?? []}
          rowKey={(s) => s.id}
          loading={isLoading}
          error={error ? (error as ApiError).message : null}
          onRowClick={(s) => { setDetailId(s.id); setResponse(s.adminResponse ?? ''); setFormError(null); }}
          emptyTitle="No tickets"
          emptySubtitle={status === 'open' ? 'Inbox zero — nothing waiting' : 'Try a different filter'}
          total={data?.total}
          page={page}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={(l) => { setLimit(l); setPage(0); }}
        />
      )}

      {/* Detail drawer */}
      <Drawer
        anchor="right"
        open={!!detailId}
        onClose={() => setDetailId(null)}
        slotProps={{ paper: { sx: { width: { xs: '100%', sm: 440 } } } }}
      >
        {selected && (
          <Box sx={{ p: 3 }}>
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              <StatusChip status={selected.type} />
              <StatusChip status={selected.status} />
            </Stack>

            <Typography variant="h6" sx={{ mb: 2 }}>
              {selected.reporter ? selected.reporter.fullName ?? selected.reporter.email : 'Anonymous submission'}
            </Typography>

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid size={6}>
                <KeyValue label="Filed" value={formatDateTime(selected.createdAt)} />
              </Grid>
              <Grid size={6}>
                <KeyValue label="Resolved" value={selected.resolvedAt ? formatDateTime(selected.resolvedAt) : '—'} />
              </Grid>
            </Grid>

            <Box
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '12px',
                p: 2,
                mb: 2,
                bgcolor: '#FDF9F5',
              }}
            >
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {selected.message}
              </Typography>
            </Box>

            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Admin response (sent to the user)"
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              sx={{ mb: 2 }}
            />

            {formError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {formError}
              </Alert>
            )}

            <Stack direction="row" spacing={1}>
              {selected.status === 'open' && (
                <Button variant="outlined" onClick={acknowledge} disabled={busy}>
                  Acknowledge
                </Button>
              )}
              <Box sx={{ flexGrow: 1 }} />
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircleIcon />}
                onClick={resolve}
                disabled={busy || response.trim().length < 3 || selected.status === 'resolved'}
              >
                {selected.status === 'resolved' ? 'Resolved' : 'Resolve ticket'}
              </Button>
            </Stack>

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
              Status changes and responses are written to the audit log.
            </Typography>
          </Box>
        )}
      </Drawer>

      <SuccessSnackbar message={toast} onClose={() => setToast(null)} />
    </Box>
  );
};
