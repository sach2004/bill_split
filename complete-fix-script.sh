#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     SplitBills - Complete Fix & Setup Script          ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo ""

# Function to print step
print_step() {
    echo -e "${GREEN}[STEP $1]${NC} $2"
}

# Function to print error
print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Stop on any error
set -e

# Get current directory
PROJECT_DIR=$(pwd)
echo -e "Working directory: ${BLUE}$PROJECT_DIR${NC}"
echo ""

# ============================================================================
# STEP 1: Clean up old files
# ============================================================================
print_step "1" "Cleaning up old files..."

# Stop any running dev server
pkill -f "next dev" 2>/dev/null || true

# Remove old database
if [ -f "prisma/dev.db" ]; then
    rm -f prisma/dev.db
    rm -f prisma/dev.db-journal
    echo "✓ Removed old database"
fi

# Remove node_modules and lock files
if [ -d "node_modules" ]; then
    rm -rf node_modules
    echo "✓ Removed node_modules"
fi

if [ -f "package-lock.json" ]; then
    rm -f package-lock.json
    echo "✓ Removed package-lock.json"
fi

# Remove .next folder
if [ -d ".next" ]; then
    rm -rf .next
    echo "✓ Removed .next build cache"
fi

echo ""

# ============================================================================
# STEP 2: Create necessary directories
# ============================================================================
print_step "2" "Creating directory structure..."

mkdir -p src/lib
mkdir -p src/components/ui
mkdir -p src/components/bill
mkdir -p src/components/animations
mkdir -p src/store
mkdir -p src/app/api/bill/\[shareId\]/participants
mkdir -p src/app/api/parse-bill
mkdir -p src/app/api/payment
mkdir -p src/app/api/user/profile
mkdir -p src/app/api/webhooks/clerk
mkdir -p prisma

echo "✓ Created all directories"
echo ""

# ============================================================================
# STEP 3: Create package.json
# ============================================================================
print_step "3" "Creating package.json..."

cat > package.json << 'PACKAGEJSON'
{
  "name": "money-splitter",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "postinstall": "prisma generate"
  },
  "dependencies": {
    "@clerk/nextjs": "^6.12.0",
    "@prisma/client": "^6.1.0",
    "@radix-ui/react-dialog": "^1.1.4",
    "@radix-ui/react-label": "^2.1.1",
    "@radix-ui/react-slot": "^1.1.1",
    "@radix-ui/react-toast": "^1.2.4",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "framer-motion": "^11.15.0",
    "lucide-react": "^0.468.0",
    "next": "16.1.1",
    "openai": "^4.77.3",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "razorpay": "^2.9.4",
    "tailwind-merge": "^2.7.0",
    "zod": "^3.24.1",
    "zustand": "^5.0.2"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.1.1",
    "prisma": "^6.1.0",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
PACKAGEJSON

echo "✓ Created package.json"
echo ""

# ============================================================================
# STEP 4: Install dependencies
# ============================================================================
print_step "4" "Installing dependencies (this may take a few minutes)..."

npm install

echo "✓ Installed all dependencies"
echo ""

# ============================================================================
# STEP 5: Create Prisma schema
# ============================================================================
print_step "5" "Creating Prisma database schema..."

cat > prisma/schema.prisma << 'PRISMASCHEMA'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  clerkId   String   @unique
  email     String   @unique
  name      String?
  phone     String?
  defaultUpi String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  bills        Bill[]            @relation("CreatedBills")
  participants BillParticipant[]
  payments     Payment[]
}

model Bill {
  id             String   @id @default(uuid())
  shareId        String   @unique
  title          String
  totalAmount    Float
  restaurantName String?
  location       String?
  imageUrl       String?
  status         String   @default("ACTIVE")
  createdById    String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  createdBy    User              @relation("CreatedBills", fields: [createdById], references: [id], onDelete: Cascade)
  items        BillItem[]
  participants BillParticipant[]
  payments     Payment[]

  @@index([shareId])
  @@index([createdById])
}

model BillItem {
  id       String  @id @default(uuid())
  billId   String
  name     String
  price    Float
  quantity Int     @default(1)
  category String?

  bill         Bill                    @relation(fields: [billId], references: [id], onDelete: Cascade)
  participants BillItemParticipant[]

  @@index([billId])
}

