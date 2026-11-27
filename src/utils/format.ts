const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const pad2 = (n: number) => String(n).padStart(2, '0');

/** `2499.5` -> `2499.50` */
export const formatAmount = (amount: number): string => amount.toFixed(2);

/** `2499.5`, `INR` -> `INR 2499.50` */
export const formatMoney = (amount: number, currency: string): string =>
  `${currency} ${formatAmount(amount)}`;

/** Unix ms -> `26 Nov 2026` */
export const formatShortDate = (ms: number): string => {
  const d = new Date(ms);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

/** Unix ms -> `26 Nov 2026, 13:09` */
export const formatDateTime = (ms: number): string => {
  const d = new Date(ms);
  return `${formatShortDate(ms)}, ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};

/** Unix ms -> `YYYYMMDD` (device local date) */
export const formatDateStamp = (ms: number): string => {
  const d = new Date(ms);
  return `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}`;
};

export const capitalize = (s: string): string =>
  s.charAt(0).toUpperCase() + s.slice(1);
