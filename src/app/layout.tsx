import type { Metadata, Viewport } from "next";
import { Poppins, Inter, Space_Mono } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs'
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "SplitBills - Easy Bill Splitting for Friends",
  description: "Upload your restaurant bill, let AI extract items, and share with friends.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SplitBills",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
    children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link rel="icon" href="/favicon.ico" />
        </head>
        <body
          className={`${poppins.variable} ${inter.variable} ${spaceMono.variable} font-sans antialiased bg-gradient-to-br from-amber-50 via-pink-50 to-indigo-50 min-h-screen`}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
