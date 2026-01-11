'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams, useRouter } from 'next/navigation'
import { Share2, Plus, CheckCircle2, Copy, AlertCircle, Loader2, CreditCard, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingDots } from '@/components/animations/LoadingDots'
import { PageTransition } from '@/components/animations/PageTransition'
import { BillItemComponent } from '@/components/bill/BillItem'
import { ParticipantAvatar } from '@/components/bill/ParticipantAvatar'
import { PaymentButton } from '@/components/bill/PaymentButton'
import { formatCurrency, calculateParticipantShare } from '@/lib/calculations'
import { BillItem as StoreBillItem } from '@/store/billStore'

interface BillData {
  id: string
  shareId: string
  title: string
  totalAmount: number
  restaurantName?: string
  status: string
  items: Array<StoreBillItem & { selected?: boolean }>
  participants: Array<{
    id: string
    name: string
    phone?: string
    userId?: string
    theirShare: number
    isPaid: boolean
    items: Array<{ itemId: string }>
  }>
  createdBy?: {
    id: string
    name: string
    email: string
    defaultUpi?: string
  } | null
}

interface PayingStatus {
  billId: string
  participantId: string
  userName: string
  amount: number
  timestamp: string
}

export default function BillPage() {
  const params = useParams()
  const router = useRouter()
  const shareId = params.shareId as string

  const [bill, setBill] = useState<BillData | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [userName, setUserName] = useState('')
  const [userPhone, setUserPhone] = useState('')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [copied, setCopied] = useState(false)
  const [payingStatus, setPayingStatus] = useState<PayingStatus | null>(null)
  const [hasRazorpay, setHasRazorpay] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedParticipant, setSelectedParticipant] = useState<{ name: string; share: number; id: string } | null>(null)

  useEffect(() => {
    fetchBill()
    checkRazorpayConfig()
    const interval = setInterval(fetchBill, 10000)
    return () => clearInterval(interval)
  }, [shareId])

  const checkRazorpayConfig = () => {
    setHasRazorpay(!!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID && !!process.env.RAZORPAY_KEY_SECRET)
  }

  const fetchBill = async () => {
    try {
      const response = await fetch(`/api/bill/${shareId}`)
      const result = await response.json()
      
      if (result.success) {
        setBill(result.bill)
      }
    } catch (error) {
      console.error('Fetch bill error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinBill = async () => {
    if (!userName.trim()) {
      alert('Please enter your name')
      return
    }

    setJoining(true)
    try {
      const response = await fetch(`/api/bill/${shareId}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userName.trim(),
          phone: userPhone || undefined,
          itemIds: selectedItems,
        }),
      })

      const result = await response.json()
      
      if (result.success) {
        setShowJoinModal(false)
        fetchBill()
      } else {
        alert(result.error || 'Failed to join bill')
      }
    } catch (error) {
      console.error('Join bill error:', error)
      alert('Failed to join bill')
    } finally {
      setJoining(false)
    }
  }

  const handleToggleItem = (itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/bill/${shareId}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePay = (participantName: string) => {
    const recipient = bill?.participants.find(p => p.name === participantName)
    if (!recipient || !bill?.createdBy) return

    const amount = recipient.theirShare
    const share = calculateParticipantShare(
      bill.items,
      recipient.items.map(i => ({ itemId: i.itemId, quantity: 1 })),
      bill.totalAmount,
      bill.items.reduce((sum, item) => sum + item.price, 0)
    )

    setSelectedParticipant({
      name: participantName,
      share,
      id: recipient.id,
    })
    setShowPaymentModal(true)
  }

  const handlePaymentConfirm = async (paymentMethod: 'RAZORPAY' | 'MANUAL_UPI', payerUpi?: string) => {
    if (!selectedParticipant || !bill?.createdBy?.id) return

    try {
      const response = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: selectedParticipant.share,
          billId: bill.id,
          toUserId: bill.createdBy.id,
          paymentMethod,
          payerUpi,
        }),
      })

      const result = await response.json()
      
      if (result.success) {
        if (result.order && hasRazorpay) {
          const options = {
            key: result.keyId,
            amount: result.order.amount,
            currency: 'INR',
            name: bill.title,
            description: `Payment for ${selectedParticipant.name}`,
            order_id: result.order.id,
            prefill: {
              name: selectedParticipant.name,
            },
            theme: {
              color: '#6366f1',
            },
            handler: function(response: any) {
              if (response.razorpay_payment_id) {
                alert('Payment successful!')
                setShowPaymentModal(false)
                fetchBill()
              }
            },
            modal: {
              ondismiss: function() {
                console.log('Payment modal closed')
              },
            },
          }

          const razorpay = new (window as any).Razorpay(options)
          razorpay.open()
        } else {
          alert('Payment recorded! Please complete payment manually.')
          setShowPaymentModal(false)
          fetchBill()
        }
      } else {
        alert(result.error || 'Failed to initiate payment')
      }
    } catch (error) {
      console.error('Payment error:', error)
      alert('Payment failed. Please try again.')
    }
  }

  const handleMarkAsPaying = async () => {
    if (!selectedParticipant || !bill?.createdBy?.id) return

    try {
      const response = await fetch(`/api/bill/${shareId}/paying-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billId: bill.id,
          participantId: selectedParticipant.id,
          userName: selectedParticipant.name,
          amount: selectedParticipant.share,
        }),
      })

      const result = await response.json()
      
      if (result.success) {
        alert('Broadcasting payment status to all participants!')
      } else {
        alert(result.error || 'Failed to mark as paying')
      }
    } catch (error) {
      console.error('Mark paying error:', error)
      alert('Failed to mark as paying')
    }
  }

  if (loading) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="text-center">
            <LoadingDots />
            <p className="mt-4 text-gray-600">Loading bill...</p>
          </div>
        </div>
      </PageTransition>
    )
  }

  if (!bill) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center p-6">
          <Card className="max-w-md p-8 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-2xl font-bold mb-2">Bill Not Found</h2>
            <p className="text-gray-600 mb-6">
              This bill doesn't exist or has been deleted
            </p>
            <Button onClick={() => router.push('/')} variant="outline">
              Go Home
            </Button>
          </Card>
        </div>
      </PageTransition>
    )
  }

  const billItemsTotal = bill.items.reduce((sum, item) => sum + item.price, 0)
  const currentUser = bill.participants.find(p => p.items && p.items.length > 0)

  const getParticipantClassName = (isPaid: boolean, isSelected: boolean) => {
    const baseClasses = "text-center p-4 rounded-2xl cursor-pointer transition-all "
    if (isPaid) {
      return baseClasses + "bg-green-50 border-2 border-green-200"
    } else if (isSelected) {
      return baseClasses + "bg-indigo-100 border-2 border-indigo-500"
    } else {
      return baseClasses + "bg-gray-50 border-2 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50"
    }
  }

  return (
    <PageTransition>
      <div className="min-h-screen p-4 md:p-6">
        <header className="max-w-6xl mx-auto mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              ← Back
            </button>
            <div className="flex items-center gap-3">
              {!hasRazorpay && (
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-full">
                  <CreditCard size={16} />
                  <span className="text-sm font-medium">Manual Payment</span>
                </div>
              )}
              <Button
                variant="outline"
                onClick={handleCopyLink}
                className="rounded-full"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Share2 className="mr-2" />
                    Share
                  </>
                )}
              </Button>
            </div>
          </div>
        </header>

        {payingStatus && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto mb-6"
          >
            <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Smartphone className="w-8 h-8 animate-bounce" />
                  <div className="flex-1">
                    <p className="font-bold text-lg">
                      🎉 {payingStatus.userName} is paying {formatCurrency(payingStatus.amount)}!
                    </p>
                    <p className="text-green-100 text-sm">
                      Complete payment to confirm
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <main className="max-w-6xl mx-auto">
          <div className="mb-6">
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                <CardTitle className="text-white text-2xl">
                  {bill.title}
                </CardTitle>
                <div className="flex items-center gap-4 text-indigo-100 mt-2">
                  {bill.restaurantName && (
                    <span className="flex items-center gap-1">
                      <span className="text-sm">{bill.restaurantName}</span>
                    </span>
                  )}
                  <span className="text-sm">
                    {bill.participants.length}/10 participants
                  </span>
                  {hasRazorpay ? (
                    <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                      UPI Ready
                    </span>
                  ) : (
                    <span className="text-xs bg-amber-300/30 px-2 py-1 rounded-full">
                      Manual Payment
                    </span>
                  )}
                </div>
              </CardHeader>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Bill Items</CardTitle>
                    {!currentUser && (
                      <motion.div whileTap={{ scale: 0.95 }}>
                        <Button
                          onClick={() => setShowJoinModal(true)}
                          size="sm"
                          className="rounded-full"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Join & Select Items
                        </Button>
                      </motion.div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                      {bill.items.map((item, index) => (
                        <BillItemComponent
                          key={item.id}
                          item={{
                            ...item,
                            selected: selectedItems.includes(item.id),
                          }}
                          participantId={currentUser?.id}
                          onToggle={() => handleToggleItem(item.id)}
                        />
                      ))}
                    </AnimatePresence>
                  </div>

                  <div className="mt-6 pt-4 border-t-2 border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Items Total</span>
                      <span className="font-bold text-xl">
                        {formatCurrency(billItemsTotal)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Bill Total</span>
                      <span className="font-bold text-2xl text-indigo-600">
                        {formatCurrency(bill.totalAmount)}
                      </span>
                    </div>
                  </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Participants</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {bill.participants.map((participant, index) => {
                      const share = calculateParticipantShare(
                        bill.items,
                        participant.items.map(i => ({ itemId: i.itemId, quantity: 1 })),
                        bill.totalAmount,
                        billItemsTotal
                      )

                      return (
                        <motion.div
                          key={participant.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => !participant.isPaid && handlePay(participant.name)}
                          className={getParticipantClassName(participant.isPaid, false)}
                        >
                          <ParticipantAvatar
                            name={participant.name}
                            phone={participant.phone}
                            isPaid={participant.isPaid}
                          />
                          <div className="mt-2">
                            <p className="font-semibold text-sm">{participant.name}</p>
                            <p className="font-bold text-indigo-600">
                              {formatCurrency(share)}
                            </p>
                            {participant.isPaid && (
                              <p className="text-xs text-green-600 mt-1">Paid</p>
                            )}
                            {!participant.isPaid && !payingStatus && (
                              <p className="text-xs text-gray-500 mt-1">Tap to pay</p>
                            )}
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-4">Payment Status</h3>
                  
                  <div className="space-y-3">
                    {hasRazorpay ? (
                      <div className="p-4 bg-green-50 rounded-2xl border-2 border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                          <span className="font-semibold text-green-700">UPI Payments Available</span>
                        </div>
                        <p className="text-sm text-green-600">
                          Pay via PhonePe, Google Pay, Paytm directly
                        </p>
                      </div>
                    ) : (
                      <div className="p-4 bg-amber-50 rounded-2xl border-2 border-amber-200">
                        <div className="flex items-center gap-2 mb-2">
                          <CreditCard className="w-5 h-5 text-amber-600" />
                          <span className="font-semibold text-amber-700">Manual UPI Payment</span>
                        </div>
                        <p className="text-sm text-amber-600">
                          Scan QR or enter UPI ID manually
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="mt-6 p-4 bg-gray-50 rounded-2xl">
                    <p className="text-sm text-gray-600">
                      <strong>Creator:</strong> {bill.createdBy?.name || 'Unknown'}
                    </p>
                    {bill.createdBy?.defaultUpi && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600 mb-1">Recipient UPI ID:</p>
                        <p className="font-mono text-indigo-600 text-sm">{bill.createdBy.defaultUpi}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>

        <AnimatePresence>
          {showJoinModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowJoinModal(false)}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl p-6 w-full max-w-md"
              >
                <h3 className="text-2xl font-bold mb-4">Join This Bill</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Name *
                    </label>
                    <Input
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone (Optional)
                    </label>
                    <Input
                      type="tel"
                      value={userPhone}
                      onChange={(e) => setUserPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select items you ordered
                    </label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {bill.items.map((item) => {
                        const isSelected = selectedItems.includes(item.id)
                        return (
                          <motion.div
                            key={item.id}
                            onClick={() => handleToggleItem(item.id)}
                            className={isSelected ? "flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all bg-indigo-100 border-2 border-indigo-500" : "flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all bg-gray-50 border-2 border-gray-200"}
                          >
                            <span className="flex-1 text-sm">{item.name}</span>
                            <span className="font-mono text-sm">
                              {formatCurrency(item.price)}
                            </span>
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>

                  <Button
                    onClick={handleJoinBill}
                    disabled={joining || !userName.trim() || selectedItems.length === 0}
                    size="lg"
                    className="w-full h-12 rounded-2xl"
                  >
                    {joining ? (
                      <>
                        <Loader2 className="mr-2 animate-spin" />
                        Joining...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2" />
                        Join & Calculate
                      </>
                    )}
                  </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showPaymentModal && selectedParticipant && bill?.createdBy && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPaymentModal(false)}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl p-6 w-full max-w-md"
              >
                <h3 className="text-2xl font-bold mb-2">Payment for {selectedParticipant.name}</h3>
                <p className="text-gray-600 mb-6">
                  Amount: <span className="font-bold text-indigo-600">{formatCurrency(selectedParticipant.share)}</span>
                </p>
                
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">Choose payment method:</p>
                  
                  {hasRazorpay && (
                    <motion.div whileTap={{ scale: 0.98 }}>
                      <Button
                        onClick={() => handlePaymentConfirm('RAZORPAY')}
                        size="lg"
                        className="w-full h-14 text-lg rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600"
                      >
                        <Smartphone className="mr-2" />
                        Pay via UPI (Razorpay)
                      </Button>
                    </motion.div>
                  )}

                  <motion.div whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={() => handlePaymentConfirm('MANUAL_UPI')}
                      variant="outline"
                      size="lg"
                      className="w-full h-14 text-lg rounded-2xl"
                    >
                      <CreditCard className="mr-2" />
                      Manual UPI Payment
                    </Button>
                  </motion.div>

                  {bill.createdBy?.defaultUpi && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-xl">
                      <p className="text-sm text-gray-600 mb-1">Recipient UPI ID:</p>
                      <p className="font-mono text-indigo-600 text-sm">{bill.createdBy.defaultUpi}</p>
                    </div>
                  )}

                  <Button
                    variant="ghost"
                    onClick={() => setShowPaymentModal(false)}
                    className="w-full h-12 rounded-xl mt-4"
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  )
}
