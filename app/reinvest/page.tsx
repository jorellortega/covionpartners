"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Construction, Clock, AlertCircle } from "lucide-react"

export default function ReinvestPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="leonardo-header">
        <div className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            className="text-gray-400 hover:text-purple-400 w-fit"
            onClick={() => router.back()}
            >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <Card className="leonardo-card border-gray-800">
          <CardHeader className="text-center pb-2">
            <Construction className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
            <CardTitle className="text-3xl">Under Development</CardTitle>
            <CardDescription className="text-gray-400 text-lg mt-2">
              We're working hard to bring you an amazing reinvestment experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <div className="p-6 bg-gray-900/50 rounded-lg border border-gray-800">
                <Clock className="w-8 h-8 text-blue-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Coming Soon</h3>
                <p className="text-gray-400">
                  Our team is currently developing this feature to provide you with a seamless reinvestment process.
                    </p>
                  </div>

              <div className="p-6 bg-gray-900/50 rounded-lg border border-gray-800">
                <AlertCircle className="w-8 h-8 text-purple-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Stay Tuned</h3>
                <p className="text-gray-400">
                  We'll notify you as soon as this feature becomes available. Thank you for your patience.
                </p>
                </div>
            </div>

            <div className="flex justify-center mt-8">
          <Button
            className="gradient-button"
                onClick={() => router.push('/dashboard')}
              >
                Return to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

