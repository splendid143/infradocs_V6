import { Loader2 } from 'lucide-react'
import { clsx } from 'clsx'

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg'
  fullScreen?: boolean
  className?: string
}

export function Loader({ size = 'md', fullScreen = false, className }: LoaderProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  }

  const containerClasses = fullScreen
    ? 'fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm'
    : 'flex items-center justify-center'

  return (
    <div className={clsx(containerClasses, className)}>
      <Loader2 className={clsx(sizeClasses[size], 'text-primary-600 animate-spin')} />
      {fullScreen && <span className="sr-only">Loading...</span>}
    </div>
  )
}