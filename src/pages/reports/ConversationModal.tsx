/**
 * ConversationModal — read-only view of the reported conversation.
 * Every open is audit-logged server-side (action 'view_conversation') —
 * the drawer shows a persistent notice so admins know they're on record.
 * Cursor-paginated backwards ("Load older"), newest at the bottom.
 */
import React, { useState } from 'react';
import useSWR from 'swr';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { reportsApi, ApiError } from '../../services/api';
import { ErrorState, LoadingState } from '../../components/ui/StateViews';
import { ConversationPage, MessageRow } from '../../types/admin';
import { formatDateTime } from '../../utils/format';

interface Props {
  open: boolean;
  reportId: string;
  reporterId: string;
  reportedId: string;
  reporterName?: string | null;
  reportedName?: string | null;
  onClose: () => void;
}

export const ConversationModal: React.FC<Props> = ({
  open,
  reportId,
  reporterId,
  reportedId,
  reporterName,
  reportedName,
  onClose,
}) => {
  const [pages, setPages] = useState<ConversationPage[]>([]); // oldest page first

  const first = useSWR(
    open ? ['conversation', reportId, null] : null,
    () => reportsApi.conversation(reportId),
    { revalidateOnFocus: false }
  );

  const all: ConversationPage[] = first.data
    ? [first.data, ...pages.filter((p) => p.report_id === reportId)]
    : pages.filter((p) => p.report_id === reportId);

  const messages: MessageRow[] = all.flatMap((p) => p.messages);
  const oldestCursor = all[0]?.nextCursor ?? null; // nextCursor points backwards in time
  const hasOlder = all[0]?.hasMore ?? false;

  const [loadingOlder, setLoadingOlder] = useState(false);

  const loadOlder = async () => {
    setLoadingOlder(true);
    try {
      const older = await reportsApi.conversation(reportId, oldestCursor ?? undefined);
      setPages((prev) => [older, ...prev.filter((p) => p.report_id === reportId)]);
    } catch {
      // surfaced below via first.error? older-load errors just disable the button
    } finally {
      setLoadingOlder(false);
    }
  };

  const nameOf = (senderId: string) => {
    if (senderId === reportedId) return reportedName ?? 'Reported user';
    if (senderId === reporterId) return reporterName ?? 'Reporter';
    return 'Unknown';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 1 }}>
        <Box sx={{ flexGrow: 1 }}>
          Reported conversation
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            {reporterName ?? 'Reporter'} ↔ {reportedName ?? 'Reported user'} · read is audit-logged
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ bgcolor: '#FDF9F5' }}>
        <Alert severity="warning" variant="outlined" sx={{ mb: 2 }}>
          This read is recorded in the audit log with your admin ID and IP.
        </Alert>

        {first.error && <ErrorState message={(first.error as ApiError).message} onRetry={() => first.mutate()} />}
        {!first.error && !first.data && <LoadingState label="Loading messages…" />}

        {first.data && (
          <>
            {hasOlder && (
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <Button
                  size="small"
                  variant="text"
                  onClick={loadOlder}
                  disabled={loadingOlder || !oldestCursor}
                  startIcon={loadingOlder ? <CircularProgress size={14} /> : undefined}
                >
                  Load older messages
                </Button>
              </Box>
            )}

            <Stack spacing={1.5}>
              {messages.map((m) => {
                const mine = m.senderId === reportedId; // reported user on the right
                return (
                  <Box key={m.id} sx={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                    <Box
                      sx={{
                        maxWidth: '78%',
                        px: 1.75,
                        py: 1,
                        borderRadius: '16px',
                        borderBottomRightRadius: mine ? 4 : 16,
                        borderBottomLeftRadius: mine ? 16 : 4,
                        bgcolor: mine ? 'primary.main' : 'secondary.light',
                        color: mine ? 'primary.contrastText' : 'text.primary',
                      }}
                    >
                      <Typography variant="caption" sx={{ opacity: 0.75, display: 'block' }}>
                        {nameOf(m.senderId)} · {formatDateTime(m.createdAt)}
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {m.content || `[${m.messageType}]`}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Stack>

            {!hasOlder && messages.length > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 2 }}>
                Beginning of conversation
              </Typography>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
