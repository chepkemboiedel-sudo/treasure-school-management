import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date | null | undefined, fmt = 'MMM d, yyyy'): string {
  if (!date) return '—'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, fmt)
  } catch {
    return '—'
  }
}

export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount == null) return '—'
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(Number(amount))
}

// CBC Kenya performance levels: EE ≥80%, ME ≥60%, AE ≥40%, BE <40%
export function calculatePerformanceLevel(marks: number, total: number): string {
  const pct = (marks / total) * 100
  if (pct >= 80) return 'EE'
  if (pct >= 60) return 'ME'
  if (pct >= 40) return 'AE'
  return 'BE'
}

export const performanceLevelLabel: Record<string, string> = {
  EE: 'Exceeding Expectations',
  ME: 'Meeting Expectations',
  AE: 'Approaching Expectations',
  BE: 'Below Expectations',
}

export function generateReceiptNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `RCP-${timestamp}-${random}`
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function paginate<T>(items: T[], page: number, perPage: number) {
  const total = items.length
  const totalPages = Math.ceil(total / perPage)
  const offset = (page - 1) * perPage
  return {
    data: items.slice(offset, offset + perPage),
    total,
    totalPages,
    page,
    perPage,
  }
}
