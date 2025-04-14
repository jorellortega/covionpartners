"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"

export function MainNav() {
  const { user } = useAuth()

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6">
      <Link href="/" className="text-sm font-medium transition-colors hover:text-primary">
        Home
      </Link>
      <Link href="/publicprojects" className="text-sm font-medium transition-colors hover:text-primary">
        Public Projects
      </Link>
      <Link href="/account-types" className="text-sm font-medium transition-colors hover:text-primary">
        Account Types
      </Link>
      {user ? (
        <Link href="/dashboard" className="text-sm font-medium transition-colors hover:text-primary">
          Dashboard
        </Link>
      ) : (
        <Link href="/login">
          <Button variant="ghost" className="text-sm font-medium hover:text-purple-400">
            Login
          </Button>
        </Link>
      )}
    </nav>
  )
} 