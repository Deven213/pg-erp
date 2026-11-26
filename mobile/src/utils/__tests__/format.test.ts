import { formatDate, formatINR, formatIndianMobile, groupIndian, initials } from '../format';

describe('formatINR', () => {
  it.each([
    [0, '₹0'],
    [500, '₹500'],
    [8000, '₹8,000'],
    [142000, '₹1,42,000'],
    [1084500, '₹10,84,500'],
    [12345678, '₹1,23,45,678'],
    [2948.82, '₹2,948.82'],
    [-500, '−₹500'],
    ['7500', '₹7,500'],
    ['7500.50', '₹7,500.50'],
  ])('formats %p as %s', (input, expected) => {
    expect(formatINR(input)).toBe(expected);
  });

  it('returns a dash for missing or invalid values', () => {
    expect(formatINR(null)).toBe('—');
    expect(formatINR(undefined)).toBe('—');
    expect(formatINR('')).toBe('—');
    expect(formatINR('abc')).toBe('—');
  });
});

describe('groupIndian', () => {
  it('groups by lakh and crore', () => {
    expect(groupIndian('100000')).toBe('1,00,000');
    expect(groupIndian('999')).toBe('999');
  });
});

describe('formatDate', () => {
  it('uses the Indian day-month-year style', () => {
    expect(formatDate(new Date(2026, 11, 5))).toBe('5 Dec 2026');
  });
  it('handles invalid input', () => {
    expect(formatDate('not a date')).toBe('—');
    expect(formatDate(null)).toBe('—');
  });
});

describe('formatIndianMobile', () => {
  it('formats 10-digit and +91 numbers', () => {
    expect(formatIndianMobile('9825041736')).toBe('+91 98250 41736');
    expect(formatIndianMobile('+91 98250-41736')).toBe('+91 98250 41736');
  });
  it('leaves non-Indian numbers untouched', () => {
    expect(formatIndianMobile('12345')).toBe('12345');
  });
});

describe('initials', () => {
  it('takes up to two initials', () => {
    expect(initials('Rohan Sharma')).toBe('RS');
    expect(initials('Deven')).toBe('D');
    expect(initials('')).toBe('?');
  });
});
