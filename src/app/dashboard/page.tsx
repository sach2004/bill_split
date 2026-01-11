'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Filter, Calendar, IndianRupee, Users, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingDots } from '@/components/animations/LoadingDots'
import { PageTransition } from '@/components/animations/PageTransition'
import { formatDate, formatCurrency } from '@/lib/calculations'
import Link from 'next/link'

interface Bill {
  id: string
  shareId: string
  title: string
  totalAmount: number
  restaurantName?: string
  status: string
  createdAt: string
  items: any[]
  participants: any[]
}

export default function DashboardPage() {
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')

  useEffect(() => {
    fetchBills()
  }, [])

  const fetchBills = async () => {
    try {
      const response = await fetch('/api/bill')
      const result = await response.json()
      
      if (result.success) {
        setBills(result.bills)
      }
    } catch (error) {
      console.error('Fetch bills error:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredBills = bills.filter(bill => {
    const matchesSearch = bill.title.toLowerCase().includes(search.toLowerCase()) ||
      bill.restaurantName?.toLowerCase().includes(search.toLowerCase())
    
    const matchesFilter = filter === 'all' ||
      (filter === 'active' && bill.status === 'ACTIVE') ||
      (filter === 'completed' && bill.status === 'COMPLETED')
    
    return matchesSearch && matchesFilter
  })

  const completedCount = bills.filter(b => b.status === 'COMPLETED').length
  const activeCount = bills.filter(b => b.status === 'ACTIVE').length
  const totalAmount = bills.reduce((sum, b) => sum + b.totalAmount, 0)

  if (loading) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="text-center">
            <LoadingDots />
            <p className="mt-4 text-gray-600">Loading your bills...</p>
          </div>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="min-h-screen p-4 md:p-6">
        <header className="max-w-6xl mx-auto mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Dashboard
            </h1>
            <div className="flex gap-3">
              <Link href="/create-bill">
                <Button size="lg" className="rounded-full">
                  <Plus className="mr-2" size={20} />
                  New Bill
                </Button>
              </Link>
              <Link href="/settings">
                <Button variant="outline" size="lg" className="rounded-full">
                  Settings
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                    <IndianRupee className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Spent</p>
                    <p className="text-2xl font-bold text-indigo-600">
                      {formatCurrency(totalAmount)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Active Bills</p>
                    <p className="text-2xl font-bold text-amber-600">{activeCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-green-600">{completedCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search bills..."
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setFilter(filter === 'all' ? 'active' : filter === 'active' ? 'completed' : 'all')}
              className="rounded-full"
            >
              <Filter className="w-4 h-4 mr-2" />
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Button>
          </div>
        </header>

        <main className="max-w-6xl mx-auto">
          {filteredBills.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <IndianRupee className="w-10 h-10 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {bills.length === 0 ? 'No bills yet' : 'No matching bills'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {bills.length === 0
                    ? 'Create your first bill to start splitting expenses'
                    : 'Try adjusting your search or filter'}
                </p>
                {bills.length === 0 && (
                  <Link href="/create-bill">
                    <Button size="lg" className="rounded-full">
                      <Plus className="mr-2" />
                      Create First Bill
                    </Button>
                  </Link>
                )}
              </div>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredBills.map((bill, index) => (
                  <motion.div
                    key={bill.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link href={`/bill/${bill.shareId}`}>
                      <Card className="h-full hover:shadow-xl transition-shadow cursor-pointer">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="font-bold text-lg text-gray-900 mb-1">
                                {bill.title}
                              </h3>
                              {bill.restaurantName && (
                                <p className="text-sm text-gray-600">
                                  {bill.restaurantName}
                                </p>
                              )}
                            </div>
                            <div
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                bill.status === 'COMPLETED'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              {bill.status}
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-gray-600">
                              <Calendar className="w-4 h-4" />
                              <span className="text-sm">{formatDate(new Date(bill.createdAt))}</span>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1 text-gray-600">
                                <Users className="w-4 h-4" />
                                <span className="text-sm">{bill.participants.length}</span>
                              </div>
                              <span className="text-xl font-bold text-indigo-600">
                                {formatCurrency(bill.totalAmount)}
                              </span>
                            </div>
                          </div>

                          <div className="mt-4 flex items-center text-indigo-600 font-medium text-sm">
                            View Details
                            <ArrowRight className="w-4 h-4 ml-1" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </main>
      </div>
    </PageTransition>
  )
}
