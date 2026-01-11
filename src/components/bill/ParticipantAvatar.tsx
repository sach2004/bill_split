"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

interface ParticipantAvatarProps {
  name: string;
  phone?: string | null;
  isPaid?: boolean;
}

export function ParticipantAvatar({
  name,
  phone,
  isPaid,
}: ParticipantAvatarProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative">
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl mx-auto"
      >
        {initials}
      </motion.div>
      {isPaid && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white"
        >
          <CheckCircle2 className="w-4 h-4 text-white" />
        </motion.div>
      )}
    </div>
  );
}
