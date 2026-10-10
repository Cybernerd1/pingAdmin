/**
 * Dashboard — KPI cards (overview, cached 60s server-side) + time series
 * (signups / matches, IST-bucketed by the API) + report status donut.
 */
import React, { useState } from 'react';
import useSWR from 'swr';
import {
  Box,
  Card,
  CardContent,
  Grid,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import BoltIcon from '@mui/icons-material/Bolt';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import FlagIcon from '@mui/icons-material/Flag';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { statsApi } from '../../services/api';
import { StatCard } from '../../components/ui/StatCard';
import { ErrorState, LoadingState } from '../../components/ui/StateViews';
import { PageHeader } from '../../components/ui/PageHeader';
import { pingColors } from '../../theme/muiTheme';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler);

const RANGES = [
  { value: 7, label: 'Last 7 days' },
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 90 days' },
];

const lineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false }, ticks: { maxTicksLimit: 8 } },
    y: { beginAtZero: true, ticks: { precision: 0 } },
  },
  elements: {
    line: { tension: 0.35, borderWidth: 2.5 },
    point: { radius: 0, hoverRadius: 5 },
  },
} as const;

const seriesData = (series: { day: string; count: number }[], color: string) => ({
  labels: series.map((p) => (p.day ?? '').slice(5, 10)),
  datasets: [
    {
      data: series.map((p) => p.count),
      borderColor: color,
      backgroundColor: `${color}22`,
      fill: true,
    },
  ],
});

export const DashboardPage: React.FC = () => {
  const [days, setDays] = useState(30);

  const overview = useSWR('stats/overview', () => statsApi.overview(), {
    refreshInterval: 60_000,
  });
  const signups = useSWR(['stats/signups', days], () => statsApi.signups(days));
  const matches = useSWR(['stats/matches', days], () => statsApi.matches(days));

  if (overview.error) {
    return <ErrorState message={(overview.error as Error).message} onRetry={() => overview.mutate()} />;
  }

  const s = overview.data;
  const reports = s?.reports ?? {};

  const donutData = {
    labels: ['Pending', 'Reviewed', 'Actioned', 'Dismissed'],
    datasets: [
      {
        data: [reports.pending ?? 0, reports.reviewed ?? 0, reports.actioned ?? 0, reports.dismissed ?? 0],
        backgroundColor: ['#F59E0B', '#3B82F6', '#10B981', '#9CA3AF'],
        borderWidth: 0,
      },
    ],
  };

  return (
    <Box>
      <PageHeader
        title="Dashboard"
        subtitle="Live KPIs (60s cache) · demo & dummy accounts excluded · days bucketed in IST"
        action={
          <TextField
            select
            size="small"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            sx={{ width: 160 }}
          >
            {RANGES.map((r) => (
              <MenuItem key={r.value} value={r.value}>
                {r.label}
              </MenuItem>
            ))}
          </TextField>
        }
      />

      {/* KPI row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="Total users"
            value={s?.total_users}
            loading={!s}
            icon={<PeopleIcon />}
            subtext="excl. demo/dummy/deleted"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="Active (7d)"
            value={s?.active_7d}
            loading={!s}
            icon={<BoltIcon />}
            tint={pingColors.secondary}
            subtext="by last_active_at"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="Total matches"
            value={s?.total_matches}
            loading={!s}
            icon={<FavoriteIcon />}
            tint="#EC4899"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="Total messages"
            value={s?.total_messages}
            loading={!s}
            icon={<ChatBubbleIcon />}
            tint={pingColors.info}
          />
        </Grid>
      </Grid>

      {/* Charts row */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '16px' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Signups
              </Typography>
              <Box sx={{ height: 280 }}>
                {signups.error ? (
                  <ErrorState message={(signups.error as Error).message} onRetry={() => signups.mutate()} />
                ) : !signups.data ? (
                  <LoadingState />
                ) : (
                  <Line data={seriesData(signups.data.series, pingColors.primary)} options={lineOptions} />
                )}
              </Box>
            </CardContent>
          </Card>

          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '16px', mt: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Matches
              </Typography>
              <Box sx={{ height: 280 }}>
                {matches.error ? (
                  <ErrorState message={(matches.error as Error).message} onRetry={() => matches.mutate()} />
                ) : !matches.data ? (
                  <LoadingState />
                ) : (
                  <Line data={seriesData(matches.data.series, pingColors.secondary)} options={lineOptions} />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '16px', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <FlagIcon sx={{ color: pingColors.primary }} />
                <Typography variant="h6">Reports by status</Typography>
              </Box>
              <Box sx={{ height: 240, position: 'relative' }}>
                <Doughnut
                  data={donutData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '68%',
                    plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } } },
                  }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                {(reports.pending ?? 0) > 0
                  ? `${reports.pending} report${reports.pending === 1 ? '' : 's'} waiting for review`
                  : 'No pending reports — all clear'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
