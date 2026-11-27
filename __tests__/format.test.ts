import {
  formatAmount,
  formatDateStamp,
  formatMoney,
  formatShortDate,
} from '../src/utils/format';

describe('format', () => {
  it('shows 2 decimal places', () => {
    expect(formatAmount(2499.5)).toBe('2499.50');
    expect(formatMoney(10, 'USD')).toBe('USD 10.00');
  });

  it('formats dates in local time', () => {
    const ms = new Date(2026, 10, 26, 13, 9).getTime();
    expect(formatShortDate(ms)).toBe('26 Nov 2026');
    expect(formatDateStamp(ms)).toBe('20261126');
  });
});
