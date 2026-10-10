/**
 * UsersPage — searchable/filterable user directory.
 *
 * Row actions: Ban (reason + harassment notice), Unban, Verify toggle,
 * Soft delete. Every action re-fetches the list; the audit trail lives
 * server-side. Row click opens the detail drawer.
 */
import React, { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import {
  Box,
  Button,
  Chip,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import BlockIcon from '@mui/icons-material/Block';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import VerifiedIcon from '@mui/icons-material/Verified';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import { usersApi, ApiError } from '../../services/api';
import { DataTable, Column } from '../../components/ui/DataTable';
import { StatusChip } from '../../components/ui/StatusChip';
import { ConfirmModal, SuccessSnackbar } from '../../components/ui/ConfirmModal';
import { UserDetailDrawer } from './UserDetailDrawer';
import { UserRow } from '../../types/admin';
import { formatRelative } from '../../utils/format';

const FILTERS = [
  { value: undefined, label: 'All' },
  { value: 'banned', label: 'Banned' },
  { value: 'verified', label: 'Verified' },
  { value: 'deleted', label: 'Deleted' },
  { value: 'demo', label: 'Demo' },
  { value: 'admin', label: 'Admins' },
  { value: 'incomplete', label: 'Incomplete' },
] as const;

type ActionState =
  | { kind: 'ban'; user: UserRow }
  | { kind: 'unban'; user: UserRow }
  | { kind: 'delete'; user: UserRow }
  | null;

export const UsersPage: React.FC = () => {
  // ── list state ────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['value']>(undefined);
  const [sort, setSort] = useState<'created_at' | 'last_active'>('created_at');
  const [page, setPage] = useState(0); // 0-based for MUI
  const [limit, setLimit] = useState(20);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const query = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      filter,
      sort,
      page: page + 1, // API is 1-based
      limit,
    }),
    [debouncedSearch, filter, sort, page, limit]
  );

  const { data, error, isLoading, mutate } = useSWR(
    ['users', query],
    () => usersApi.list(query),
    { keepPreviousData: true }
  );

  // ── action state ──────────────────────────────────────────────────────
  const [action, setAction] = useState<ActionState>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [detailId, setDetailId] = useState<string | null>(null);

  const closeAction = () => {
    setAction(null);
    setActionError(null);
  };

  const runAction = async (fn: () => Promise<string>) => {
    setBusy(true);
    setActionError(null);
    try {
      const msg = await fn();
      setToast(msg);
      closeAction();
      mutate();
    } catch (err) {
      setActionError((err as ApiError).message);
    } finally {
      setBusy(false);
    }
  };

  const onBan = (reason: string | undefined) =>
    action?.kind === 'ban' &&
    runAction(async () => {
      const res = await usersApi.ban(action.user.id, reason!);
      return res.already_banned ? 'User was already banned' : 'User banned — sessions revoked';
    });

  const onUnban = () =>
    action?.kind === 'unban' &&
    runAction(async () => {
      const res = await usersApi.unban(action.user.id);
      return res.was_banned ? 'User unbanned' : 'User was not banned';
    });

  const onDelete = (reason: string | undefined) =>
    action?.kind === 'delete' &&
    runAction(async () => {
      await usersApi.softDelete(action.user.id, reason);
      return 'User soft-deleted — hard purge follows the retention window';
    });

  const onVerifyToggle = async (user: UserRow) => {
    try {
      await usersApi.verify(user.id, !user.isVerified);
      setToast(user.isVerified ? 'Verification removed' : 'User verified');
      mutate();
    } catch (err) {
      setActionError((err as ApiError).message);
    }
  };

  // ── columns ───────────────────────────────────────────────────────────
  const columns: Column<UserRow>[] = [
    {
      key: 'fullName',
      label: 'User',
      sortable: true,
      render: (u) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {u.fullName ?? 'Unnamed'}
            {u.isDemo && (
              <Tooltip title="Shared demo account">
                <Chip size="small" label="demo" sx={{ ml: 1, height: 20, fontSize: 11 }} />
              </Tooltip>
            )}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {u.email}
          </Typography>
        </Box>
      ),
    },
    { key: 'role', label: 'Role', width: 90, render: (u) => <StatusChip status={u.role} /> },
    {
      key: 'isBanned',
      label: 'Status',
      width: 110,
      sortable: true,
      render: (u) =>
        u.isAccountDeleted ? <StatusChip status="deleted" /> : <StatusChip status={u.isBanned ? 'banned' : 'active'} />,
    },
    {
      key: 'isVerified',
      label: 'Verified',
      width: 100,
      sortable: true,
      render: (u) => <StatusChip status={u.isVerified ? 'verified' : 'unverified'} />,
    },
    {
      key: 'lastActiveAt',
      label: 'Last active',
      width: 130,
      sortable: true,
      render: (u) => (
        <Tooltip title={u.lastActiveAt ?? 'never'}>
          <Typography variant="body2">{u.lastActiveAt ? formatRelative(u.lastActiveAt) : 'Never'}</Typography>
        </Tooltip>
      ),
    },
    {
      key: 'createdAt',
      label: 'Joined',
      width: 110,
      sortable: true,
      render: (u) => formatRelative(u.createdAt),
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      width: 220,
      render: (u) => {
        if (u.isDemo || u.role === 'admin') {
          return (
            <Typography variant="caption" color="text.disabled">
              protected
            </Typography>
          );
        }
        return (
          <Stack
            direction="row"
            spacing={0.5}
            sx={{ justifyContent: 'flex-end' }}
            onClick={(e) => e.stopPropagation()}
          >
            {u.isBanned ? (
              <Tooltip title="Unban">
                <Button
                  size="small"
                  variant="outlined"
                  color="success"
                  startIcon={<LockOpenIcon />}
                  onClick={() => setAction({ kind: 'unban', user: u })}
                >
                  Unban
                </Button>
              </Tooltip>
            ) : (
              <Tooltip title="Ban (requires reason)">
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<BlockIcon />}
                  onClick={() => setAction({ kind: 'ban', user: u })}
                >
                  Ban
                </Button>
              </Tooltip>
            )}
            <Tooltip title={u.isVerified ? 'Remove verification' : 'Verify user'}>
              <Button
                size="small"
                variant={u.isVerified ? 'outlined' : 'contained'}
                color={u.isVerified ? 'inherit' : 'primary'}
                startIcon={<VerifiedIcon />}
                onClick={() => onVerifyToggle(u)}
              >
                {u.isVerified ? 'Unverify' : 'Verify'}
              </Button>
            </Tooltip>
            <Tooltip title="Soft delete (purge job hard-deletes later)">
              <Button
                size="small"
                variant="text"
                color="error"
                onClick={() => setAction({ kind: 'delete', user: u })}
              >
                <PersonRemoveIcon fontSize="small" />
              </Button>
            </Tooltip>
          </Stack>
        );
      },
    },
  ];

  return (
    <Box>
      {/* Toolbar */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2.5 }}>
        <TextField
          placeholder="Search name, email or username…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{ input: { startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.disabled' }} /> } }}
          sx={{ minWidth: 280 }}
        />
        <Stack direction="row" spacing={1}>
          {FILTERS.map((f) => (
            <Chip
              key={f.label}
              label={f.label}
              clickable
              color={filter === f.value ? 'primary' : 'default'}
              variant={filter === f.value ? 'filled' : 'outlined'}
              onClick={() => {
                setFilter(f.value);
                setPage(0);
              }}
            />
          ))}
        </Stack>
        <Box sx={{ flexGrow: 1 }} />
        <TextField
          select
          size="small"
          label="Sort"
          value={sort}
          onChange={(e) => setSort(e.target.value as 'created_at' | 'last_active')}
          sx={{ width: 180 }}
        >
          <MenuItem value="created_at">Newest first</MenuItem>
          <MenuItem value="last_active">Last active</MenuItem>
        </TextField>
      </Stack>

      <DataTable<UserRow>
        columns={columns}
        rows={data?.users ?? []}
        rowKey={(u) => u.id}
        loading={isLoading}
        error={error ? (error as ApiError).message : null}
        onRowClick={(u) => setDetailId(u.id)}
        emptyTitle="No users found"
        emptySubtitle={
          debouncedSearch || filter ? 'Try a different search or filter' : 'No users have signed up yet'
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

      {/* Detail drawer */}
      <UserDetailDrawer
        open={!!detailId}
        userId={detailId}
        onClose={() => setDetailId(null)}
        onChanged={() => mutate()}
        onAction={(kind, user) => {
          setDetailId(null);
          setAction({ kind, user });
        }}
      />

      {/* Action modals */}
      {action?.kind === 'ban' && (
        <ConfirmModal
          open
          variant="danger"
          title={`Ban ${action.user.fullName ?? action.user.email}?`}
          message="All sessions are revoked, FCM tokens wiped, live sockets disconnected. This is recorded in the audit log."
          confirmLabel="Ban user"
          requireReason
          harassmentNotice
          loading={busy}
          error={actionError}
          onConfirm={onBan}
          onClose={closeAction}
        />
      )}

      {action?.kind === 'unban' && (
        <ConfirmModal
          open
          title={`Unban ${action.user.fullName ?? action.user.email}?`}
          message="The user regains full access immediately. Ban history stays in the audit log."
          confirmLabel="Unban user"
          loading={busy}
          error={actionError}
          onConfirm={onUnban}
          onClose={closeAction}
        />
      )}

      {action?.kind === 'delete' && (
        <ConfirmModal
          open
          variant="danger"
          title={`Soft-delete ${action.user.fullName ?? action.user.email}?`}
          message="The account is hidden and signed out everywhere. The purge job hard-deletes it after the retention window (default 30 days)."
          confirmLabel="Soft-delete"
          requireReason
          reasonLabel="Reason (optional, recorded in the audit log)"
          loading={busy}
          error={actionError}
          onConfirm={onDelete}
          onClose={closeAction}
        />
      )}

      <SuccessSnackbar message={toast} onClose={() => setToast(null)} />
    </Box>
  );
};
