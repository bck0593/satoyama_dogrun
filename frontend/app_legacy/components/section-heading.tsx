import type { ReactNode } from "react"

interface SectionHeadingProps {
  children: ReactNode
  className?: string
  action?: ReactNode
}

export default function SectionHeading({ children, className = "", action }: SectionHeadingProps) {
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      <h2 className="text-xl font-bold text-strong">{children}</h2>
      {action && <div className="text-sm">{action}</div>}
    </div>
  )
}
