'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Camera, ArrowRight, Loader2, X, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'

export default function CreateBillPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [images, setImages] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [parsed, setParsed] = useState<any>(null)
  const [title, setTitle] = useState('')
  const [totalAmount, setTotalAmount] = useState('')

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        toast('File must be less than 10MB', 'error')
        continue
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        const base64 = event.target?.result as string
        setImages(prev => [...prev, base64])
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
    if (images.length === 1) {
      setParsed(null)
    }
  }

  const handleScanBills = async () => {
    if (images.length === 0) {
      toast('Please upload at least one image', 'error')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/parse-bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          images: images,
          multiple: images.length > 1
        }),
      })

      const result = await response.json()
      
      if (result.success) {
        setParsed(result.data)
        setTitle(result.data.restaurantName || 'New Bill')
        setTotalAmount(result.data.totalAmount?.toString() || '')
        toast(`Scanned with ${result.provider}!`, 'success')
      } else {
        toast(result.error || 'Failed to parse', 'error')
      }
    } catch (error) {
      toast('Failed to parse bill', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBill = async () => {
    if (!parsed || !title || !totalAmount) {
      toast('Fill all fields', 'error')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          imageUrl: images[0],
          totalAmount: parseFloat(totalAmount),
          restaurantName: parsed.restaurantName,
          items: parsed.items || [],
        }),
      })

      const result = await response.json()
      
      if (result.success) {
        router.push(`/create-bill/upi-setup?billId=${result.bill.shareId}`)
      } else {
        toast(result.error || 'Failed to create', 'error')
      }
    } catch (error) {
      toast('Failed to create bill', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="sticky top-0 z-50 glass border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <button onClick={() => router.back()} className="text-white font-semibold hover:text-indigo-400">
            ← Back
          </button>
        </div>
      </div>

      <main className="relative z-10 max-w-5xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Create Bill</h1>
          <p className="text-gray-400 text-sm">Upload one or more bill images</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Upload */}
          <div className="glass rounded-3xl border border-white/10 overflow-hidden">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-5">
              <h2 className="text-white font-bold text-xl flex items-center gap-2">
                <Camera className="w-6 h-6" />
                1. Upload Bills
              </h2>
              <p className="text-indigo-100 text-sm mt-1">Add multiple images if needed</p>
            </div>
            <div className="p-5">
              {images.length === 0 ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-indigo-400/50 rounded-2xl p-10 text-center cursor-pointer hover:border-indigo-400 hover:bg-white/5 transition-all"
                >
                  <Camera className="w-16 h-16 mx-auto mb-4 text-indigo-400" />
                  <p className="font-semibold text-white mb-2">Tap to upload</p>
                  <p className="text-sm text-gray-400">JPG, PNG • Multiple allowed</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img src={img} alt={`Bill ${idx + 1}`} className="w-full rounded-xl border-2 border-white/20" />
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
                      Scanning {images.length} image{images.length > 1 ? 's' : ''}...
                    </>
                  ) : (
                    <>
                      <Camera className="mr-2" />
                      Scan Bill{images.length > 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div className="glass rounded-3xl border border-white/10 overflow-hidden">
              <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-5">
                <h2 className="text-white font-bold text-xl">2. Review</h2>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">Title *</label>
                  <Input 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    placeholder="Lunch at Cafe" 
                    className="h-12 glass border-white/20 text-white placeholder:text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">Total (₹) *</label>
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
                    <label className="block text-sm font-bold text-gray-300 mb-2">
                      Items ({parsed.items.length})
                    </label>
                    <div className="space-y-2 max-h-48 overflow-y-auto p-2 bg-black/30 rounded-xl">
                      {parsed.items.map((item: any, index: number) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className="flex justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                        >
                          <span className="text-sm text-white">{item.name}</span>
                          <span className="font-mono text-sm font-semibold text-indigo-400">₹{item.price}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {parsed && (
                  <div className="p-3 bg-green-500/20 rounded-xl border border-green-500/30">
                    <p className="text-xs text-green-200">
                      ✓ Scanned with {parsed.provider || 'AI'}
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
  )
}
