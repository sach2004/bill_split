export function generateShareId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function formatCurrency(
  amount: number,
  currency: string = "INR"
): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function calculateParticipantShare(
  allItems: any[],
  participantItems: { itemId: string; quantity?: number }[],
  billTotal: number,
  itemsTotal: number
): number {
  if (!allItems || allItems.length === 0) return 0;
  if (!participantItems || participantItems.length === 0) return 0;

  // Calculate sum of selected items
  let selectedSum = 0;
  for (const pItem of participantItems) {
    const item = allItems.find((i) => i.id === pItem.itemId);
    if (item) {
      selectedSum += item.price * (item.quantity || 1);
    }
  }

  // If items total is 0, return 0
  if (itemsTotal === 0) return 0;

  // Calculate proportional share of the bill total
  const shareRatio = selectedSum / itemsTotal;
  const share = billTotal * shareRatio;

  return Math.round(share * 100) / 100;
}
