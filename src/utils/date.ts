// Date-only helpers.
// Avoid `new Date('YYYY-MM-DD')` and `toISOString()` for UI date inputs,
// because they interpret/emit UTC and can shift one day in local timezones.

export function formatLocalDateInputValue(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDateOnly(value: string): Date {
  const [y, m, d] = value.split('-').map((n) => Number(n));
  // Construct in local time to preserve the selected calendar date.
  return new Date(y, (m || 1) - 1, d || 1);
}
