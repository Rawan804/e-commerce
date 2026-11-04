
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


export function formatRelativeDate(value: string | Date, locale = 'en-US'): string {
  return formatDate(value, locale, { year: 'numeric', month: 'short', day: 'numeric' })
}


export function formatNumber(value: number, locale = 'en-US'): string {
  return new Intl.NumberFormat(locale).format(value)
}


export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trimEnd() + '…'
}


export function capitalise(text: string): string {
  if (!text) return text
  return text.charAt(0).toUpperCase() + text.slice(1)
}
