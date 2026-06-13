import Image from 'next/image'
import { getInitials } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface AvatarProps {
  name: string
  photo?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-base' }

export default function Avatar({ name, photo, size = 'md', className }: AvatarProps) {
  if (photo) {
    return (
      <div className={cn('relative rounded-full overflow-hidden flex-shrink-0', sizes[size], className)}>
        <Image src={photo} alt={name} fill className="object-cover" />
      </div>
    )
  }
  return (
    <div
      className={cn(
        'rounded-full bg-primary-100 text-primary-700 font-semibold flex items-center justify-center flex-shrink-0',
        sizes[size],
        className
      )}
    >
      {getInitials(name)}
    </div>
  )
}
