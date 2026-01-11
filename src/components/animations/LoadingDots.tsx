'use client'

import { motion } from 'framer-motion'

export function LoadingDots() {
  return (
    <div className="flex items-center justify-center space-x-2">
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className="w-4 h-4 bg-indigo-500 rounded-full"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 1.1,
            ease: 'easeInOut',
            repeat: Infinity,
            delay: index * 0.3,
          }}
        />
      ))}
    </div>
  )
}
