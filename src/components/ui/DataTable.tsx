/**
 * DataTable — generic, reusable table.
 *
 * Columns are declarative: { key, label, render?, sortable?, align?, width? }.
 * Handles loading skeleton, error state, empty state, client-side sort and
 * server-style pagination (total + onPage/onLimit callbacks).
 */
import React, { useMemo, useState } from 'react';
import {
  Box,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Typography,
} from '@mui/material';
import { ErrorState, EmptyState } from './StateViews';

export interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'right' | 'center';
  width?: string | number;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  error?: string | null;
  emptyTitle?: string;
  emptySubtitle?: string;
  onRowClick?: (row: T) => void;
  emptyAction?: React.ReactNode;
  // server-side pagination (omit to disable the footer)
  total?: number;
  page?: number; // 0-based
  limit?: number;
  onPageChange?: (page: number) => void; // 0-based
  onLimitChange?: (limit: number) => void;
  dense?: boolean;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading,
  error,
  emptyTitle = 'Nothing here yet',
  emptySubtitle,
  onRowClick,
  emptyAction,
  total,
  page,
  limit,
  onPageChange,
  onLimitChange,
  dense,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return rows;
    const val = (row: T) => {
      const v = (row as Record<string, unknown>)[sort.key];
      if (v == null) return '';
      if (typeof v === 'boolean') return v ? 1 : 0;
      if (typeof v === 'number') return v;
      return String(v).toLowerCase();
    };
    return [...rows].sort((a, b) => {
      const av = val(a);
      const bv = val(b);
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sort.dir === 'asc' ? cmp : -cmp;
    });
  }, [rows, sort, columns]);

  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '16px', overflow: 'hidden' }}>
      <TableContainer>
        <Table size={dense ? 'small' : 'medium'}>
          <TableHead>
            <TableRow sx={{ bgcolor: '#FDF6F1' }}>
              {columns.map((col) => (
                <TableCell
                  key={col.key}
                  align={col.align ?? 'left'}
                  width={col.width}
                  sortDirection={sort?.key === col.key ? sort.dir : false}
                >
                  {col.sortable ? (
                    <TableSortLabel
                      active={sort?.key === col.key}
                      direction={sort?.key === col.key ? sort.dir : 'asc'}
                      onClick={() =>
                        setSort((s) =>
                          s?.key === col.key
                            ? { key: col.key, dir: s.dir === 'asc' ? 'desc' : 'asc' }
                            : { key: col.key, dir: 'asc' }
                        )
                      }
                    >
                      {col.label}
                    </TableSortLabel>
                  ) : (
                    col.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={`sk-${i}`}>
                    {columns.map((c) => (
                      <TableCell key={c.key}>
                        <Skeleton height={24} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : sorted.map((row) => (
                  <TableRow
                    key={rowKey(row)}
                    hover={!!onRowClick}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    sx={onRowClick ? { cursor: 'pointer' } : undefined}
                  >
                    {columns.map((col) => (
                      <TableCell key={col.key} align={col.align ?? 'left'}>
                        {col.render
                          ? col.render(row)
                          : String((row as Record<string, unknown>)[col.key] ?? '—')}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
            {!loading && sorted.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <EmptyState title={emptyTitle} subtitle={emptySubtitle} action={emptyAction} />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {total !== undefined && page !== undefined && limit !== undefined && onPageChange && (
        <TablePagination
          component="div"
          count={total}
          page={page}
          rowsPerPage={limit}
          onPageChange={(_e, p) => onPageChange(p)}
          onRowsPerPageChange={(e) => onLimitChange?.(parseInt(e.target.value, 10))}
          rowsPerPageOptions={[10, 20, 50, 100]}
          sx={{ borderTop: '1px solid', borderColor: 'divider' }}
        />
      )}
    </Paper>
  );
}

/**
 * Use when a page manages its own layout — small label/value pair.
 */
export const KeyValue: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <Box>
    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
      {label}
    </Typography>
    <Typography variant="body2" sx={{ fontWeight: 500, wordBreak: 'break-word' }}>
      {value ?? '—'}
    </Typography>
  </Box>
);
