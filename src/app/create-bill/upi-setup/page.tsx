'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { QrCode, ArrowRight, Sparkles } from 'lucide-react'
import { toast } from '@/components/ui/toast'

export default function UpiSetupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const billId = searchParams.get('billId')
  
  const [upiId, setUpiId] = useState('')
  const [saving, setSaving] = useState(false)

  const handleContinue = async () => {
    setSaving(true)
    try {
      if (upiId.trim()) {
        const response = await fetch('/api/user/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ defaultUpi: upiId.trim() }),
        })
        if (response.ok) {
          toast('UPI ID saved!', 'success')
        }
      }
      router.push(`/bill/${billId}`)
    } catch (error) {
      router.push(`/bill/${billId}`)
    } finally {
      setSaving(false)
    }
  }

  const handleSkip = () => {
    router.push(`/bill/${billId}`)
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
          <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-6 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <QrCode className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Set Up Payment</h1>
            <p className="text-indigo-100 text-sm">Add your UPI ID so others can pay you</p>
          </div>

          <div className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
                Your UPI ID
              </label>
              <Input
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="yourname@paytm"
                className="h-14 text-base glass border-white/20 text-white placeholder:text-gray-500"
              />
              <p className="text-xs text-gray-400 mt-2">
                Example: 9876543210@paytm, yourname@ybl
              </p>
            </div>

            <div className="p-4 bg-indigo-500/20 rounded-2xl border border-indigo-500/30">
              <p className="text-sm text-indigo-200 flex items-start gap-2">
                <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-indigo-100">Tip:</strong> Your phone is already saved. Adding UPI makes payments easier.
                </span>
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleContinue}
                disabled={saving}
                size="lg"
                className="w-full h-14 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg"
              >
                {saving ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="mr-2"
                    >
                      <Sparkles className="w-5 h-5" />
                    </motion.div>
                    Saving...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </>
                )}
              </Button>

              <Button
                onClick={handleSkip}
                variant="outline"
                size="lg"
                className="w-full h-12 rounded-2xl border-white/20 text-white hover:bg-white/10"
              >
                Skip for Now
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
