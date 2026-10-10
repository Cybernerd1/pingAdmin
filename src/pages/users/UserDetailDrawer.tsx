/**
 * UserDetailDrawer — full admin view of one user:
 * profile fields, photos, report counts, ban history (from the audit log).
 * Action buttons bubble up to UsersPage (modals live there).
 */
import React, { useState } from 'react';
import useSWR from 'swr';
import {
  Avatar,
  Box,
  Button,
  Divider,
  Drawer,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import { usersApi, ApiError } from '../../services/api';
import { KeyValue } from '../../components/ui/DataTable';
import { LoadingState, ErrorState } from '../../components/ui/StateViews';
import { StatusChip } from '../../components/ui/StatusChip';
import { UserDetail } from '../../types/admin';
import { formatDateTime, formatRelative, humanizeAction, truncate } from '../../utils/format';

interface Props {
  open: boolean;
  userId: string | null;
  onClose: () => void;
  onChanged?: () => void;
  onAction: (kind: 'ban' | 'unban' | 'delete', user: UserDetail) => void;
}

export const UserDetailDrawer: React.FC<Props> = ({ open, userId, onClose, onChanged, onAction }) => {
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, error, isLoading, mutate } = useSWR(
    userId ? ['user', userId] : null,
    () => usersApi.detail(userId!),
    { revalidateOnFocus: false }
  );

  const user = data?.user as UserDetail | undefined;

  const refresh = () => {
    mutate();
    onChanged?.();
  };

  const quickVerify = async () => {
    if (!user) return;
    try {
      await usersApi.verify(user.id, !user.isVerified);
      refresh();
    } catch (err) {
      setActionError((err as ApiError).message);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{ paper: { sx: { width: { xs: '100%', sm: 440 } } } }}
    >
      <Box sx={{ p: 3 }}>
        {isLoading && <LoadingState label="Loading user…" />}
        {error && <ErrorState message={(error as ApiError).message} onRetry={() => mutate()} />}

        {user && (
          <>
            {/* Header */}
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
              <Avatar
                src={user.photos?.find((p) => p.order === 0)?.url}
                sx={{ width: 56, height: 56, bgcolor: 'primary.main', fontWeight: 700 }}
              >
                {(user.fullName ?? user.email).slice(0, 2).toUpperCase()}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h6" noWrap>
                  {user.fullName ?? 'Unnamed'}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {user.email}
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1} sx={{ mb: 2.5, flexWrap: 'wrap' }}>
              <StatusChip status={user.role} />
              {user.isDemo && <StatusChip status="demo" />}
              {user.isAccountDeleted ? (
                <StatusChip status="deleted" />
              ) : (
                <StatusChip status={user.isBanned ? 'banned' : 'active'} />
              )}
              <StatusChip status={user.isVerified ? 'verified' : 'unverified'} />
            </Stack>

            {actionError && (
              <Typography variant="body2" color="error" sx={{ mb: 2 }}>
                {actionError}
              </Typography>
            )}

            {/* Profile facts */}
            <Grid container spacing={2} sx={{ mb: 1 }}>
              <Grid size={6}>
                <KeyValue label="Username" value={user.username ?? '—'} />
              </Grid>
              <Grid size={6}>
                <KeyValue label="Gender" value={user.gender ?? '—'} />
              </Grid>
              <Grid size={6}>
                <KeyValue label="Joined" value={formatDateTime(user.createdAt)} />
              </Grid>
              <Grid size={6}>
                <KeyValue label="Last active" value={user.lastActiveAt ? formatRelative(user.lastActiveAt) : 'Never'} />
              </Grid>
              <Grid size={6}>
                <KeyValue label="Onboarding" value={`${user.onboardingStep}${user.onboardingCompleted ? ' ✓' : ''}`} />
              </Grid>
              <Grid size={6}>
                <KeyValue label="User ID" value={user.id} />
              </Grid>
              {user.isBanned && (
                <>
                  <Grid size={12}>
                    <KeyValue label="Banned at" value={formatDateTime(user.bannedAt)} />
                  </Grid>
                  <Grid size={12}>
                    <KeyValue label="Ban reason" value={user.bannedReason ?? '—'} />
                  </Grid>
                </>
              )}
            </Grid>

            {/* Photos */}
            {user.photos?.length > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Photos ({user.photos.length})
                </Typography>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', mb: 1 }}>
                  {user.photos.map((p) => (
                    <Box
                      key={p.id}
                      component="img"
                      src={p.url}
                      alt={`photo ${p.order + 1}`}
                      loading="lazy"
                      sx={{
                        width: 84,
                        height: 112,
                        objectFit: 'cover',
                        borderRadius: '12px',
                        border: p.order === 0 ? '2px solid' : '1px solid',
                        borderColor: p.order === 0 ? 'primary.main' : 'divider',
                      }}
                    />
                  ))}
                </Stack>
              </>
            )}

            {/* Report counts */}
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2}>
              <Grid size={6}>
                <KeyValue label="Reports filed" value={user.reports_filed} />
              </Grid>
              <Grid size={6}>
                <KeyValue label="Times reported" value={user.times_reported} />
              </Grid>
            </Grid>

            {/* Ban history */}
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Ban history
            </Typography>
            {user.ban_history?.length ? (
              <Stack spacing={1} sx={{ mb: 2 }}>
                {user.ban_history.map((h, i) => (
                  <Box
                    key={i}
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: '12px',
                      px: 1.5,
                      py: 1,
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {humanizeAction(h.action)}{' '}
                      <Typography component="span" variant="caption" color="text.secondary">
                        · {formatDateTime(h.createdAt)}
                      </Typography>
                    </Typography>
                    {h.metadata && Object.keys(h.metadata).length > 0 && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {truncate(JSON.stringify(h.metadata), 120)}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                No ban history — account has never been moderated.
              </Typography>
            )}

            {/* Actions */}
            {user.role !== 'admin' && !user.isDemo && (
              <Stack direction="row" spacing={1}>
                {user.isBanned ? (
                  <Button
                    fullWidth
                    variant="outlined"
                    color="success"
                    startIcon={<LockOpenIcon />}
                    onClick={() => onAction('unban', user)}
                  >
                    Unban
                  </Button>
                ) : (
                  <Button
                    fullWidth
                    variant="outlined"
                    color="error"
                    startIcon={<BlockIcon />}
                    onClick={() => onAction('ban', user)}
                  >
                    Ban
                  </Button>
                )}
                <Button variant="outlined" onClick={quickVerify}>
                  {user.isVerified ? 'Unverify' : 'Verify'}
                </Button>
                {!user.isAccountDeleted && (
                  <Button
                    color="error"
                    startIcon={<PersonRemoveIcon />}
                    onClick={() => onAction('delete', user)}
                  >
                    Delete
                  </Button>
                )}
              </Stack>
            )}
          </>
        )}
      </Box>
    </Drawer>
  );
};
