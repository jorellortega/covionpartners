"use client"

import Link from "next/link"
import { MainNav } from "@/components/main-nav"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-center">
        <div className="flex items-center justify-center w-full">
          <Link href="/" className="mr-6 flex items-center space-x-2 hover:text-blue-300 transition-colors">
            <span className="hidden font-bold sm:inline-block">
              COVION STUDIO
            </span>
          </Link>
          <MainNav />
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {/* Add search or other header elements here if needed */}
          </div>
        </div>
      </div>
    </header>
  )
} 