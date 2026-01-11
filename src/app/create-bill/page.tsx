'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Camera, Upload, Check, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingDots } from '@/components/animations/LoadingDots'
import { PageTransition } from '@/components/animations/PageTransition'
import { BillItem } from '@/store/billStore'

export default function CreateBillPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [image, setImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [parsed, setParsed] = useState<any>(null)
  const [title, setTitle] = useState('')
  const [totalAmount, setTotalAmount] = useState('')

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB')
      return
    }

    const reader = new FileReader()
    reader.onload = async (event) => {
      const base64 = event.target?.result as string
      setImage(base64)

      setLoading(true)
      try {
        const response = await fetch('/api/parse-bill', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64 }),
        })

        const result = await response.json()
        
        if (result.success) {
          setParsed(result.data)
          setTitle(result.data.restaurantName || 'New Bill')
          setTotalAmount(result.data.totalAmount?.toString() || '')
        } else {
          if (result.error?.includes('API key not configured')) {
            alert('⚠️ No AI API key configured!\n\nPlease add one of these to your .env file:\n• OPENAI_API_KEY (OpenAI GPT-4o)\n• GOOGLE_GEMINI_API_KEY (Google Gemini)\n\nRestart the server after adding keys.')
          } else if (result.error?.includes('HTML instead of JSON')) {
            alert('⚠️ API Error\n\nThe API returned an error. This usually means:\n• Your API key is invalid\n• You\'ve exceeded your quota\n• The service is temporarily down\n\nPlease check your API keys in .env')
          } else {
            alert(`⚠️ Bill parsing failed (${result.provider || 'AI'}):\n\n${result.error}\n\nTry taking a clearer photo or using a different provider.`)
          }
        }
      } catch (error) {
        console.error('Parse error:', error)
        alert('Failed to parse bill image')
      } finally {
        setLoading(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleCreateBill = async () => {
    if (!parsed || !title || !totalAmount) {
      alert('Please fill all required fields')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          imageUrl: image,
          totalAmount: parseFloat(totalAmount),
          restaurantName: parsed.restaurantName,
          items: parsed.items || [],
        }),
      })

      const result = await response.json()
      
      if (result.success) {
        router.push(`/bill/${result.bill.shareId}`)
      } else {
        alert(result.error || 'Failed to create bill')
      }
    } catch (error) {
      console.error('Create bill error:', error)
      alert('Failed to create bill')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageTransition>
      <div className="min-h-screen p-4 md:p-6">
        <header className="max-w-4xl mx-auto mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            ← Back
          </button>
        </header>

        <main className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-8 text-gray-900">
              Create New Bill
            </h1>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Card className="overflow-hidden">
                  <CardHeader className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                    <CardTitle className="text-white">1. Upload Bill</CardTitle>
                    <p className="text-indigo-100 text-sm mt-1">
                      Take a photo or upload an image
                    </p>
                  </CardHeader>
                  <CardContent className="p-6">
                    {!image ? (
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-indigo-300 rounded-3xl p-8 text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-all"
                      >
                        <Camera className="w-16 h-16 mx-auto mb-4 text-indigo-500" />
                        <p className="font-semibold text-gray-900 mb-2">
                          Tap to upload bill
                        </p>
                        <p className="text-sm text-gray-600">
                          JPG, PNG up to 10MB
                        </p>
                      </motion.div>
                    ) : (
                      <div className="relative">
                        <img
                          src={image}
                          alt="Bill"
                          className="w-full rounded-2xl"
                        />
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            setImage(null)
                            setParsed(null)
                          }}
                          className="absolute top-2 right-2 w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center"
                        >
                          ✕
                        </motion.button>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </CardContent>
                </Card>

                {loading && (
                  <div className="mt-6 bg-indigo-50 rounded-2xl p-6 text-center">
                    <LoadingDots />
                    <p className="mt-4 text-indigo-600 font-medium">
                      {parsed ? 'Creating bill...' : 'AI is reading your bill...'}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>2. Review & Edit</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bill Title *
                      </label>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Lunch at Cafe"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Total Amount (₹) *
                      </label>
                      <Input
                        type="number"
                        value={totalAmount}
                        onChange={(e) => setTotalAmount(e.target.value)}
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>

                    {parsed?.restaurantName && (
                      <div className="p-3 bg-indigo-50 rounded-xl">
                        <p className="text-sm text-gray-600">
                          Detected: <span className="font-semibold text-indigo-600">
                            {parsed.restaurantName}
                          </span>
                        </p>
                      </div>
                    )}

                    {parsed?.items && parsed.items.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Items Detected
                        </label>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {parsed.items.map((item: BillItem, index: number) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                            >
                              <span className="flex-1 text-sm">{item.name}</span>
                              <span className="font-mono text-sm font-semibold">
                                ₹{item.price}
                              </span>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <motion.div whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={handleCreateBill}
                    disabled={!parsed || loading}
                    size="lg"
                    className="w-full h-14 text-lg rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
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
                </motion.div>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </PageTransition>
  )
}
