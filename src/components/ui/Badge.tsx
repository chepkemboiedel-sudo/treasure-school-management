import { cn } from '@/lib/utils'

type BadgeVariant = 'green' | 'red' | 'yellow' | 'blue' | 'purple' | 'gray' | 'orange'

const variantClasses: Record<BadgeVariant, string> = {
  green: 'bg-emerald-100 text-emerald-800',
  red: 'bg-red-100 text-red-800',
  yellow: 'bg-amber-100 text-amber-800',
  blue: 'bg-blue-100 text-blue-800',
  purple: 'bg-purple-100 text-purple-800',
  gray: 'bg-slate-100 text-slate-700',
  orange: 'bg-orange-100 text-orange-800',
}

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

export default function Badge({ children, variant = 'gray', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

export function attendanceBadge(status: string) {
  const map: Record<string, BadgeVariant> = {
    PRESENT: 'green', ABSENT: 'red', LATE: 'yellow', EXCUSED: 'blue',
  }
  return map[status] ?? 'gray'
}

export function paymentBadge(status: string) {
  const map: Record<string, BadgeVariant> = {
    PAID: 'green', PARTIAL: 'yellow', UNPAID: 'red',
  }
  return map[status] ?? 'gray'
}

export function roleBadge(role: string) {
  const map: Record<string, BadgeVariant> = {
    ADMIN: 'purple', TEACHER: 'blue', STUDENT: 'green', PARENT: 'orange',
  }
  return map[role] ?? 'gray'
}
