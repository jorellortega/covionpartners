import React from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface DisabledButtonProps {
  children: React.ReactNode
  icon?: React.ReactNode
}

export function DisabledButton({ children, icon }: DisabledButtonProps) {
  return (
    <div className="relative group">
      <Button
        className="gradient-button opacity-50 cursor-not-allowed"
        disabled
      >
        {icon}
        {children}
      </Button>
      <Badge 
        className="absolute -top-3 -right-3 bg-yellow-600 text-white text-xs px-2 py-0.5"
      >
        Under Development
      </Badge>
    </div>
  )
} 