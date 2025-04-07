import { cn } from "@/lib/utils"

interface LoadingSkeletonProps {
  className?: string
}

export function LoadingSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-white/10",
        className
      )}
    />
  )
}

export function CardSkeleton() {
  return (
    <div className="space-y-4">
      <LoadingSkeleton className="h-8 w-3/4" />
      <LoadingSkeleton className="h-4 w-1/2" />
      <LoadingSkeleton className="h-24 w-full" />
    </div>
  )
}

export function ProjectCardSkeleton() {
  return (
    <div className="leonardo-card p-6 space-y-4">
      <LoadingSkeleton className="h-12 w-12 mx-auto" />
      <LoadingSkeleton className="h-6 w-3/4 mx-auto" />
      <LoadingSkeleton className="h-4 w-full" />
    </div>
  )
} 