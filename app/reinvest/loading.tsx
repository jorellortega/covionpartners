import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="min-h-screen">
      <header className="leonardo-header">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <Skeleton className="h-6 w-32 mr-4" />
            <Skeleton className="h-10 w-64" />
          </div>
          <Skeleton className="h-6 w-24" />
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Balance Summary Skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="leonardo-card border-gray-800 p-6">
              <Skeleton className="h-6 w-40 mb-4" />
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
          ))}
        </div>

        {/* Project Selection Skeletons */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-10 w-48" />
          </div>

          <Skeleton className="h-20 w-full mb-6" />

          <div className="grid grid-cols-1 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="leonardo-card border-gray-800 p-6">
                <Skeleton className="h-6 w-48 mb-2" />
                <div className="flex gap-2 mb-4">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <Skeleton className="h-4 w-full mb-4" />
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j}>
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                  ))}
                </div>
                <Skeleton className="h-2 w-full mb-4" />
                <Skeleton className="h-8 w-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Summary Skeleton */}
        <div className="leonardo-card border-gray-800 p-6 mb-8">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64 mb-4" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-gray-700">
                <div>
                  <Skeleton className="h-5 w-40 mb-1" />
                  <div className="flex gap-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <div>
                  <Skeleton className="h-6 w-24 mb-1" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            ))}
            <div className="flex justify-between items-center pt-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-8 w-32" />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4 mb-8">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-48" />
        </div>
      </main>
    </div>
  )
}

