/**
 * Date/time formatting helpers. All timestamps from the API are ISO UTC;
 * the dashboard audience is IST (Asia/Kolkata) per the stats rules.
 */
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(relativeTime);
dayjs.extend(utc);
dayjs.extend(timezone);

export const IST = 'Asia/Kolkata';

export const formatDateTime = (iso?: string | null) =>
  iso ? dayjs(iso).tz(IST).format('DD MMM YYYY, HH:mm') : '—';

export const formatDate = (iso?: string | null) =>
  iso ? dayjs(iso).tz(IST).format('DD MMM YYYY') : '—';

export const formatRelative = (iso?: string | null) =>
  iso ? dayjs(iso).fromNow() : '—';

export const truncate = (s: string | null | undefined, n = 80) =>
  !s ? '—' : s.length > n ? `${s.slice(0, n - 1)}…` : s;

/** Humanize audit action names: 'ban_user' → 'Ban user' */
export const humanizeAction = (action: string) =>
  action
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
