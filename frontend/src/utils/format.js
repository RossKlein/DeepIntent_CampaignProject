import { format, parseISO } from 'date-fns'

export function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatPercent(value) {
  return `${value.toFixed(1)}%`
}

export function formatDateTime(value) {
  return format(parseISO(value), 'MMM d, h:mm a')
}

export function formatChartTime(value) {
  return format(parseISO(value), 'HH:mm')
}

/** Axis label — includes seconds so poll snapshots stay distinct on the chart. */
export function formatChartAxisTime(value) {
  return format(parseISO(value), 'MMM d, HH:mm:ss')
}

export function truncateUrl(url, maxLength = 48) {
  if (url.length <= maxLength) {
    return url
  }
  return `${url.slice(0, maxLength - 3)}...`
}
