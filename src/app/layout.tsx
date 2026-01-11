import type { Metadata, Viewport } from "next";
import { Poppins, Inter, Space_Mono } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs'
import "./globals.css";
import { ToastContainer } from '@/components/ui/toast'

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
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
  maximumScale: 5,
  userScalable: true,
};

export const metadata: Metadata = {
  title: "SplitBills - AI Bill Splitting",
  description: "Split bills with AI-powered scanning",
};

export default function RootLayout({
  children,
}: Readonly<{
    children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: { colorPrimary: '#6366f1' },
        elements: {
          formButtonPrimary: 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700',
          card: 'bg-gray-900 border border-white/10',
          headerTitle: 'text-white',
          headerSubtitle: 'text-gray-400',
          socialButtonsBlockButton: 'border-white/20 text-white hover:bg-white/10',
          formFieldLabel: 'text-gray-300',
          formFieldInput: 'bg-white/5 border-white/20 text-white',
          footerActionLink: 'text-indigo-400 hover:text-indigo-300',
        }
      }}
    >
      <html lang="en">
        <body className={`${poppins.variable} ${inter.variable} ${spaceMono.variable} font-sans antialiased`}>
          {children}
          <ToastContainer />
        </body>
      </html>
    </ClerkProvider>
  );
}
