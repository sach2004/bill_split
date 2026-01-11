export function generateShareId(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function calculateParticipantShare(
  items: Array<{ id: string; price: number; quantity: number }>,
  participantItems: Array<{ itemId: string; quantity: number }>,
  totalAmount: number,
  billTotal: number
): number {
  let share = 0
  
  for (const pItem of participantItems) {
    const item = items.find(i => i.id === pItem.itemId)
    if (item) {
      const pricePerUnit = item.price / item.quantity
      share += pricePerUnit * pItem.quantity
    }
  }
  
  const ratio = share / billTotal
  const finalShare = ratio * totalAmount
  
  return Math.round(finalShare * 100) / 100
}

export function formatCurrency(amount: number): string {
  return `₹${amount.toFixed(2)}`
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}
