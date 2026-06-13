import { AnnouncementRecord } from '@/types'
import { formatDate } from '@/lib/utils'
import { Megaphone } from 'lucide-react'
import Badge, { roleBadge } from '@/components/ui/Badge'

interface Props { announcements: AnnouncementRecord[] }

export default function RecentAnnouncements({ announcements }: Props) {
  return (
    <div className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl p-6 shadow-sm h-full">
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 4px 12px rgba(245,158,11,0.35)' }}
        >
          <Megaphone className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="font-extrabold text-slate-900 text-sm">Recent Announcements</h3>
          <p className="text-xs text-slate-400">Latest school-wide updates</p>
        </div>
      </div>

      {announcements.length === 0 ? (
        <div className="text-center py-10">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <Megaphone className="w-6 h-6 text-slate-300" />
          </div>
          <p className="text-sm text-slate-400 font-medium">No announcements yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((a, i) => {
            const authorName = a.author.admin?.name ?? a.author.teacher?.name ?? a.author.email
            const dotColors = ['bg-violet-500', 'bg-emerald-500', 'bg-sky-500', 'bg-amber-500', 'bg-rose-500']
            return (
              <div key={a.id} className="flex gap-3 group">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-2 ${dotColors[i % dotColors.length]}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-slate-800 leading-snug">{a.title}</p>
                    {a.targetRole && (
                      <Badge variant={roleBadge(a.targetRole)}>{a.targetRole}</Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">{a.content}</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    By {authorName} · {formatDate(a.createdAt, 'MMM d')}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
