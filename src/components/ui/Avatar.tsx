import { cn } from '../../lib/utils'

interface AvatarProps {
  initials: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  online?: boolean
}

const COLORS: Record<string, string> = {
  SJ: 'bg-rose-100 text-rose-600',
  MW: 'bg-blue-100 text-blue-600',
  PN: 'bg-violet-100 text-violet-600',
  JO: 'bg-amber-100 text-amber-600',
  EC: 'bg-teal-100 text-teal-600',
}

export function Avatar({ initials, size = 'md', className, online }: AvatarProps) {
  const colorClass = COLORS[initials] || 'bg-gray-100 text-gray-600'

  return (
    <div className={cn('relative inline-block', className)}>
      <div
        className={cn(
          'rounded-full flex items-center justify-center font-bold',
          colorClass,
          {
            'w-8 h-8 text-xs': size === 'sm',
            'w-14 h-14 text-lg': size === 'md',
            'w-20 h-20 text-2xl': size === 'lg',
          }
        )}
      >
        {initials}
      </div>
      {online && (
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full" />
      )}
    </div>
  )
}
