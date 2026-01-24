"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Camera,
  Check,
  Edit2,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export default function CreateBillPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [parsed, setParsed] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");

  if (isLoaded && !isSignedIn) {
    router.push("/sign-in");
    return null;
  }

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          const maxWidth = 1200;
          const scale = Math.min(1, maxWidth / img.width);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.85));
        };
        img.onerror = () => reject(new Error("Failed to load image"));
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        toast("File must be less than 10MB", "error");
        continue;
      }
      try {
        const compressed = await compressImage(file);
        setImages((prev) => [...prev, compressed]);
      } catch (error) {
        toast("Failed to process image", "error");
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    if (images.length === 1) setParsed(null);
  };

  const handleScanBills = async () => {
    if (images.length === 0) {
      toast("Please upload at least one image", "error");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/parse-bill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images, multiple: images.length > 1 }),
      });
      const result = await response.json();
      if (result.success) {
        const allItems = [
          ...(result.data.items || []),
          ...(result.data.taxes || []),
        ];
        setParsed({ ...result.data, items: allItems });
        setTitle(result.data.restaurantName || "New Bill");
        setTotalAmount(result.data.totalAmount?.toString() || "");
        toast(`Scanned with ${result.provider}!`, "success");
      } else {
        toast(result.error || "Failed to parse", "error");
      }
    } catch (error) {
      toast("Failed to parse bill", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEditItem = (index: number) => {
    const item = parsed.items[index];
    setEditingIndex(index);
    setEditName(item.name);
    setEditPrice(item.price.toString());
  };

  const handleSaveEdit = () => {
    if (editingIndex === null) return;
    const newItems = [...parsed.items];
    newItems[editingIndex] = {
      ...newItems[editingIndex],
      name: editName,
      price: parseFloat(editPrice) || 0,
    };
    setParsed({ ...parsed, items: newItems });
    setEditingIndex(null);
    setEditName("");
    setEditPrice("");
  };

  const handleDeleteItem = (index: number) => {
    setParsed({
      ...parsed,
      items: parsed.items.filter((_: any, i: number) => i !== index),
    });
  };

  const handleCreateBill = async () => {
    if (!parsed || !title || !totalAmount) {
      toast("Fill all fields", "error");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/bill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          imageUrl: images[0],
          totalAmount: parseFloat(totalAmount),
          restaurantName: parsed.restaurantName,
          items: parsed.items || [],
        }),
      });
      const result = await response.json();
      if (result.success) {
        router.push(`/create-bill/upi-setup?billId=${result.bill.shareId}`);
      } else {
        toast(result.error || "Failed to create", "error");
      }
    } catch (error) {
      toast("Failed to create bill", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="sticky top-0 z-50 glass border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <button
            onClick={() => router.back()}
            className="text-white font-semibold hover:text-indigo-400"
          >
            ← Back
          </button>
        </div>
      </div>

      <main className="relative z-10 max-w-5xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Create Bill</h1>
          <p className="text-gray-400 text-sm">
            Upload one or more bill images
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="glass rounded-3xl border border-white/10 overflow-hidden">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-5">
              <h2 className="text-white font-bold text-xl flex items-center gap-2">
                <Camera className="w-6 h-6" />
                1. Upload Bills
              </h2>
              <p className="text-indigo-100 text-sm mt-1">
                Add multiple images if needed
              </p>
            </div>
            <div className="p-5">
              {images.length === 0 ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-indigo-400/50 rounded-2xl p-10 text-center cursor-pointer hover:border-indigo-400 hover:bg-white/5 transition-all"
                >
                  <Camera className="w-16 h-16 mx-auto mb-4 text-indigo-400" />
                  <p className="font-semibold text-white mb-2">Tap to upload</p>
                  <p className="text-sm text-gray-400">
                    JPG, PNG • Multiple allowed
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={img}
                        alt={`Bill ${idx + 1}`}
                        className="w-full rounded-xl border-2 border-white/20"
                      />
                      <button
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-2 left-2 px-3 py-1 bg-black/70 backdrop-blur-sm rounded-full text-white text-xs font-bold">
                        Image {idx + 1}
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-4 border-2 border-dashed border-indigo-400/50 rounded-xl hover:border-indigo-400 hover:bg-white/5 transition-all flex items-center justify-center gap-2 text-indigo-400 font-semibold"
                  >
                    <Plus className="w-5 h-5" />
                    Add Another Image
                  </button>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              {images.length > 0 && !parsed && (
                <Button
                  onClick={handleScanBills}
                  disabled={loading}
                  className="w-full mt-4 h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Camera className="mr-2" />
                      Scan Bill{images.length > 1 ? "s" : ""}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass rounded-3xl border border-white/10 overflow-hidden">
              <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-5">
                <h2 className="text-white font-bold text-xl">
                  2. Review & Edit
                </h2>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">
                    Title *
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Lunch at Cafe"
                    className="h-12 glass border-white/20 text-white placeholder:text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">
                    Total (₹) *
                  </label>
                  <Input
                    type="number"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    className="h-12 glass border-white/20 text-white placeholder:text-gray-500"
                  />
                </div>
                {parsed?.items && parsed.items.length > 0 && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-bold text-gray-300">
                        Items ({parsed.items.length})
                      </label>
                      <span className="text-xs text-gray-400">
                        Click to edit
                      </span>
                    </div>
                    <div className="space-y-2 max-h-96 overflow-y-auto p-2 bg-black/30 rounded-xl">
                      {parsed.items.map((item: any, index: number) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className="p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all"
                        >
                          {editingIndex === index ? (
                            <div className="space-y-2">
                              <Input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="h-10 glass border-white/20 text-white text-sm"
                                placeholder="Item name"
                              />
                              <div className="flex gap-2">
                                <Input
                                  type="number"
                                  value={editPrice}
                                  onChange={(e) => setEditPrice(e.target.value)}
                                  className="h-10 glass border-white/20 text-white text-sm flex-1"
                                  placeholder="Price"
                                  step="0.01"
                                />
                                <Button
                                  onClick={handleSaveEdit}
                                  size="sm"
                                  className="h-10 px-3 rounded-lg bg-green-500 hover:bg-green-600"
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button
                                  onClick={() => setEditingIndex(null)}
                                  size="sm"
                                  variant="outline"
                                  className="h-10 px-3 rounded-lg border-white/20"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-between items-center">
                              <div className="flex-1">
                                <span className="text-sm text-white font-medium">
                                  {item.name}
                                </span>
                                {item.category && (
                                  <span className="ml-2 text-xs px-2 py-0.5 bg-indigo-500/30 text-indigo-300 rounded-full">
                                    {item.category}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm font-semibold text-indigo-400">
                                  ₹{item.price}
                                </span>
                                <button
                                  onClick={() => handleEditItem(index)}
                                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteItem(index)}
                                  className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors text-red-400"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
                {parsed && (
                  <div className="p-3 bg-green-500/20 rounded-xl border border-green-500/30">
                    <p className="text-xs text-green-200">
                      ✓ Scanned with {parsed.provider || "AI"}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <Button
              onClick={handleCreateBill}
              disabled={!parsed || loading}
              size="lg"
              className="w-full h-16 text-lg rounded-2xl shadow-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 glow"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  Create & Share
                  <ArrowRight className="ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
