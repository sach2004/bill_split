'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useBillStore, BillItem as StoreBillItem } from '@/store/billStore'
import { formatCurrency } from '@/lib/calculations'
import { cn } from '@/lib/utils'

interface BillItemProps {
  item: StoreBillItem & { selected?: boolean }
  participantId?: string
  onUpdate?: (updates: Partial<StoreBillItem>) => void
  onRemove?: () => void
  onToggle?: () => void
  showActions?: boolean
}

export function BillItemComponent({
  item,
  participantId,
  onUpdate,
  onRemove,
  showActions = false,
}: BillItemProps) {
  const { toggleItemSelection } = useBillStore()

  const handleToggle = () => {
    if (participantId && item.id) {
      toggleItemSelection(participantId, item.id)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className={cn(
        "flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-300",
        item.selected
          ? "border-indigo-500 bg-indigo-50"
          : "border-gray-200 bg-white hover:border-indigo-300"
      )}
    >
      {participantId && (
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleToggle}
          className={cn(
            "w-8 h-8 rounded-full border-2 flex items-center justify-center mr-3 transition-colors",
            item.selected
              ? "border-indigo-500 bg-indigo-500 text-white"
              : "border-gray-300 bg-gray-50 text-gray-400"
          )}
        >
          <AnimatePresence mode="wait">
            {item.selected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <Check size={16} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      )}

      <div className="flex-1">
        <h4 className="font-semibold text-gray-900">{item.name}</h4>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Qty: {item.quantity}</span>
          {item.category && (
            <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs">
              {item.category}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="font-bold text-lg text-indigo-600">
          {formatCurrency(item.price)}
        </span>

        {showActions && (
          <motion.div whileTap={{ scale: 0.9 }}>
            <Button
              variant="destructive"
              size="icon"
              onClick={onRemove}
              className="w-8 h-8 rounded-full"
            >
              <X size={16} />
            </Button>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
