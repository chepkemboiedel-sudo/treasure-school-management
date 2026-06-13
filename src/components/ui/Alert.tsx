import { cn } from '@/lib/utils'
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react'

type AlertVariant = 'info' | 'success' | 'warning' | 'error'

const config: Record<AlertVariant, { icon: typeof Info; className: string }> = {
  info: { icon: Info, className: 'bg-blue-50 border-blue-200 text-blue-800' },
  success: { icon: CheckCircle, className: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
  warning: { icon: AlertCircle, className: 'bg-amber-50 border-amber-200 text-amber-800' },
  error: { icon: XCircle, className: 'bg-red-50 border-red-200 text-red-800' },
}

interface AlertProps {
  variant?: AlertVariant
  title?: string
  children: React.ReactNode
  className?: string
}

export default function Alert({ variant = 'info', title, children, className }: AlertProps) {
  const { icon: Icon, className: variantClass } = config[variant]
  return (
    <div className={cn('flex gap-3 p-4 border rounded-lg', variantClass, className)}>
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div>
        {title && <p className="font-medium mb-0.5">{title}</p>}
        <div className="text-sm">{children}</div>
      </div>
    </div>
  )
}
