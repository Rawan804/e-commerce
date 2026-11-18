/**
 * shared/lib/formatters.ts
 *
 * Pure formatting helpers used across all features.
 * Keep this file side-effect-free and framework-agnostic.
 */

// ─── Currency ─────────────────────────────────────────────────────────────────

/**
 * Format a number as a localised currency string.
 *
 * @example formatCurrency(1234.5)          // "$1,234.50"
 * @example formatCurrency(99, 'EUR', 'de') // "99,00 €"
 */
export function formatCurrency(
  amount: number,
  currency = 'USD',
  locale = 'en-US',
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

// ─── Dates ────────────────────────────────────────────────────────────────────

/**
 * Format an ISO date string or Date object as a human-readable date.
 *
 * @example formatDate('2024-03-15') // "March 15, 2024"
 */
export function formatDate(
  value: string | Date,
  locale = 'en-US',
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  },
): string {
  const date = typeof value === 'string' ? new Date(value) : value
  if (isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat(locale, options).format(date)
}

/**
 * Format an ISO date string as a short relative label when recent,
 * falling back to the full date for older dates.
 *
 * @example formatRelativeDate('2024-01-01') // "Jan 1, 2024"
 */
export function formatRelativeDate(value: string | Date, locale = 'en-US'): string {
  return formatDate(value, locale, { year: 'numeric', month: 'short', day: 'numeric' })
}

// ─── Numbers ─────────────────────────────────────────────────────────────────

/**
 * Format a number with thousand separators.
 *
 * @example formatNumber(1234567) // "1,234,567"
 */
export function formatNumber(value: number, locale = 'en-US'): string {
  return new Intl.NumberFormat(locale).format(value)
}

// ─── Strings ─────────────────────────────────────────────────────────────────

/**
 * Truncate a string to `maxLength` characters, appending "…" if truncated.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trimEnd() + '…'
}

/**
 * Capitalise the first letter of a string.
 */
export function capitalise(text: string): string {
  if (!text) return text
  return text.charAt(0).toUpperCase() + text.slice(1)
}
