'use client'

import { motion } from 'framer-motion'
import { User, Phone } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ParticipantAvatarProps {
  name: string
  phone?: string
  isPaid?: boolean
  className?: string
}

export function ParticipantAvatar({ name, phone, isPaid = false, className }: ParticipantAvatarProps) {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <motion.div
      whileHover={{ scale: 1.05, rotate: 2 }}
      className={cn(
        "relative inline-flex items-center justify-center w-12 h-12 rounded-full font-bold text-white transition-all",
        isPaid ? "bg-green-500" : "bg-indigo-500",
        className
      )}
    >
      {initials || <User size={20} />}
      {phone && (
        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
          <Phone size={10} />
        </div>
      )}
    </motion.div>
  )
}
