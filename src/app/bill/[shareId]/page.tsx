'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams, useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Share2, Plus, CheckCircle2, Copy, AlertCircle, Loader2, Users, Wallet, Phone, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/calculations'
import { toast } from '@/components/ui/toast'

interface BillData {
  id: string
  shareId: string
  title: string
  totalAmount: number
  restaurantName?: string
  items: Array<{
    id: string
    name: string
    price: number
    quantity: number
    category?: string
  }>
  participants: Array<{
    id: string
    name: string
    phone?: string
    theirShare: number
    isPaid: boolean
    items: Array<{ itemId: string }>
  }>
  createdBy: {
    id: string
    name: string
    email: string
    phone?: string
    defaultUpi?: string
  } | null
}

export default function BillPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useUser()
  const shareId = params.shareId as string

  const [bill, setBill] = useState<BillData | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedParticipant, setSelectedParticipant] = useState<any>(null)
  const [userName, setUserName] = useState('')
  const [userPhone, setUserPhone] = useState('')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [copied, setCopied] = useState(false)
  const [myParticipantId, setMyParticipantId] = useState<string | null>(null)

  useEffect(() => {
    if (user && showJoinModal) {
      const fullName = user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}`.trim()
        : user.firstName || user.username || ''
      setUserName(fullName)
      setUserPhone(user.phoneNumbers?.[0]?.phoneNumber || '')
    }
  }, [user, showJoinModal])

  useEffect(() => {
    if (shareId) {
      fetchBill()
      const interval = setInterval(fetchBill, 10000)
      return () => clearInterval(interval)
    }
  }, [shareId])

  const fetchBill = async () => {
    try {
      const response = await fetch(`/api/bill/${shareId}`)
      if (!response.ok) {
        setLoading(false)
        return
      }
      const result = await response.json()
      if (result.success && result.bill) {
        setBill(result.bill)
        // Remember participant ID from localStorage
        const savedName = localStorage.getItem(`bill-${shareId}-name`)
        const participant = result.bill.participants.find((p: any) => p.name === savedName)
        if (participant) {
          setMyParticipantId(participant.id)
          setUserName(savedName || '')
        }
      }
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinBill = async () => {
    if (!userName.trim()) {
      toast('Please enter your name', 'error')
      return
    }
    if (selectedItems.length === 0) {
      toast('Select at least one item', 'error')
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
        // Save name to localStorage
        localStorage.setItem(`bill-${shareId}-name`, userName.trim())
        setMyParticipantId(result.participant.id)
        setShowJoinModal(false)
        setSelectedItems([])
        fetchBill()
        toast('Successfully joined!', 'success')
      } else {
        toast(result.error || 'Failed to join', 'error')
      }
    } catch (error) {
      toast('Failed to join', 'error')
    } finally {
      setJoining(false)
    }
  }

  const handleToggleItem = (itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    )
  }

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/bill/${shareId}`)
    setCopied(true)
    toast('Link copied!', 'success')
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePay = (participant: any) => {
    // Only allow if it's the user's own participant
    if (participant.id !== myParticipantId) {
      toast('You can only pay for yourself', 'error')
      return
    }
    setSelectedParticipant(participant)
    setShowPaymentModal(true)
  }

  const handleMarkAsPaid = async () => {
    if (!selectedParticipant) return
    try {
      const response = await fetch(`/api/bill/${shareId}/mark-paid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId: selectedParticipant.id }),
      })
      if (response.ok) {
        setShowPaymentModal(false)
        setSelectedParticipant(null)
        fetchBill()
        toast('Marked as paid!', 'success')
      } else {
        toast('Failed to mark as paid', 'error')
      }
    } catch (error) {
      toast('Error', 'error')
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast(`${label} copied!`, 'success')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-400" />
      </div>
    )
  }

  if (!bill) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass rounded-3xl p-8 text-center max-w-sm border border-white/10">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h2 className="text-2xl font-bold text-white mb-2">Bill Not Found</h2>
          <p className="text-gray-400 mb-6 text-sm">This bill doesn&apos;t exist</p>
          <Button onClick={() => router.push('/')} className="rounded-full w-full bg-gradient-to-r from-indigo-600 to-purple-600">Go Home</Button>
        </div>
      </div>
    )
  }

  const hasJoined = !!myParticipantId
  const hasCreatorInfo = bill.createdBy && bill.createdBy.name && (bill.createdBy.phone || bill.createdBy.defaultUpi)

  return (
    <div className="min-h-screen pb-20">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-40 glass border-b border-white/10">
        <div className="max-w-6xl mx-auto px-3 py-3 flex justify-between items-center">
          <button onClick={() => router.push('/')} className="font-semibold text-sm text-white">← Home</button>
          <Button variant="outline" onClick={handleCopyLink} size="sm" className="rounded-full border-white/20 text-white hover:bg-white/10">
            {copied ? <CheckCircle2 className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <main className="relative z-10 max-w-6xl mx-auto px-3 py-4">
        {/* Hero */}
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-5 shadow-2xl mb-4 glow">
          <h1 className="text-2xl font-bold text-white mb-2">{bill.title}</h1>
          <div className="flex flex-wrap gap-3 text-sm text-white/90">
            {bill.restaurantName && <span>📍 {bill.restaurantName}</span>}
            <span>👥 {bill.participants.length}/10</span>
            <span className="font-bold text-lg">{formatCurrency(bill.totalAmount)}</span>
          </div>
        </div>

        {/* Content */}
        <div className={hasCreatorInfo ? "grid lg:grid-cols-3 gap-4" : "max-w-3xl mx-auto"}>
          <div className={hasCreatorInfo ? "lg:col-span-2 space-y-4" : "space-y-4"}>
            {/* Items */}
            <div className="glass rounded-2xl border border-white/10">
              <div className="border-b border-white/10 p-4 flex justify-between items-center">
                <h2 className="font-bold text-white">Items</h2>
                {!hasJoined && bill.participants.length < 10 && (
                  <Button onClick={() => setShowJoinModal(true)} size="sm" className="rounded-full h-8 bg-gradient-to-r from-indigo-600 to-purple-600">
                    <Plus className="w-3 h-3 mr-1" />Join
                  </Button>
                )}
              </div>
              <div className="p-3 space-y-2">
                {bill.items.map(item => (
                  <div key={item.id} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                    <div className="flex-1 pr-2">
                      <p className="font-semibold text-white text-sm">{item.name}</p>
                      {item.category && <span className="text-xs bg-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-full capitalize">{item.category}</span>}
                    </div>
                    <p className="font-bold text-base text-indigo-400 font-mono">{formatCurrency(item.price)}</p>
                  </div>
                ))}
                <div className="mt-3 pt-3 border-t border-white/20 flex justify-between items-center p-3 bg-indigo-500/20 rounded-xl">
                  <span className="font-bold text-white">Total</span>
                  <span className="font-bold text-2xl text-indigo-400 font-mono">{formatCurrency(bill.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Participants */}
            <div className="glass rounded-2xl border border-white/10">
              <div className="border-b border-white/10 p-4">
                <h2 className="font-bold text-white">Participants ({bill.participants.length})</h2>
              </div>
              <div className="p-3">
                {bill.participants.length === 0 ? (
                  <div className="text-center py-10">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                    <p className="text-sm text-gray-400 mb-4">No one joined</p>
                    <Button onClick={() => setShowJoinModal(true)} size="sm" className="rounded-full bg-gradient-to-r from-indigo-600 to-purple-600">Join Now</Button>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {bill.participants.map(p => {
                      const isMyParticipant = p.id === myParticipantId
                      const canPay = isMyParticipant && !p.isPaid
                      
                      return (
                        <div key={p.id} className={`p-3 rounded-xl border-2 transition-all ${
                          p.isPaid 
                            ? 'bg-green-500/10 border-green-500/30' 
                            : isMyParticipant
                            ? 'bg-indigo-500/10 border-indigo-500/50 glow'
                            : 'bg-white/5 border-white/10'
                        }`}>
                          {p.isPaid && <div className="text-xs font-bold text-green-400 mb-2 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />PAID</div>}
                          {isMyParticipant && !p.isPaid && <div className="text-xs font-bold text-indigo-400 mb-2">YOU</div>}
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm ${
                              isMyParticipant 
                                ? 'bg-gradient-to-br from-indigo-500 to-purple-600' 
                                : 'bg-gradient-to-br from-gray-600 to-gray-700'
                            }`}>
                              {p.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm text-white truncate">{p.name}</p>
                              {p.phone && <p className="text-xs text-gray-400 truncate">{p.phone}</p>}
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <p className="font-bold text-lg text-indigo-400 font-mono">{formatCurrency(p.theirShare)}</p>
                            {canPay ? (
                              <Button onClick={() => handlePay(p)} size="sm" className="rounded-full h-8 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
                                <Wallet className="mr-1 w-3 h-3" />Pay
                              </Button>
                            ) : !isMyParticipant && !p.isPaid ? (
                              <div className="text-xs text-gray-500 px-3 py-1 bg-gray-700/50 rounded-full">Pending</div>
                            ) : null}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Creator */}
          {hasCreatorInfo && (
            <div className="glass rounded-2xl border border-white/10 lg:sticky lg:top-20 h-fit">
              <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-4 rounded-t-2xl">
                <h3 className="font-bold text-white">Creator</h3>
              </div>
              <div className="p-3 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center">
                    {bill.createdBy!.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-white truncate">{bill.createdBy!.name}</p>
                    <p className="text-xs text-gray-400 truncate">{bill.createdBy!.email}</p>
                  </div>
                </div>

                {bill.createdBy!.defaultUpi && (
                  <div className="p-3 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-bold text-xs text-indigo-300 flex items-center gap-1">
                        <CreditCard className="w-3 h-3" />UPI
                      </p>
                      <button onClick={() => copyToClipboard(bill.createdBy!.defaultUpi!, 'UPI')} className="px-2 py-1 bg-indigo-500 text-white rounded-lg text-xs font-bold">
                        Copy
                      </button>
                    </div>
                    <p className="font-mono text-indigo-300 font-bold text-xs break-all">{bill.createdBy!.defaultUpi}</p>
                  </div>
                )}

                {bill.createdBy!.phone && (
                  <div className="p-3 bg-green-500/20 rounded-xl border border-green-500/30">
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-bold text-xs text-green-300 flex items-center gap-1">
                        <Phone className="w-3 h-3" />Phone
                      </p>
                      <button onClick={() => copyToClipboard(bill.createdBy!.phone!, 'Phone')} className="px-2 py-1 bg-green-500 text-white rounded-lg text-xs font-bold">
                        Copy
                      </button>
                    </div>
                    <p className="font-mono text-green-300 font-bold text-xs">{bill.createdBy!.phone}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Join Modal */}
      <AnimatePresence>
        {showJoinModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center z-50" onClick={() => setShowJoinModal(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }} className="glass border-t border-white/20 rounded-t-3xl sm:rounded-3xl p-5 w-full sm:max-w-lg max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="w-12 h-1 bg-white/30 rounded-full mx-auto mb-4 sm:hidden" />
              <h3 className="text-2xl font-bold text-white mb-5">Join Bill</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">Name *</label>
                  <Input value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Your name" className="h-12 glass border-white/20 text-white placeholder:text-gray-500" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">Phone</label>
                  <Input value={userPhone} onChange={(e) => setUserPhone(e.target.value)} placeholder="+91 1234567890" className="h-12 glass border-white/20 text-white placeholder:text-gray-500" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">Select ({selectedItems.length})</label>
                  <div className="space-y-2 max-h-60 overflow-y-auto p-2 bg-black/30 rounded-xl">
                    {bill.items.map(item => (
                      <div
                        key={item.id}
                        onClick={() => handleToggleItem(item.id)}
                        className={`flex justify-between items-center p-3 rounded-lg cursor-pointer transition-all ${
                          selectedItems.includes(item.id)
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg'
                            : 'bg-white/5 border border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <span className="font-semibold text-sm text-white">{item.name}</span>
                        <span className="font-mono font-bold text-sm text-indigo-300">{formatCurrency(item.price)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <Button onClick={handleJoinBill} disabled={joining || !userName.trim() || selectedItems.length === 0} size="lg" className="w-full h-14 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                  {joining ? <><Loader2 className="mr-2 animate-spin" />Joining...</> : `Join (${selectedItems.length})`}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && selectedParticipant && bill.createdBy && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center z-50" onClick={() => setShowPaymentModal(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }} className="glass border-t border-white/20 rounded-t-3xl sm:rounded-3xl p-5 w-full sm:max-w-md" onClick={(e) => e.stopPropagation()}>
              <div className="w-12 h-1 bg-white/30 rounded-full mx-auto mb-4 sm:hidden" />
              <div className="text-center mb-5">
                <h3 className="text-xl font-bold text-white mb-3">Pay Now</h3>
                <div className="inline-block px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full glow">
                  <p className="font-bold text-2xl text-white font-mono">{formatCurrency(selectedParticipant.theirShare)}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                {bill.createdBy.defaultUpi && (
                  <div className="p-4 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-bold text-xs text-indigo-300">UPI ID</p>
                      <button onClick={() => copyToClipboard(bill.createdBy!.defaultUpi!, 'UPI')} className="px-3 py-1 bg-indigo-500 text-white rounded-lg text-xs font-bold">
                        Copy
                      </button>
                    </div>
                    <p className="font-mono text-indigo-200 font-bold text-sm break-all">{bill.createdBy.defaultUpi}</p>
                  </div>
                )}

                {bill.createdBy.phone && (
                  <div className="p-4 bg-green-500/20 rounded-xl border border-green-500/30">
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-bold text-xs text-green-300">Phone</p>
                      <button onClick={() => copyToClipboard(bill.createdBy!.phone!, 'Phone')} className="px-3 py-1 bg-green-500 text-white rounded-lg text-xs font-bold">
                        Copy
                      </button>
                    </div>
                    <p className="font-mono text-green-200 font-bold text-sm">{bill.createdBy.phone}</p>
                  </div>
                )}

                <div className="p-3 bg-amber-500/20 rounded-xl border border-amber-500/30">
                  <p className="text-xs text-amber-200">
                    📱 Copy → Pay via UPI → Click "I Paid"
                  </p>
                </div>

                <Button onClick={handleMarkAsPaid} size="lg" className="w-full h-14 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg">
                  <CheckCircle2 className="mr-2" />I Paid
                </Button>
                <Button variant="outline" onClick={() => setShowPaymentModal(false)} className="w-full h-12 rounded-xl border-white/20 text-white hover:bg-white/10">Cancel</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
