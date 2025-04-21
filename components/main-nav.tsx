"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Menu } from "lucide-react"

export function MainNav() {
  const { user } = useAuth()

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6">
      <Link href="/" className="text-sm font-medium transition-colors hover:text-primary">
        Home
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="text-sm font-medium bg-blue-500/10 hover:bg-blue-500/20 hover:text-blue-400 transition-colors">
            <Menu className="h-4 w-4 mr-2" />
            Menu
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-gray-900 border border-gray-800">
          <DropdownMenuItem className="cursor-pointer hover:bg-blue-500/20 hover:text-blue-400">
            <Link href="/publicprojects" className="w-full">
        Public Projects
      </Link>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer hover:bg-blue-500/20 hover:text-blue-400">
            <Link href="/publicfunding" className="w-full">
        Public Funding
      </Link>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer hover:bg-blue-500/20 hover:text-blue-400">
            <Link href="/funding-settings" className="w-full">
        Funding Settings
      </Link>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer hover:bg-blue-500/20 hover:text-blue-400">
            <Link href="/account-types" className="w-full">
        Account Types
      </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
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