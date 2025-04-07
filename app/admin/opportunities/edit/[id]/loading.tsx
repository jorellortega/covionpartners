import { Skeleton } from "@/components/ui/skeleton"

export default function LoadingEditOpportunity() {
  return (
    <div className="min-h-screen">
      <header className="leonardo-header">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-10 w-64 bg-gray-800" />
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-gray-800 p-6">
          <Skeleton className="h-8 w-48 bg-gray-800 mb-4" />
          <Skeleton className="h-4 w-full bg-gray-800 mb-8" />

          <div className="grid grid-cols-4 gap-2 mb-8">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-10 bg-gray-800" />
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24 bg-gray-800" />
                <Skeleton className="h-10 w-full bg-gray-800" />
              </div>
            ))}
          </div>

          <div className="space-y-2 mb-8">
            <Skeleton className="h-4 w-32 bg-gray-800" />
            <Skeleton className="h-32 w-full bg-gray-800" />
          </div>

          <div className="flex justify-between">
            <Skeleton className="h-10 w-24 bg-gray-800" />
            <Skeleton className="h-10 w-24 bg-gray-800" />
          </div>
        </div>
      </main>
    </div>
  )
}