model BillParticipant {
  id         String   @id @default(uuid())
  billId     String
  userId     String?
  name       String
  phone      String?
  theirShare Float    @default(0)
  isPaid     Boolean  @default(false)
  joinedAt   DateTime @default(now())

  bill     Bill                  @relation(fields: [billId], references: [id], onDelete: Cascade)
  user     User?                 @relation(fields: [userId], references: [id])
  items    BillItemParticipant[]
  payments Payment[]

  @@index([billId])
  @@index([userId])
}

model BillItemParticipant {
  id            String @id @default(uuid())
  participantId String
  itemId        String

  participant BillParticipant @relation(fields: [participantId], references: [id], onDelete: Cascade)
  item        BillItem        @relation(fields: [itemId], references: [id], onDelete: Cascade)

  @@unique([participantId, itemId])
  @@index([participantId])
  @@index([itemId])
}

model Payment {
  id                String   @id @default(uuid())
  billId            String
  participantId     String
  fromUserId        String?
  toUserId          String
  amount            Float
  paymentMethod     String
  payerUpi          String?
  razorpayOrderId   String?
  razorpayPaymentId String?
  status            String   @default("PENDING")
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  bill        Bill            @relation(fields: [billId], references: [id], onDelete: Cascade)
  participant BillParticipant @relation(fields: [participantId], references: [id], onDelete: Cascade)
  fromUser    User?           @relation(fields: [fromUserId], references: [id])

  @@index([billId])
  @@index([participantId])
  @@index([fromUserId])
}
PRISMASCHEMA

echo "✓ Created Prisma schema"
echo ""

# ============================================================================
# STEP 6: Create lib files
# ============================================================================
print_step "6" "Creating utility files..."

# prisma.ts
cat > src/lib/prisma.ts << 'PRISMALIB'
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
PRISMALIB

# openai.ts
cat > src/lib/openai.ts << 'OPENAILIB'
import OpenAI from 'openai'

export interface ParsedBillItem {
  name: string
  price: number
  quantity: number
  category?: string
}

export interface ParsedBill {
  items: ParsedBillItem[]
  totalAmount: number
  restaurantName?: string
  date?: string
  confidence: number
}

export async function parseBillFromImage(imageBase64: string): Promise<{
  success: boolean
  data?: ParsedBill
  error?: string
  provider: string
}> {
  if (!process.env.OPENAI_API_KEY) {
    return {
      success: false,
      error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your .env file.',
      provider: 'openai',
    }
  }

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '')

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this bill/receipt image and extract the following information in JSON format:
{
  "items": [
    {
      "name": "item name",
      "price": number (price per unit),
      "quantity": number (default 1),
      "category": "food/drink/service/other"
    }
  ],
  "totalAmount": number,
  "restaurantName": "name",
  "date": "date if visible",
  "confidence": number (0-100)
}

Return ONLY valid JSON, no markdown, no backticks.`,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Data}`,
              },
            },
          ],
        },
      ],
      max_tokens: 1500,
      temperature: 0.1,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      return {
        success: false,
        error: 'No response from OpenAI',
        provider: 'openai',
      }
    }

    let jsonStr = content.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '')
    
    if (jsonStr.startsWith('<') || jsonStr.includes('<!DOCTYPE')) {
      return {
        success: false,
        error: 'OpenAI API returned an error. Check your API key and credits.',
        provider: 'openai',
      }
    }

    const parsedBill = JSON.parse(jsonStr) as ParsedBill

    if (!parsedBill.items || !Array.isArray(parsedBill.items) || parsedBill.items.length === 0) {
      return {
        success: false,
        error: 'No items found. Try a clearer image.',
        provider: 'openai',
      }
    }

    return {
      success: true,
      data: parsedBill,
      provider: 'openai',
    }
  } catch (error: any) {
    console.error('OpenAI API error:', error)
    return {
      success: false,
      error: error.message || 'Failed to parse bill',
      provider: 'openai',
    }
  }
}
OPENAILIB

