import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

export const metadata: Metadata = {
  title: "SCASH Wallet",
  description: "Non-custodial cryptocurrency wallet",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}

/* 桌面端宽度限制 */
@media (min-width: 768px) {
  body {
    max-width: 428px;
    margin: 0 auto;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
  }
}
        `}</style>
      </head>
      <body className="antialiased bg-gray-900">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
