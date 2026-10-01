type SkeletonProps = { className?: string }

export function Skeleton({ className = '' }: SkeletonProps) {
  return <span className={`block animate-pulse rounded-lg bg-warm/10 ${className}`} aria-hidden="true" />
}
