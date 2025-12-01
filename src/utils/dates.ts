import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns';

const toDate = (value: string | number | Date) => {
  if (value instanceof Date) return value;
  if (typeof value === 'number') return new Date(value);
  return parseISO(value);
};

export const formatDate = (date: string | number | Date, fmt = 'MMM d, yyyy') =>
  format(toDate(date), fmt);

export const formatTime = (date: string | number | Date, fmt = 'h:mm a') =>
  format(toDate(date), fmt);

export const buildMonthMatrix = (base: Date) => {
  const start = startOfWeek(startOfMonth(base), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(base), { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start, end });
  const matrix: Date[][] = [];

  for (let i = 0; i < days.length; i += 7) {
    matrix.push(days.slice(i, i + 7));
  }

  return matrix;
};

export const sameDay = (a: Date | string, b: Date | string) => isSameDay(toDate(a), toDate(b));

export const startOfDayISO = (value: string | number | Date) => {
  const date = toDate(value);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
};

export const endOfDayISO = (value: string | number | Date) => {
  const date = toDate(value);
  date.setHours(23, 59, 59, 999);
  return date.toISOString();
};

export const addDaysISO = (value: string | number | Date, days: number) =>
  addDays(toDate(value), days).toISOString();
