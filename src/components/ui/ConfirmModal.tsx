/**
 * ConfirmModal — reusable confirmation dialog.
 *
 * Variants:
 *   'danger'  → red confirm button (ban / delete)
 *   'primary' → magenta confirm button (verify / close report)
 * Optional `reason` field when the API requires one (ban, soft delete).
 * The harassment-ban notice is baked in via `harassmentNotice`.
 */
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Alert,
  Box,
  CircularProgress,
} from '@mui/material';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  /** When set, the confirm button stays disabled until the reason is valid */
  requireReason?: boolean;
  reasonLabel?: string;
  harassmentNotice?: boolean;
  loading?: boolean;
  error?: string | null;
  onConfirm: (reason?: string) => void;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  requireReason,
  reasonLabel = 'Reason (required, shown in the audit log)',
  harassmentNotice,
  loading,
  error,
  onConfirm,
  onClose,
}) => {
  const [reason, setReason] = useState('');

  const reasonInvalid = requireReason && reason.trim().length < 3;

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontFamily: '"Fredoka", sans-serif' }}>{title}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {message}
        </Typography>

        {requireReason && (
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={2}
            label={reasonLabel}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            error={reason.length > 0 && reason.trim().length < 3}
            helperText={reason.length > 0 && reason.trim().length < 3 ? 'At least 3 characters' : ' '}
          />
        )}

        {harassmentNotice && (
          <Alert severity="info" variant="outlined" sx={{ mt: 1 }}>
            The banned user is <strong>never notified</strong> — the ban is silent from their side
            (harassment-ban policy). Their sessions are revoked immediately.
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading} color="inherit">
          {cancelLabel}
        </Button>
        <Button
          onClick={() => onConfirm(reason.trim() || undefined)}
          disabled={loading || reasonInvalid}
          variant="contained"
          color={variant === 'danger' ? 'error' : 'primary'}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/** Small toast-style snackbar used after successful mutations. */
export const SuccessSnackbar: React.FC<{
  message: string | null;
  onClose: () => void;
}> = ({ message, onClose }) => (
  <Box
    sx={{
      position: 'fixed',
      bottom: 24,
      left: '50%',
      transform: 'translateX(-50%)',
      bgcolor: 'success.main',
      color: 'white',
      px: 3,
      py: 1.5,
      borderRadius: 999,
      boxShadow: 6,
      zIndex: (t) => t.zIndex.snackbar,
      display: message ? 'block' : 'none',
    }}
    onClick={onClose}
  >
    <Typography variant="body2">{message}</Typography>
  </Box>
);
