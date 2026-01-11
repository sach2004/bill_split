'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, Clock, IndianRupee } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/calculations'

interface Participant {
  name: string
  theirShare: number
  isPaid: boolean
  phone?: string
}

interface Bill {
  title: string
  totalAmount: number
  restaurantName?: string
  createdAt?: Date
}

interface SplitSummaryProps {
  participants: Participant[]
  bill: Bill
  onPay?: (participantId: string) => void
  showPayButton?: boolean
}

export function SplitSummary({ participants, bill, onPay, showPayButton = true }: SplitSummaryProps) {
  const totalCollected = participants
    .filter(p => p.isPaid)
    .reduce((sum, p) => sum + p.theirShare, 0)
  
  const pending = participants.filter(p => !p.isPaid)
  const completed = participants.filter(p => p.isPaid)

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
        <CardTitle className="text-white">Bill Summary</CardTitle>
        <p className="text-indigo-100 text-sm">
          {bill.restaurantName && `${bill.restaurantName} • `}
          {bill.createdAt && formatDate(bill.createdAt)}
        </p>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        <div className="text-center py-4">
          <p className="text-gray-600 text-sm mb-1">Total Bill Amount</p>
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-5xl font-bold text-indigo-600"
          >
            {formatCurrency(bill.totalAmount)}
          </motion.div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-green-50 rounded-2xl p-4 text-center">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <p className="text-2xl font-bold text-green-700">{completed.length}</p>
            <p className="text-sm text-green-600">Paid</p>
            <p className="text-xs text-green-500 mt-1">{formatCurrency(totalCollected)}</p>
          </div>
          <div className="bg-amber-50 rounded-2xl p-4 text-center">
            <Clock className="w-8 h-8 mx-auto mb-2 text-amber-600" />
            <p className="text-2xl font-bold text-amber-700">{pending.length}</p>
            <p className="text-sm text-amber-600">Pending</p>
            <p className="text-xs text-amber-500 mt-1">
              {formatCurrency(bill.totalAmount - totalCollected)}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold text-gray-900">Participants</h3>
          {participants.map((participant, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-3 rounded-xl bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                    participant.isPaid ? 'bg-green-500' : 'bg-indigo-500'
                  }`}
                >
                  {participant.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{participant.name}</p>
                  <p className="text-sm text-gray-600">{formatCurrency(participant.theirShare)}</p>
                </div>
              </div>
              
              {showPayButton && !participant.isPaid && (
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button
                    size="sm"
                    onClick={() => onPay && onPay(participant.name)}
                    className="rounded-full"
                  >
                    <IndianRupee size={16} className="mr-1" />
                    Pay
                  </Button>
                </motion.div>
              )}
              
              {participant.isPaid && (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle2 size={20} />
                  <span className="text-sm font-medium">Paid</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
