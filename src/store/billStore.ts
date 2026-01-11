import { create } from 'zustand'

export interface BillItem {
  id: string
  name: string
  price: number
  quantity: number
  category?: string
}

export interface Participant {
  id: string
  name: string
  phone?: string
  userId?: string
  theirShare: number
  isPaid: boolean
  selectedItems: string[]
}

interface BillStore {
  currentBill: {
    id?: string
    title: string
    totalAmount: number
    restaurantName?: string
    items: BillItem[]
    participants: Participant[]
  }
  setCurrentBill: (bill: Partial<BillStore['currentBill']>) => void
  addItem: (item: Omit<BillItem, 'id'>) => void
  updateItem: (id: string, updates: Partial<BillItem>) => void
  removeItem: (id: string) => void
  addParticipant: (participant: Omit<Participant, 'id' | 'theirShare' | 'isPaid' | 'selectedItems'>) => void
  updateParticipant: (id: string, updates: Partial<Participant>) => void
  removeParticipant: (id: string) => void
  toggleItemSelection: (participantId: string, itemId: string) => void
  resetBill: () => void
}

export const useBillStore = create<BillStore>((set) => ({
  currentBill: {
    title: '',
    totalAmount: 0,
    items: [],
    participants: [],
  },
  setCurrentBill: (updates) => set((state) => ({
    currentBill: { ...state.currentBill, ...updates }
  })),
  addItem: (item) => set((state) => ({
    currentBill: {
      ...state.currentBill,
      items: [...state.currentBill.items, { ...item, id: crypto.randomUUID() }]
    }
  })),
  updateItem: (id, updates) => set((state) => ({
    currentBill: {
      ...state.currentBill,
      items: state.currentBill.items.map(item =>
        item.id === id ? { ...item, ...updates } : item
      )
    }
  })),
  removeItem: (id) => set((state) => ({
    currentBill: {
      ...state.currentBill,
      items: state.currentBill.items.filter(item => item.id !== id)
    }
  })),
  addParticipant: (participant) => set((state) => ({
    currentBill: {
      ...state.currentBill,
      participants: [...state.currentBill.participants, {
        ...participant,
        id: crypto.randomUUID(),
        theirShare: 0,
        isPaid: false,
        selectedItems: []
      }]
    }
  })),
  updateParticipant: (id, updates) => set((state) => ({
    currentBill: {
      ...state.currentBill,
      participants: state.currentBill.participants.map(p =>
        p.id === id ? { ...p, ...updates } : p
      )
    }
  })),
  removeParticipant: (id) => set((state) => ({
    currentBill: {
      ...state.currentBill,
      participants: state.currentBill.participants.filter(p => p.id !== id)
    }
  })),
  toggleItemSelection: (participantId, itemId) => set((state) => ({
    currentBill: {
      ...state.currentBill,
      participants: state.currentBill.participants.map(p => {
        if (p.id === participantId) {
          const selectedItems = p.selectedItems.includes(itemId)
            ? p.selectedItems.filter(id => id !== itemId)
            : [...p.selectedItems, itemId]
          return { ...p, selectedItems }
        }
        return p
      })
    }
  })),
  resetBill: () => set({
    currentBill: {
      title: '',
      totalAmount: 0,
      items: [],
      participants: [],
    }
  }),
}))
