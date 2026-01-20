import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"
import { SpeedInsights } from '@vercel/speed-insights/next';

export const metadata: Metadata = {
  title: "SCASH Wallet - Secure Non-Custodial Wallet",
  description:
    "SCASH Wallet is a secure, non-custodial cryptocurrency wallet with client-side transaction signing, AES-encrypted storage, and full user privacy.",
  keywords: [
    "SCASH Wallet",
    "SCASH",
    "cryptocurrency wallet",
    "non-custodial",
    "bitcoin-like wallet",
    "secure crypto wallet",
    "AES encryption",
    "client-side signing",
  ],
  authors: [{ name: "SCASH Community" }],
  creator: "SCASH Community",
  publisher: "SCASH Community",
  applicationName: "SCASH Wallet",
  openGraph: {
    title: "SCASH Wallet - Secure Non-Custodial Wallet",
    description:
      "A modern and secure SCASH wallet that keeps your keys safe. Local signing, no private key ever leaves your device.",
    url: "https://wallet.scash.network/",
    siteName: "SCASH Wallet",
    images: [
      {
        url: "https://wallet.scash.network/og-image.png",
        width: 1200,
        height: 630,
        alt: "SCASH Wallet",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SCASH Wallet - Secure Non-Custodial Wallet",
    description:
      "SCASH Wallet protects your keys with AES encryption and local signing. Your crypto, your control.",
    images: ["https://wallet.scash.network/og-image.png"],
    creator: "@scash_wallet",
  },
  category: "finance",
  generator: "Next.js",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark h-full">
      <head>
           <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#7B2EFF" /> 
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body className="antialiased bg-gray-950 h-full flex items-center justify-center overflow-hidden sm:p-4 relative">
        {/* Background Effects for Desktop - Elegant & Subtle */}
        <div className="fixed inset-0 -z-10 h-full w-full bg-[#050505] overflow-hidden">
          {/* 0. Global Gradient - Restored */}
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>

          {/* 1. Subtle Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(circle_at_center,black_40%,transparent_100%)]"></div>
          
          {/* 2. Ambient Glows - Creating depth */}
          <div className="absolute -top-[20%] left-[20%] w-[800px] h-[800px] bg-purple-900/20 rounded-full blur-[120px] mix-blend-screen animate-pulse duration-[4000ms]"></div>
          <div className="absolute -bottom-[20%] right-[20%] w-[800px] h-[800px] bg-blue-900/10 rounded-full blur-[120px] mix-blend-screen"></div>

          {/* 3. Decorative Logo - Right Bottom Watermark */}
          <div className="absolute bottom-0 right-0 translate-x-[30%] translate-y-[30%] w-[800px] h-[800px] opacity-[0.08] blur-[1px] -rotate-12 pointer-events-none select-none transition-transform duration-1000 ease-in-out hover:scale-105 hover:rotate-0">
              <img src="https://r2.scash.network/logo.png" alt="" className="w-full h-full object-contain" />
          </div>

          {/* 4. Decorative Logo - Left Top Echo */}
          <div className="absolute top-[5%] left-[5%] w-[150px] h-[150px] opacity-[0.05] blur-[2px] rotate-12 pointer-events-none select-none">
              <img src="https://r2.scash.network/logo.png" alt="" className="w-full h-full object-contain" />
          </div>
        </div>
        
        <div className="w-full h-full sm:max-w-[428px] sm:h-[850px] sm:max-h-[calc(100vh-40px)] bg-gray-900 sm:rounded-[2.5rem] sm:border-[8px] sm:border-gray-800 sm:shadow-2xl overflow-hidden relative transform transition-all isolate ring-1 ring-white/10">
          <div id="wallet-scroll-container" className="w-full h-full overflow-y-auto overflow-x-hidden scrollbar-hide">
            {children}
          </div>
          <SpeedInsights />
          <Toaster />
        </div>
      </body>
    </html>
  )
}
