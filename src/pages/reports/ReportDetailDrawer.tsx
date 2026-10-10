/**
 * ReportDetailDrawer — the full report record (raw-SQL endpoint, snake_case).
 * Actions:
 *   - Patch status / admin note (review or dismiss without banning)
 *   - "Action report": bans the reported user + closes the report in one
 *     server-side transaction (idempotent on already-actioned reports)
 *   - View conversation: opens the audit-logged read modal
 */
import React, { useState } from 'react';
import useSWR from 'swr';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import GavelIcon from '@mui/icons-material/Gavel';
import ForumIcon from '@mui/icons-material/Forum';
import SaveIcon from '@mui/icons-material/Save';
import { reportsApi, ApiError } from '../../services/api';
import { KeyValue } from '../../components/ui/DataTable';
import { LoadingState, ErrorState } from '../../components/ui/StateViews';
import { StatusChip } from '../../components/ui/StatusChip';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { ConversationModal } from './ConversationModal';
import { ReportDetail, ReportStatus } from '../../types/admin';
import { formatDateTime } from '../../utils/format';

interface Props {
  open: boolean;
  reportId: string | null;
  onClose: () => void;
  onChanged: (toastMessage?: string) => void;
}

export const ReportDetailDrawer: React.FC<Props> = ({ open, reportId, onClose, onChanged }) => {
  const { data, error, isLoading, mutate } = useSWR(
    reportId ? ['report', reportId] : null,
    () => reportsApi.detail(reportId!),
    { revalidateOnFocus: false }
  );

  const report = data?.report as ReportDetail | undefined;

  // patch form
  const [status, setStatus] = useState<ReportStatus | ''>('');
  const [adminNote, setAdminNote] = useState('');
  const [noteLoaded, setNoteLoaded] = useState(false);

  // action state
  const [actionOpen, setActionOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [conversationOpen, setConversationOpen] = useState(false);

  // hydrate the form once the detail arrives
  if (report && !noteLoaded) {
    setStatus(report.status);
    setAdminNote(report.admin_note ?? '');
    setNoteLoaded(true);
  }
  if (!open && noteLoaded) setNoteLoaded(false);

  const patch = async () => {
    if (!report) return;
    setBusy(true);
    setActionError(null);
    try {
      await reportsApi.patch(report.id, {
        status: (status || undefined) as ReportStatus | undefined,
        admin_note: adminNote,
      });
      mutate();
      onChanged('Report updated');
    } catch (err) {
      setActionError((err as ApiError).message);
    } finally {
      setBusy(false);
    }
  };

  const actionReport = async (note?: string) => {
    if (!report) return;
    setBusy(true);
    setActionError(null);
    try {
      const res = await reportsApi.action(report.id, note);
      setActionOpen(false);
      mutate();
      onChanged(
        res.banned
          ? 'Report actioned — reported user banned and sessions revoked'
          : 'Report actioned — target is protected and was not banned'
      );
    } catch (err) {
      setActionError((err as ApiError).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        slotProps={{ paper: { sx: { width: { xs: '100%', sm: 460 } } } }}
      >
        <Box sx={{ p: 3 }}>
          {isLoading && <LoadingState label="Loading report…" />}
          {error && <ErrorState message={(error as ApiError).message} onRetry={() => mutate()} />}

          {report && (
            <>
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                  {report.reason.replaceAll('_', ' ')}
                </Typography>
                <StatusChip status={report.status} />
              </Stack>

              {report.details && (
                <Alert severity="info" variant="outlined" sx={{ mb: 2 }}>
                  {report.details}
                </Alert>
              )}

              {/* Parties */}
              <Grid container spacing={2} sx={{ mb: 1 }}>
                <Grid size={6}>
                  <KeyValue label="Reporter" value={report.reporter_name ?? '—'} />
                </Grid>
                <Grid size={6}>
                  <KeyValue label="Reporter email" value={report.reporter_email} />
                </Grid>
                <Grid size={6}>
                  <KeyValue label="Reported user" value={report.reported_name ?? '—'} />
                </Grid>
                <Grid size={6}>
                  <KeyValue label="Reported email" value={report.reported_email} />
                </Grid>
                <Grid size={6}>
                  <KeyValue label="Filed at" value={formatDateTime(report.created_at)} />
                </Grid>
                <Grid size={6}>
                  <KeyValue label="Prior reports on user" value={report.prior_reports} />
                </Grid>
              </Grid>

              <Box sx={{ mt: 1, mb: 2 }}>
                <Chip
                  size="small"
                  color={report.reported_is_banned ? 'success' : 'warning'}
                  variant="outlined"
                  label={report.reported_is_banned ? 'Reported user already banned' : 'Reported user not banned'}
                />
              </Box>

              {/* Review form */}
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                Review
              </Typography>
              <Grid container spacing={2}>
                <Grid size={6}>
                  <TextField
                    select
                    fullWidth
                    label="Status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ReportStatus)}
                  >
                    {(['pending', 'reviewed', 'actioned', 'dismissed'] as ReportStatus[]).map((s) => (
                      <MenuItem key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    label="Admin note"
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Internal note…"
                  />
                </Grid>
              </Grid>

              {actionError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {actionError}
                </Alert>
              )}

              {/* Action buttons */}
              <Stack direction="row" spacing={1} sx={{ mt: 2.5 }}>
                <Button
                  variant="outlined"
                  startIcon={<SaveIcon />}
                  onClick={patch}
                  disabled={busy || (!status && !adminNote)}
                >
                  Save review
                </Button>
                {report.conversation_id && (
                  <Button
                    variant="outlined"
                    startIcon={<ForumIcon />}
                    onClick={() => setConversationOpen(true)}
                  >
                    View conversation
                  </Button>
                )}
                <Box sx={{ flexGrow: 1 }} />
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<GavelIcon />}
                  onClick={() => setActionOpen(true)}
                  disabled={report.status === 'actioned'}
                >
                  {report.status === 'actioned' ? 'Actioned' : 'Action report'}
                </Button>
              </Stack>
            </>
          )}
        </Box>
      </Drawer>

      {/* Action confirm */}
      {report && actionOpen && (
        <ConfirmModal
          open
          variant="danger"
          title="Action this report?"
          message={
            <>
              Bans <strong>{report.reported_name ?? report.reported_email}</strong> and closes the
              report as <em>actioned</em> in a single transaction. If the target is an admin or demo
              account, the report still closes but the ban is skipped.
            </>
          }
          confirmLabel="Ban & close report"
          requireReason={false}
          loading={busy}
          error={actionError}
          onConfirm={actionReport}
          onClose={() => setActionOpen(false)}
        />
      )}

      {/* Conversation read (audit-logged server-side) */}
      {report && conversationOpen && (
        <ConversationModal
          open
          reportId={report.id}
          reporterId={report.reporter_id}
          reportedId={report.reported_id}
          reporterName={report.reporter_name}
          reportedName={report.reported_name}
          onClose={() => setConversationOpen(false)}
        />
      )}
    </>
  );
};
