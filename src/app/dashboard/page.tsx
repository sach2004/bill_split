'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Calendar, Wallet, Users, ArrowRight, Trash2, Loader2, LogOut, Settings } from 'lucide-react'
import { useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate, formatCurrency } from '@/lib/calculations'
import { toast } from '@/components/ui/toast'
import Link from 'next/link'

interface Bill {
  id: string
  shareId: string
  title: string
  totalAmount: number
  restaurantName?: string
  status: string
  createdAt: string
  participants: any[]
}

export default function DashboardPage() {
  const { signOut } = useClerk()
  const router = useRouter()
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchBills()
  }, [])

  const fetchBills = async () => {
    try {
      const response = await fetch('/api/bill')
      const result = await response.json()
      if (result.success) setBills(result.bills)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (shareId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!confirm('Delete this bill?')) return

    setDeletingId(shareId)
    try {
      const response = await fetch(`/api/bill/${shareId}`, { method: 'DELETE' })
      if (response.ok) {
        setBills(bills.filter(b => b.shareId !== shareId))
        toast('Bill deleted', 'success')
      } else {
        toast('Failed to delete', 'error')
      }
    } catch (error) {
      toast('Error deleting', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    toast('Signed out', 'success')
    router.push('/')
  }

  const filteredBills = bills.filter(bill =>
    bill.title.toLowerCase().includes(search.toLowerCase()) ||
    bill.restaurantName?.toLowerCase().includes(search.toLowerCase())
  )

  const totalAmount = bills.reduce((sum, b) => sum + b.totalAmount, 0)
  const activeCount = bills.filter(b => b.status === 'ACTIVE').length

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="sticky top-0 z-50 glass border-b border-white/10">
        <div className="max-w-6xl mx-auto px-3 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <div className="flex gap-2">
              <Link href="/create-bill">
                <Button size="sm" className="rounded-full h-10 bg-gradient-to-r from-indigo-600 to-purple-600">
                  <Plus className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">New</span>
                </Button>
              </Link>
              <Link href="/settings">
                <Button variant="outline" size="sm" className="rounded-full h-10 border-white/20 text-white hover:bg-white/10">
                  <Settings className="w-4 h-4" />
                </Button>
              </Link>
              <Button 
                onClick={handleSignOut}
                variant="outline" 
                size="sm" 
                className="rounded-full h-10 border-white/20 text-white hover:bg-white/10"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="relative z-10 max-w-6xl mx-auto px-3 py-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          <div className="glass p-4 rounded-2xl border border-indigo-500/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Total</p>
                <p className="text-lg font-bold text-white font-mono">{formatCurrency(totalAmount)}</p>
              </div>
            </div>
          </div>

          <div className="glass p-4 rounded-2xl border border-amber-500/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Active</p>
                <p className="text-xl font-bold text-white">{activeCount}</p>
              </div>
            </div>
          </div>

          <div className="glass p-4 rounded-2xl border border-green-500/30 col-span-2 sm:col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Bills</p>
                <p className="text-xl font-bold text-white">{bills.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search bills..."
              className="pl-10 h-12 rounded-2xl glass border-white/10 text-white placeholder:text-gray-500"
            />
          </div>
        </div>

        {filteredBills.length === 0 ? (
          <div className="glass rounded-3xl p-12 text-center border border-white/10">
            <Wallet className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">
              {bills.length === 0 ? 'No bills yet' : 'No matches'}
            </h3>
            <p className="text-gray-400 mb-6 text-sm">
              {bills.length === 0 ? 'Create your first bill' : 'Try different search'}
            </p>
            {bills.length === 0 && (
              <Link href="/create-bill">
                <Button className="rounded-full bg-gradient-to-r from-indigo-600 to-purple-600">
                  <Plus className="mr-2" />Create Bill
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredBills.map((bill, idx) => (
              <motion.div key={bill.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                <Link href={`/bill/${bill.shareId}`}>
                  <div className="glass rounded-2xl p-4 border border-white/10 hover:border-indigo-500/50 transition-all group relative">
                    <div className={`absolute top-3 right-3 px-3 py-1 text-xs font-bold rounded-full ${
                      bill.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {bill.status}
                    </div>
                    
                    <div className="pr-24 mb-3">
                      <h3 className="font-bold text-lg text-white mb-1">{bill.title}</h3>
                      {bill.restaurantName && <p className="text-sm text-gray-400">📍 {bill.restaurantName}</p>}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(new Date(bill.createdAt))}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {bill.participants.length}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-bold text-indigo-400 font-mono">{formatCurrency(bill.totalAmount)}</span>
                        <button
                          onClick={(e) => handleDelete(bill.shareId, e)}
                          disabled={deletingId === bill.shareId}
                          className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400 opacity-0 group-hover:opacity-100"
                        >
                          {deletingId === bill.shareId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
