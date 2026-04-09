import { cn } from '../../lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'teal' | 'yellow' | 'purple' | 'gray' | 'green'
  className?: string
}

export function Badge({ children, variant = 'teal', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide',
        {
          'bg-teal-100 text-teal-700': variant === 'teal',
          'bg-yellow-100 text-yellow-700': variant === 'yellow',
          'bg-purple-100 text-purple-700': variant === 'purple',
          'bg-gray-100 text-gray-600': variant === 'gray',
          'bg-green-100 text-green-700': variant === 'green',
        },
        className
      )}
    >
      {children}
    </span>
  )
}
