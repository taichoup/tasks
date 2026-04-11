export const DAY_IN_MS = 86400000; // 24 * 60 * 60 * 1000
export const WEEK_IN_MS = 604800000; // 7 * 24 * 60 * 60 * 1000
export const MONTH_IN_MS = 2592000000; // 30 * 24 * 60 * 60 * 1000
export const YEAR_IN_MS = 31536000000; // 365 * 24 * 60 * 60 * 1000
export const HOUR_IN_MS = 3600000; // 60 * 60 * 1000
export const MINUTE_IN_MS = 60000;
export const SUPPORTED_FREQUENCY_UNITS = [
  "day",
  "week",
  "month",
  "year",
] as const;
