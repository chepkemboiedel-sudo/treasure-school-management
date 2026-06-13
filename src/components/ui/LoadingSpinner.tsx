import { cn } from '@/lib/utils'

export default function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center py-12', className)}>
      <div className="w-8 h-8 border-4 border-slate-200 border-t-primary-600 rounded-full animate-spin" />
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-slate-500">Loading…</p>
      </div>
    </div>
  )
}
