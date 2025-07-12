import { DateTime } from 'luxon';

export const INDIA_TIMEZONE = 'Asia/Kolkata';

export function getCurrentIST(): DateTime {
  const now = DateTime.utc();
  return now.setZone(INDIA_TIMEZONE);
}

export function toIST(date: Date | string): DateTime {
  return DateTime.fromJSDate(typeof date === 'string' ? new Date(date) : date).setZone(INDIA_TIMEZONE);
}

export function formatIST(date: Date | string, format = 'yyyy-MM-dd HH:mm:ss'): string {
  return toIST(date).toFormat(format);
}

export function getTodayStartIST(): DateTime {
  return getCurrentIST().startOf('day');
}

export function getTodayEndIST(): DateTime {
  return getCurrentIST().endOf('day');
}

export function isToday(date: Date | string): boolean {
  const inputDate = toIST(date);
  const today = getCurrentIST();
  return inputDate.hasSame(today, 'day');
}

export function getRelativeTimeIST(date: Date | string): string {
  return toIST(date).toRelative() || 'unknown';
}

export function formatTimeIST(date: Date | string): string {
  return toIST(date).toFormat('HH:mm');
}

export function formatDateIST(date: Date | string): string {
  return toIST(date).toFormat('dd MMM yyyy');
}

export function formatDateTimeIST(date: Date | string): string {
  return toIST(date).toFormat('dd MMM yyyy, HH:mm');
}