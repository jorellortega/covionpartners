import { AlertCircle } from "lucide-react"

export function DevelopmentBanner() {
  return (
    <div className="bg-yellow-500/10 border-b border-yellow-500/20 py-3">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center gap-2 text-yellow-400">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm font-medium">
            This feature is currently under development
          </p>
        </div>
      </div>
    </div>
  )
} 