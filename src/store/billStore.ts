import { create } from "zustand";

export interface BillItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
}

interface BillStore {
  title: string;
  totalAmount: number;
  items: BillItem[];
  imageUrl?: string;
  restaurantName?: string;

  setTitle: (title: string) => void;
  setTotalAmount: (amount: number) => void;
  setItems: (items: BillItem[]) => void;
  setImageUrl: (url: string) => void;
  setRestaurantName: (name: string) => void;
  reset: () => void;
}

export const useBillStore = create<BillStore>((set) => ({
  title: "",
  totalAmount: 0,
  items: [],
  imageUrl: undefined,
  restaurantName: undefined,

  setTitle: (title) => set({ title }),
  setTotalAmount: (totalAmount) => set({ totalAmount }),
  setItems: (items) => set({ items }),
  setImageUrl: (imageUrl) => set({ imageUrl }),
  setRestaurantName: (restaurantName) => set({ restaurantName }),
  reset: () =>
    set({
      title: "",
      totalAmount: 0,
      items: [],
      imageUrl: undefined,
      restaurantName: undefined,
    }),
}));
