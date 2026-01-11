'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Copy, QrCode, Scan, Smartphone, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/calculations'
import { QrReader } from 'react-qr-scanner'

interface PaymentButtonProps {
  amount: number
  recipientName: string
  recipientUpi: string
  onPay: () => void
  hasRazorpay: boolean
  isPaying?: boolean
  payingUserName?: string
}

export function PaymentButton({ 
  amount, 
  recipientName, 
  recipientUpi, 
  onPay,
  hasRazorpay,
  isPaying = false,
  payingUserName
}: PaymentButtonProps) {
  const [showFallback, setShowFallback] = useState(false)
  const [copied, setCopied] = useState(false)
  const [userUpi, setUserUpi] = useState('')
  const [scanResult, setScanResult] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [manualPaid, setManualPaid] = useState(false)
  const [isProcessingManual, setIsProcessingManual] = useState(false)

  const upiLink = `upi://pay?pa=${recipientUpi}&pn=${encodeURIComponent(recipientName)}&am=${amount}&cu=INR`

  const handleCopyUpi = async () => {
    await navigator.clipboard.writeText(recipientUpi)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyUpiLink = async () => {
    await navigator.clipboard.writeText(upiLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Pay ${formatCurrency(amount)} to ${recipientName}`,
          text: `Please pay ${formatCurrency(amount)} to ${recipientName} via UPI`,
          url: upiLink,
        })
      } catch (err) {
        console.error('Share failed:', err)
      }
    }
  }

  const handleManualPay = async () => {
    if (!userUpi.trim()) {
      alert('Please enter your UPI ID')
      return
    }

    setIsProcessingManual(true)
    try {
      await onPay()
      setManualPaid(true)
    } catch (error) {
      console.error('Manual pay error:', error)
      alert('Payment processing failed. Please try again.')
    } finally {
      setIsProcessingManual(false)
    }
  }

  const handleScanResult = (result: string | null) => {
    if (result) {
      setScanResult(result)
      setIsScanning(false)
      setUserUpi(result)
    }
  }

  const handleScanError = (error: any) => {
    console.error('QR scan error:', error)
  }

  if (manualPaid) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Check size={40} className="text-white" />
          </motion.div>
          <h3 className="text-2xl font-bold mb-2">Payment Initiated!</h3>
          <p className="text-gray-600 mb-6">
            You can complete the payment via:
          </p>
          <div className="space-y-3 text-left">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <Smartphone className="w-6 h-6 text-indigo-600" />
              <div>
                <p className="font-medium text-sm">UPI Apps</p>
                <p className="text-xs text-gray-600">PhonePe, GPay, Paytm</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <Copy className="w-6 h-6 text-indigo-600" />
              <div>
                <p className="font-medium text-sm">Recipient UPI ID</p>
                <p className="text-xs text-indigo-600 font-mono">{recipientUpi}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {isPaying && payingUserName && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl p-4 text-center shadow-lg"
        >
          <p className="font-semibold">
            🎉 {payingUserName} is paying {formatCurrency(amount)}!
          </p>
          <p className="text-sm text-indigo-100">Wait for payment confirmation...</p>
        </motion.div>
      )}

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="text-center">
            <p className="text-gray-600 text-sm mb-1">You need to pay</p>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-5xl font-bold text-indigo-600 mb-4"
            >
              {formatCurrency(amount)}
            </motion.div>
          </div>

          {hasRazorpay ? (
            <motion.div
              whileTap={{ scale: 0.98 }}
              className="space-y-3"
            >
              <Button
                onClick={onPay}
                size="lg"
                disabled={isPaying}
                className="w-full h-14 text-lg rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
              >
                <Smartphone className="mr-2" />
                Pay via UPI Apps
              </Button>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={handleCopyUpiLink}
                  className="h-12 rounded-xl"
                >
                  {copied ? (
                    <>
                      <Check className="mr-2" size={18} />
                      Link Copied
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2" size={18} />
                      Copy Link
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleShare}
                  className="h-12 rounded-xl"
                >
                  <QrCode className="mr-2" size={18} />
                  Share
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              whileTap={{ scale: 0.98 }}
              className="space-y-3"
            >
              <Button
                onClick={() => setShowFallback(true)}
                size="lg"
                disabled={isPaying}
                className="w-full h-14 text-lg rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
              >
                <Smartphone className="mr-2" />
                Pay Now
              </Button>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={handleCopyUpi}
                  className="h-12 rounded-xl"
                >
                  {copied ? (
                    <>
                      <Check className="mr-2" size={18} />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2" size={18} />
                      Copy UPI
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleShare}
                  className="h-12 rounded-xl"
                >
                  <QrCode className="mr-2" size={18} />
                  Share
                </Button>
              </div>
            </motion.div>
          )}

          <div className="p-4 bg-indigo-50 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Recipient</span>
              <span className="font-semibold text-gray-900">{recipientName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">UPI ID</span>
              <span className="font-mono text-sm text-indigo-600">{recipientUpi}</span>
            </div>
          </div>

          <div className="text-center text-xs text-gray-500">
            <p>Payment is secure via UPI</p>
          </div>
        </CardContent>
      </Card>

      <AnimatePresence>
        {showFallback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowFallback(false)}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold">Payment Options</h3>
                <button
                  onClick={() => setShowFallback(false)}
                  className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your UPI ID
                  </label>
                  <Input
                    value={userUpi}
                    onChange={(e) => setUserUpi(e.target.value)}
                    placeholder="yourname@upi"
                    disabled={isProcessingManual}
                  />
                  {scanResult && (
                    <p className="text-sm text-green-600 mt-2">
                      ✓ Scanned from QR code
                    </p>
                  )}
                </div>

                <div className="flex gap-3">
                  <motion.div whileTap={{ scale: 0.95 }} className="flex-1">
                    <Button
                      onClick={() => setIsScanning(!isScanning)}
                      variant="outline"
                      disabled={isProcessingManual}
                      className="w-full h-12 rounded-xl"
                    >
                      <Scan className="mr-2" size={18} />
                      {isScanning ? 'Stop Scan' : 'Scan QR'}
                    </Button>
                  </motion.div>

                  <motion.div whileTap={{ scale: 0.95 }} className="flex-1">
                    <Button
                      onClick={handleManualPay}
                      disabled={isProcessingManual || !userUpi.trim()}
                      className="w-full h-12 rounded-xl"
                    >
                      {isProcessingManual ? (
                        <>
                          <Loader2 className="mr-2 animate-spin" size={18} />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Check className="mr-2" size={18} />
                          Confirm Payment
                        </>
                      )}
                    </Button>
                  </motion.div>
                </div>

                {isScanning && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-gray-900 rounded-2xl p-4"
                  >
                    <div className="text-center">
                      <p className="text-white font-medium mb-3">
                        Scan recipient's UPI QR code
                      </p>
                      <div className="w-full bg-black rounded-xl overflow-hidden">
                        <QrReader
                          onResult={handleScanResult}
                          onError={handleScanError}
                          style={{ width: '100%' }}
                          constraints={{
                            facingMode: 'environment',
                          }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="p-4 bg-amber-50 rounded-2xl text-sm">
                  <p className="font-medium text-amber-800 mb-1">
                    💡 After confirming payment:
                  </p>
                  <p className="text-amber-700">
                    1. Open your UPI app (PhonePe, GPay, Paytm)
                    <br />
                    2. Pay {formatCurrency(amount)} to {recipientName}
                    <br />
                    3. Share screenshot with group to confirm
                  </p>
                </div>

                <Button
                  variant="ghost"
                  onClick={() => setShowFallback(false)}
                  className="w-full h-12 rounded-xl"
                  disabled={isProcessingManual}
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