# calculations.ts
cat > src/lib/calculations.ts << 'CALCLIB'
export function generateShareId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function formatCurrency(amount: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

export function calculateParticipantShare(
  allItems: any[],
  participantItems: { itemId: string; quantity?: number }[],
  billTotal: number,
  itemsTotal: number
): number {
  if (!allItems || allItems.length === 0) return 0
  if (!participantItems || participantItems.length === 0) return 0

  let selectedSum = 0
  for (const pItem of participantItems) {
    const item = allItems.find(i => i.id === pItem.itemId)
    if (item) {
      selectedSum += item.price * (item.quantity || 1)
    }
  }

  if (itemsTotal === 0) return 0

  const shareRatio = selectedSum / itemsTotal
  const share = billTotal * shareRatio

  return Math.round(share * 100) / 100
}
CALCLIB

# utils.ts
cat > src/lib/utils.ts << 'UTILSLIB'
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
UTILSLIB

echo "✓ Created all lib files"
echo ""

# ============================================================================
# STEP 7: Create UI components
# ============================================================================
print_step "7" "Creating UI components..."

# Button
cat > src/components/ui/button.tsx << 'BUTTONCOMP'
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-indigo-600 text-white hover:bg-indigo-700",
        destructive: "bg-red-500 text-white hover:bg-red-600",
        outline: "border border-gray-300 bg-transparent hover:bg-gray-100",
        secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
        ghost: "hover:bg-gray-100 hover:text-gray-900",
        link: "text-indigo-600 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
BUTTONCOMP

# Input
cat > src/components/ui/input.tsx << 'INPUTCOMP'
import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-base ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-gray-950 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
INPUTCOMP

# Card
cat > src/components/ui/card.tsx << 'CARDCOMP'
import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("rounded-3xl border border-gray-200 bg-white text-gray-950 shadow-sm", className)}
      {...props}
    />
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  )
)
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-2xl font-semibold leading-none tracking-tight", className)} {...props} />
  )
)
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-sm text-gray-500", className)} {...props} />
  )
)
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  )
)
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  )
)
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
CARDCOMP

# Toaster
cat > src/components/ui/toaster.tsx << 'TOASTERCOMP'
import * as React from "react"

export function Toaster() {
  return null
}
TOASTERCOMP

echo "✓ Created UI components"
echo ""

# ============================================================================
# STEP 8: Create animation components
# ============================================================================
print_step "8" "Creating animation components..."

# LoadingDots
cat > src/components/animations/LoadingDots.tsx << 'LOADINGDOTS'
'use client'

import { motion } from 'framer-motion'

export function LoadingDots() {
  return (
    <div className="flex items-center justify-center gap-2">
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className="w-3 h-3 bg-indigo-600 rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: index * 0.2,
          }}
        />
      ))}
    </div>
  )
}
LOADINGDOTS

# PageTransition
cat > src/components/animations/PageTransition.tsx << 'PAGETRANSITION'
'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  )
}
PAGETRANSITION

echo "✓ Created animation components"
echo ""

# ============================================================================
# STEP 9: Create bill components
# ============================================================================
print_step "9" "Creating bill components..."

# BillItem
cat > src/components/bill/BillItem.tsx << 'BILLITEMCOMP'
'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, Circle } from 'lucide-react'
import { formatCurrency } from '@/lib/calculations'

interface BillItemProps {
  item: {
    id: string
    name: string
    price: number
    quantity?: number
    category?: string
    selected?: boolean
  }
  participantId?: string
  onToggle?: () => void
}

