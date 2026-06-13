import { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  color?: 'blue' | 'green' | 'amber' | 'purple' | 'red' | 'indigo'
  trend?: { value: number; label: string }
}

const gradients: Record<string, string> = {
  blue:   'linear-gradient(135deg, #3b82f6, #2563eb)',
  green:  'linear-gradient(135deg, #10b981, #059669)',
  amber:  'linear-gradient(135deg, #f59e0b, #d97706)',
  purple: 'linear-gradient(135deg, #a855f7, #7c3aed)',
  red:    'linear-gradient(135deg, #ef4444, #dc2626)',
  indigo: 'linear-gradient(135deg, #6366f1, #4f46e5)',
}

const glows: Record<string, string> = {
  blue:   'rgba(59,130,246,0.35)',
  green:  'rgba(16,185,129,0.35)',
  amber:  'rgba(245,158,11,0.35)',
  purple: 'rgba(168,85,247,0.35)',
  red:    'rgba(239,68,68,0.35)',
  indigo: 'rgba(99,102,241,0.35)',
}

export default function StatsCard({ title, value, subtitle, icon: Icon, color = 'indigo', trend }: StatsCardProps) {
  return (
    <div
      className="rounded-2xl p-5 text-white relative overflow-hidden shadow-lg hover:scale-[1.02] transition-transform duration-200"
      style={{
        background: gradients[color],
        boxShadow: `0 8px 24px ${glows[color]}`,
      }}
    >
      {/* Decorative circle */}
      <div
        className="absolute top-0 right-0 w-28 h-28 rounded-full opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)', transform: 'translate(30%, -30%)' }}
      />

      <div className="flex items-start justify-between relative">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white/75 truncate">{title}</p>
          <p className="text-3xl font-black text-white mt-1 leading-none">{value}</p>
          {subtitle && <p className="text-xs text-white/60 mt-1.5">{subtitle}</p>}
          {trend && (
            <p className="text-xs mt-2 font-bold text-white/80">
              {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
            </p>
          )}
        </div>
        <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 ml-3">
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  )
}
