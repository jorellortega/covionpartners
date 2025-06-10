import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { Inter } from "next/font/google"
import { SiteHeader } from "@/components/site-header"
import { Toaster } from "sonner"
import Providers from "./providers"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Covion Partners",
  description: "Covion Partners Platform",
  icons: {
    icon: [
      {
        url: '/favicon.svg',
        type: 'image/svg+xml',
      },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <SiteHeader />
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}



import './globals.css'