export function BillItemComponent({ item, participantId, onToggle }: BillItemProps) {
  const isSelectable = !!onToggle
  const isSelected = item.selected

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      onClick={isSelectable ? onToggle : undefined}
      className={`flex items-center justify-between p-4 rounded-2xl transition-all ${
        isSelectable ? 'cursor-pointer' : ''
      } ${
        isSelected
          ? 'bg-indigo-100 border-2 border-indigo-500'
          : 'bg-gray-50 border-2 border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-center gap-3 flex-1">
        {isSelectable && (
          <motion.div whileTap={{ scale: 0.9 }}>
            {isSelected ? (
              <CheckCircle2 className="w-6 h-6 text-indigo-600" />
            ) : (
              <Circle className="w-6 h-6 text-gray-400" />
            )}
          </motion.div>
        )}
        <div className="flex-1">
          <p className="font-semibold text-gray-900">{item.name}</p>
          {item.category && (
            <p className="text-xs text-gray-500 capitalize">{item.category}</p>
          )}
        </div>
      </div>
      <div className="text-right">
        <p className="font-bold text-lg font-mono">{formatCurrency(item.price)}</p>
        {item.quantity && item.quantity > 1 && (
          <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
        )}
      </div>
    </motion.div>
  )
}
BILLITEMCOMP

# ParticipantAvatar
cat > src/components/bill/ParticipantAvatar.tsx << 'PARTICIPANTAVATAR'
'use client'

import { motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'

interface ParticipantAvatarProps {
  name: string
  phone?: string | null
  isPaid?: boolean
}

export function ParticipantAvatar({ name, phone, isPaid }: ParticipantAvatarProps) {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

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
  )
}
PARTICIPANTAVATAR

# PaymentButton
cat > src/components/bill/PaymentButton.tsx << 'PAYMENTBUTTON'
'use client'

import { Button } from '@/components/ui/button'
import { Smartphone } from 'lucide-react'

interface PaymentButtonProps {
  amount: number
  onPay: () => void
  disabled?: boolean
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
  )
}
PAYMENTBUTTON

echo "✓ Created bill components"
echo ""

# ============================================================================
# STEP 10: Create store
# ============================================================================
print_step "10" "Creating Zustand store..."

cat > src/store/billStore.ts << 'BILLSTORE'
import { create } from 'zustand'

export interface BillItem {
  id: string
  name: string
  price: number
  quantity: number
  category?: string
}

interface BillStore {
  title: string
  totalAmount: number
  items: BillItem[]
  imageUrl?: string
  restaurantName?: string
  
  setTitle: (title: string) => void
  setTotalAmount: (amount: number) => void
  setItems: (items: BillItem[]) => void
  setImageUrl: (url: string) => void
  setRestaurantName: (name: string) => void
  reset: () => void
}

export const useBillStore = create<BillStore>((set) => ({
  title: '',
  totalAmount: 0,
  items: [],
  imageUrl: undefined,
  restaurantName: undefined,
  
  setTitle: (title) => set({ title }),
  setTotalAmount: (totalAmount) => set({ totalAmount }),
  setItems: (items) => set({ items }),
  setImageUrl: (imageUrl) => set({ imageUrl }),
  setRestaurantName: (restaurantName) => set({ restaurantName }),
  reset: () => set({
    title: '',
    totalAmount: 0,
    items: [],
    imageUrl: undefined,
    restaurantName: undefined,
  }),
}))
BILLSTORE

echo "✓ Created Zustand store"
echo ""

# ============================================================================
# STEP 11: Create middleware
# ============================================================================
print_step "11" "Creating Clerk middleware..."

cat > src/middleware.ts << 'MIDDLEWAREFILE'
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/bill/:path*',
  '/api/webhooks(.*)',
  '/api/parse-bill',
])

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
MIDDLEWAREFILE

echo "✓ Created middleware"
echo ""

# ============================================================================
# STEP 12: Create API routes
# ============================================================================
print_step "12" "Creating API routes..."

# Bill API - [shareId]/route.ts
cat > src/app/api/bill/\[shareId\]/route.ts << 'BILLSHAREIDROUTE'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ shareId: string }> }
) {
  try {
    const { shareId } = await context.params

    const bill = await prisma.bill.findUnique({
      where: { shareId },
      include: {
        items: {
          include: {
            participants: {
              include: {
                participant: true,
              },
            },
          },
        },
        participants: {
          include: {
            items: {
              select: {
                itemId: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            defaultUpi: true,
          },
        },
      },
    })

    if (!bill) {
      return NextResponse.json(
        { success: false, error: 'Bill not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      bill,
    })
  } catch (error) {
    console.error('Get bill error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bill' },
      { status: 500 }
    )
  }
}
BILLSHAREIDROUTE

# Participants API
cat > src/app/api/bill/\[shareId\]/participants/route.ts << 'PARTICIPANTSROUTE'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { calculateParticipantShare } from '@/lib/calculations'

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ shareId: string }> }
) {
  try {
    const { shareId } = await context.params
    const body = await req.json()
    const { name, phone, itemIds } = body

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      )
    }

    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Please select at least one item' },
        { status: 400 }
      )
    }

    const bill = await prisma.bill.findUnique({
      where: { shareId },
      include: {
        items: true,
        participants: true,
      },
    })

    if (!bill) {
      return NextResponse.json(
        { success: false, error: 'Bill not found' },
        { status: 404 }
      )
    }

    if (bill.participants.length >= 10) {
      return NextResponse.json(
        { success: false, error: 'Maximum 10 participants allowed' },
        { status: 400 }
      )
    }

    const itemsTotal = bill.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const share = calculateParticipantShare(
      bill.items,
      itemIds.map((id: string) => ({ itemId: id, quantity: 1 })),
      bill.totalAmount,
      itemsTotal
    )

    const participant = await prisma.billParticipant.create({
      data: {
        billId: bill.id,
        name: name.trim(),
        phone: phone?.trim() || null,
        theirShare: share,
        items: {
          create: itemIds.map((itemId: string) => ({
            itemId,
          })),
        },
      },
      include: {
        items: true,
      },
    })

    return NextResponse.json({
      success: true,
      participant,
    })
  } catch (error) {
    console.error('Join bill error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to join bill' },
      { status: 500 }
    )
  }
}
PARTICIPANTSROUTE

echo "✓ Created API routes"
echo ""

# ============================================================================
# STEP 13: Create config files
# ============================================================================
print_step "13" "Creating configuration files..."

# tsconfig.json
cat > tsconfig.json << 'TSCONFIG'
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts",
    "**/*.mts"
  ],
  "exclude": ["node_modules"]
}
TSCONFIG

# next.config.ts
cat > next.config.ts << 'NEXTCONFIG'
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
NEXTCONFIG

# postcss.config.mjs
cat > postcss.config.mjs << 'POSTCSSCONFIG'
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
POSTCSSCONFIG

echo "✓ Created configuration files"
echo ""

# ============================================================================
# STEP 14: Generate Prisma client and migrate
# ============================================================================
print_step "14" "Setting up database..."

npx prisma generate
npx prisma migrate dev --name init

echo "✓ Database ready"
echo ""

# ============================================================================
# STEP 15: Create .env file if it doesn't exist
# ============================================================================
print_step "15" "Setting up environment variables..."

if [ ! -f ".env" ]; then
    cat > .env << 'ENVFILE'
DATABASE_URL="file:./dev.db"

# REQUIRED - Get from https://clerk.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=

# REQUIRED - Get from https://platform.openai.com
OPENAI_API_KEY=

# OPTIONAL - Get from https://dashboard.razorpay.com
NEXT_PUBLIC_RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

NEXT_PUBLIC_APP_URL=http://localhost:3000
ENVFILE
    echo "✓ Created .env file"
else
    echo "✓ .env file already exists"
fi

echo ""

# ============================================================================
# FINAL STEPS
# ============================================================================

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              ✅ SETUP COMPLETE!                         ║${NC}"
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Before running the app, you MUST:${NC}"
echo ""
echo -e "${BLUE}1. Add your API keys to the .env file:${NC}"
echo "   Edit .env and add:"
echo "   - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (from clerk.com)"
echo "   - CLERK_SECRET_KEY (from clerk.com)"  
echo "   - OPENAI_API_KEY (from platform.openai.com)"
echo ""
echo -e "${BLUE}2. Set up Clerk webhook (CRITICAL!):${NC}"
echo "   a. Go to https://dashboard.clerk.com"
echo "   b. Select your app → Webhooks → Add Endpoint"
echo "   c. URL: http://localhost:3000/api/webhooks/clerk"
echo "   d. Events: user.created, user.updated, user.deleted"
echo "   e. Copy signing secret → Add to .env as CLERK_WEBHOOK_SECRET"
echo ""
echo -e "${BLUE}3. Start the development server:${NC}"
echo "   npm run dev"
echo ""
echo -e "${GREEN}4. Open http://localhost:3000${NC}"
echo ""
echo -e "${YELLOW}📚 For detailed instructions, see:${NC}"
echo "   - TROUBLESHOOTING.md (for your specific issues)"
echo "   - SETUP.md (complete setup guide)"
echo "   - README.md (overview)"
echo ""
echo -e "${RED}❗ The Clerk webhook is the #1 reason for errors!${NC}"
echo -e "${RED}   Don't skip step 2 above!${NC}"
echo ""
