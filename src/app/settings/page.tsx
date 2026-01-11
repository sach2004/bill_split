'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Save, User, QrCode, ArrowLeft, Loader2, LogOut } from 'lucide-react'
import { useClerk, useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'

export default function SettingsPage() {
  const router = useRouter()
  const { user, isLoaded } = useUser()
  const { signOut } = useClerk()
  const [userUpi, setUserUpi] = useState('')
  const [userPhone, setUserPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isLoaded) fetchProfile()
  }, [isLoaded])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.user) {
          setUserPhone(result.user.phone || '')
          setUserUpi(result.user.defaultUpi || '')
        }
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!userPhone.trim()) {
      toast('Phone number required', 'error')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: userPhone.trim(),
          defaultUpi: userUpi.trim() || null
        }),
      })

      if (response.ok) {
        toast('Settings saved!', 'success')
      } else {
        toast('Failed to save', 'error')
      }
    } catch (error) {
      toast('Failed to save', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    toast('Signed out', 'success')
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="sticky top-0 z-50 glass border-b border-white/10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 text-white font-semibold hover:text-indigo-400">
            <ArrowLeft className="w-5 h-5" />Back
          </button>
          <Button onClick={handleSignOut} variant="outline" size="sm" className="rounded-full border-white/20 text-white hover:bg-white/10">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <main className="relative z-10 max-w-3xl mx-auto px-4 py-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="glass rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Settings</h1>
                  <p className="text-indigo-100 text-sm">Payment info</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {user && (
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                      {user.firstName?.substring(0, 2).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{user.firstName} {user.lastName}</p>
                      <p className="text-sm text-gray-400">{user.emailAddresses[0]?.emailAddress}</p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Phone *</label>
                <Input
                  type="tel"
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  disabled={saving}
                  className="h-14 glass border-white/20 text-white placeholder:text-gray-500"
                />
                <p className="text-xs text-gray-400 mt-2">Required for payments</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">UPI ID</label>
                <Input
                  value={userUpi}
                  onChange={(e) => setUserUpi(e.target.value)}
                  placeholder="yourname@paytm"
                  disabled={saving}
                  className="h-14 glass border-white/20 text-white placeholder:text-gray-500"
                />
                <p className="text-xs text-gray-400 mt-2">Optional</p>
              </div>

              <div className="p-4 bg-indigo-500/20 rounded-2xl border border-indigo-500/30">
                <h4 className="font-bold text-indigo-300 mb-2 flex items-center gap-2">
                  <QrCode className="w-5 h-5" />Get UPI ID
                </h4>
                <ul className="text-sm text-indigo-200 space-y-1">
                  <li>• PhonePe → Profile → Payment Address</li>
                  <li>• Google Pay → Profile → Bank Account</li>
                  <li>• Paytm → Profile → Payment Settings</li>
                </ul>
              </div>

              <Button
                onClick={handleSave}
                disabled={saving || !userPhone.trim()}
                size="lg"
                className="w-full h-16 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 glow"
              >
                {saving ? <><Loader2 className="mr-2 animate-spin" />Saving...</> : <><Save className="mr-2" />Save</>}
              </Button>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
