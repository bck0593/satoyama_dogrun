interface SkeletonCardProps {
  className?: string
}

export default function SkeletonCard({ className = "" }: SkeletonCardProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ${className}`}>
      <div className="h-48 bg-gray-200 animate-pulse" />

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="h-6 bg-gray-200 rounded animate-pulse flex-1 mr-2" />
          <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse" />
        </div>

        <div className="space-y-2 mb-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
        </div>

        <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2 mb-3" />

        <div className="flex gap-1">
          <div className="h-6 w-12 bg-gray-200 rounded-full animate-pulse" />
          <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse" />
          <div className="h-6 w-14 bg-gray-200 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  )
}
