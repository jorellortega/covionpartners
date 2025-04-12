"use client"

import Link from "next/link"
import { MainNav } from "@/components/main-nav"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="flex items-center justify-between w-full">
          <Link href="/" className="flex items-center space-x-2 hover:text-blue-300 transition-colors pl-4">
            <span className="hidden font-bold sm:inline-block">
              COVION PARTNERS
            </span>
          </Link>
          <MainNav />
        </div>
      </div>
    </header>
  )
} 