'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Camera, Users, Shield, Zap, LogIn } from 'lucide-react'
import { PageTransition } from '@/components/animations/PageTransition'

export default function Home() {
  return (
    <PageTransition>
      <main className="min-h-screen flex flex-col">
        <header className="p-6">
          <nav className="max-w-6xl mx-auto flex items-center justify-between">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-2"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">₹</span>
              </div>
              <span className="font-bold text-xl text-gray-900">SplitBills</span>
            </motion.div>
            
            <Link href="/dashboard">
              <Button variant="outline" className="rounded-full">
                Dashboard
              </Button>
            </Link>
          </nav>
        </header>

        <section className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Split Bills,
                <br />
                Split Headaches
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">
                Upload your restaurant bill, let AI extract items, and share with friends.
                Pay securely via UPI - all in one app!
              </p>
            </motion.div>
            
            <div className="flex gap-3">
              <Link href="/create-bill">
                <Button size="lg" className="h-14 px-8 text-lg rounded-2xl w-full sm:w-auto">
                  <Camera className="mr-2" size={24} />
                  Start Splitting
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button variant="outline" size="lg" className="h-14 px-8 text-lg rounded-2xl">
                  <LogIn className="mr-2" size={24} />
                  Sign In
                </Button>
              </Link>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-16">
              {[
                {
                  icon: Camera,
                  title: "AI Bill Scanning",
                  description: "Just snap a photo and our AI extracts all items, prices, and details automatically",
                  color: "from-indigo-500 to-blue-600",
                },
                {
                  icon: Users,
                  title: "Easy Sharing",
                  description: "Share bills with up to 10 friends via a simple link - no app downloads needed",
                  color: "from-purple-500 to-pink-600",
                },
                {
                  icon: Shield,
                  title: "UPI Payments",
                  description: "Pay securely with your favorite UPI app - PhonePe, Google Pay, Paytm",
                  color: "from-amber-500 to-orange-600",
                },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1, duration: 0.6 }}
                  className="bg-white rounded-3xl p-6 shadow-lg hover:shadow-xl transition-shadow"
                >
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 mx-auto`}>
                    <feature.icon size={32} className="text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-gray-900">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-3xl p-8"
            >
              <h2 className="text-2xl font-bold mb-4 text-gray-900">
                How it works
              </h2>
              <div className="grid md:grid-cols-4 gap-6 text-left">
                {[
                  "Upload bill photo",
                  "AI extracts items",
                  "Share with friends",
                  "Everyone pays via UPI",
                ].map((step, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    className="relative"
                  >
                    <div className="w-12 h-12 bg-indigo-500 text-white rounded-full flex items-center justify-center font-bold text-xl mb-3">
                      {index + 1}
                    </div>
                    <p className="text-gray-700 font-medium">{step}</p>
                    {index < 3 && (
                      <div className="hidden md:block absolute top-6 -right-3 w-6 h-0.5 bg-indigo-300" />
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </PageTransition>
  )
}
