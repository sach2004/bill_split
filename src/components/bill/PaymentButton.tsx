"use client";

import { Button } from "@/components/ui/button";
import { Smartphone } from "lucide-react";

interface PaymentButtonProps {
  amount: number;
  onPay: () => void;
  disabled?: boolean;
}

export function PaymentButton({ amount, onPay, disabled }: PaymentButtonProps) {
  return (
    <Button
      onClick={onPay}
      disabled={disabled}
      size="lg"
      className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600"
    >
      <Smartphone className="mr-2" />
      Pay ₹{amount.toFixed(2)}
    </Button>
  );
}
