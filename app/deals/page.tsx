"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Wrench, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export default function DealsPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        <Card className="leonardo-card border-gray-800">
          <CardHeader>
            <CardTitle className="text-2xl">Deals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Wrench className="w-10 h-10 text-purple-400" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-300 mb-3">Under Development</h2>
              <p className="text-gray-500 max-w-md mx-auto mb-8">
                We're currently working on building an amazing deals management system. 
                Check back soon for updates!
              </p>
              <Button
                onClick={() => router.push('/dashboard')}
                className="gradient-button"
              >
                Return to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 