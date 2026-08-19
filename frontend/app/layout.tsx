import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

export const metadata: Metadata = {
  title: "DocMind AI — Chat with your PDFs",
  description: "Upload PDFs and get instant AI-powered answers with source citations.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={GeistSans.className}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}