import type { Tag } from "@/src/types"
import { cn } from "@/lib/utils"

interface TagBadgeProps {
  tag: Tag
  size?: "sm" | "md"
  variant?: "default" | "outline"
  className?: string
}

export default function TagBadge({ tag, size = "md", variant = "default", className = "" }: TagBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full",
        size === "sm" ? "px-2 py-1 text-xs" : "px-3 py-1 text-sm",
        variant === "default"
          ? "bg-blue-50 text-blue-700 border border-blue-200"
          : "bg-transparent text-gray-600 border border-gray-300",
        className,
      )}
    >
      {tag.name}
    </span>
  )
}
