'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Smartphone, Sparkles, ArrowRight } from 'lucide-react'
import { toast } from '@/components/ui/toast'

export default function OnboardingPage() {
  const router = useRouter()
  const { user } = useUser()
  const [phone, setPhone] = useState('')
  const [upiId, setUpiId] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!phone.trim()) {
      toast('Phone number is required', 'error')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: phone.trim(),
          defaultUpi: upiId.trim() || undefined
        }),
      })

      const result = await response.json()
      
      if (result.success) {
        toast('Profile setup complete!', 'success')
        router.push('/dashboard')
      } else {
        toast(result.error || 'Failed to save', 'error')
      }
    } catch (error) {
      toast('Failed to save', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="w-full max-w-md relative z-10"
      >
        <div className="glass rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 text-center">
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <Smartphone className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome, {user?.firstName}!
            </h1>
            <p className="text-indigo-100">Let's set up your profile</p>
          </div>

          <div className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
                Phone Number *
              </label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="h-14 text-base glass border-white/20 text-white placeholder:text-gray-500"
              />
              <p className="text-xs text-gray-400 mt-2">
                Required for others to pay you
              </p>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
                UPI ID (Optional)
              </label>
              <Input
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="yourname@paytm"
                className="h-14 text-base glass border-white/20 text-white placeholder:text-gray-500"
              />
              <p className="text-xs text-gray-400 mt-2">
                You can add this later in settings
              </p>
            </div>

            <div className="p-4 bg-indigo-500/20 rounded-2xl border border-indigo-500/30">
              <p className="text-sm text-indigo-200 flex items-start gap-2">
                <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>We need this info so your friends can pay you back!</span>
              </p>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={saving || !phone.trim()}
              size="lg"
              className="w-full h-16 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg glow"
            >
              {saving ? 'Saving...' : (
                <>
                  Continue
                  <ArrowRight className="ml-2 w-5 h-5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
