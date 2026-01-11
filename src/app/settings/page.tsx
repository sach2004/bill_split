'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Save, User, QrCode, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingDots } from '@/components/animations/LoadingDots'
import { PageTransition } from '@/components/animations/PageTransition'
import { useUser } from '@clerk/nextjs'

export default function SettingsPage() {
  const router = useRouter()
  const { user, isLoaded } = useUser()
  const [userUpi, setUserUpi] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (isLoaded && user) {
      setUserUpi(user.defaultUpi || '')
    }
  }, [user, isLoaded])

  const handleSave = async () => {
    if (!user) {
      alert('Please sign in to save your settings')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defaultUpi: userUpi.trim() }),
      })

      const result = await response.json()
      
      if (result.success) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        alert(result.error || 'Failed to save')
      }
    } catch (error) {
      console.error('Save profile error:', error)
      alert('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="text-center">
            <LoadingDots />
            <p className="mt-4 text-gray-600">Loading settings...</p>
          </div>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="min-h-screen p-4 md:p-6">
        <header className="max-w-2xl mx-auto mb-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
            Back to Dashboard
          </button>
        </header>

        <main className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                    <User size={24} className="text-white" />
                  </div>
                  <div>
                    <CardTitle>Profile Settings</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Set your UPI ID to receive payments
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your UPI ID
                  </label>
                  <div className="flex gap-3">
                    <Input
                      value={userUpi}
                      onChange={(e) => setUserUpi(e.target.value)}
                      placeholder="yourname@upi"
                      disabled={saving}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setUserUpi('')}
                      disabled={saving}
                    >
                      <QrCode size={20} />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Examples: yourname@upi, phone@paytm, yourid@ybl
                  </p>
                </div>

                <div className="p-4 bg-indigo-50 rounded-2xl">
                  <h4 className="font-semibold text-indigo-900 mb-2">What is UPI ID?</h4>
                  <ul className="text-sm text-indigo-700 space-y-1">
                    <li>• Your unique identifier for receiving UPI payments</li>
                    <li>• Provided by your bank or UPI app</li>
                    <li>• Found in PhonePe, Google Pay, Paytm settings</li>
                    <li>• Share it with others who need to pay you</li>
                  </ul>
                </div>

                <motion.div whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    size="lg"
                    className="w-full h-14 text-lg rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600"
                  >
                    {saving ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Saving...
                      </>
                    ) : saved ? (
                      <>
                        <CheckCircle2 className="mr-2" />
                        Saved!
                      </>
                    ) : (
                      <>
                        <Save className="mr-2" />
                        Save Settings
                      </>
                    )}
                  </Button>
                </motion.div>

                <div className="p-4 bg-amber-50 rounded-2xl border-2 border-amber-200">
                  <h4 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                    <QrCode size={18} />
                    How to get your UPI ID?
                  </h4>
                  <ol className="text-sm text-amber-800 space-y-2 list-decimal list-inside">
                    <li className="ml-4">Open PhonePe → Go to Profile → Payment Address</li>
                    <li className="ml-4">Open Google Pay → Go to Profile → Bank Account</li>
                    <li className="ml-4">Open Paytm → Go to Profile → Payment Settings</li>
                    <li className="ml-4">Copy the UPI ID and paste it above</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </main>
      </div>
    </PageTransition>
  )
}
