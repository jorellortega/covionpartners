'use client'

import { Construction } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface UnderDevelopmentProps {
  pageName: string
}

export default function UnderDevelopment({ pageName }: UnderDevelopmentProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-background/80">
      <div className="text-center space-y-8 p-8 max-w-2xl mx-auto">
        <div className="flex justify-center">
          <div className="bg-yellow-500/10 p-4 rounded-full">
            <Construction className="w-16 h-16 text-yellow-500" />
          </div>
        </div>
        <h1 className="text-4xl font-bold tracking-tighter">{pageName}</h1>
        <p className="text-xl text-muted-foreground">
          This page is currently under development. We're working hard to bring you an amazing experience.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/dashboard">
            <Button variant="default" className="gradient-button">
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
} 