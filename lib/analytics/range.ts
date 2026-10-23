// Date-range helpers shared by the admin analytics. Pure (no db / next
// imports) so they are easy to unit test. Every day is a UTC day, matching
// how the database groups timestamps.

export const RANGES = [7, 30, 90] as const;

export type RangeDays = (typeof RANGES)[number];

export const DEFAULT_RANGE: RangeDays = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

// Accepts a raw `?range=` value (or anything a server action is called with)
// and always returns an allowed range.
export const parseRange = (value: unknown): RangeDays => {
  const raw = Array.isArray(value) ? value[0] : value;
  const days = Number(raw);

  return RANGES.find((range) => range === days) ?? DEFAULT_RANGE;
};

const startOfUtcDay = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

// Start of the first day in the range. The range includes today, so
// "7 days" is today plus the 6 days before it.
export const getRangeStart = (days: number, now = new Date()) =>
  new Date(startOfUtcDay(now).getTime() - (days - 1) * DAY_MS);

// Start of the equally long period right before the range, for
// "change vs previous period".
export const getPreviousRangeStart = (days: number, now = new Date()) =>
  new Date(getRangeStart(days, now).getTime() - days * DAY_MS);

const toDateKey = (date: Date) => date.toISOString().slice(0, 10);

export type DailyPoint<K extends string> = { date: string } & Record<K, number>;

// Returns exactly one point per day in the range (oldest first). Days with no
// rows get zeros, so a chart never skips a quiet day.
export const fillDailySeries = <K extends string>(
  rows: ({ day: Date } & Partial<Record<K, number>>)[],
  days: number,
  keys: readonly K[],
  now = new Date(),
): DailyPoint<K>[] => {
  const byDay = new Map(rows.map((row) => [toDateKey(row.day), row]));
  const start = getRangeStart(days, now).getTime();

  return Array.from({ length: days }, (_, index) => {
    const date = toDateKey(new Date(start + index * DAY_MS));
    const row = byDay.get(date);
    const point = { date } as DailyPoint<K>;

    keys.forEach((key) => {
      point[key] = (row?.[key] ?? 0) as DailyPoint<K>[K];
    });

    return point;
  });
};

// Percentage change vs the previous period. `null` means "no previous data to
// compare with" (previous was 0), shown as "new" instead of Infinity. Never
// returns 0 for two different numbers: a tiny change is reported as +/-1.
export const percentChange = (current: number, previous: number) => {
  if (previous === 0) return null;
  if (current === previous) return 0;

  const change = Math.round(((current - previous) / previous) * 100);

  return change === 0 ? Math.sign(current - previous) : change;
};
