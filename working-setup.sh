#!/bin/bash

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          SplitBills - WORKING Fix Script              ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo ""

print_step() {
    echo -e "${GREEN}[STEP $1]${NC} $2"
}

set -e

PROJECT_DIR=$(pwd)
echo -e "Working directory: ${BLUE}$PROJECT_DIR${NC}"
echo ""

# ============================================================================
# STEP 1: Clean up
# ============================================================================
print_step "1" "Cleaning up..."

pkill -f "next dev" 2>/dev/null || true

rm -rf node_modules package-lock.json .next 2>/dev/null || true
rm -f prisma/dev.db prisma/dev.db-journal 2>/dev/null || true

echo "✓ Cleaned up old files"
echo ""

# ============================================================================
# STEP 2: Create directories
# ============================================================================
print_step "2" "Creating directories..."

mkdir -p src/lib
mkdir -p src/components/ui
mkdir -p src/components/bill
mkdir -p src/components/animations
mkdir -p src/store
mkdir -p src/app/api/bill/\[shareId\]/participants
mkdir -p src/app/api/parse-bill
mkdir -p src/app/api/webhooks/clerk
mkdir -p prisma

echo "✓ Created directories"
echo ""

# ============================================================================
# STEP 3: Create package.json with WORKING versions
# ============================================================================
print_step "3" "Creating package.json..."

cat > package.json << 'EOF'
{
  "name": "money-splitter",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "postinstall": "prisma generate"
  },
  "dependencies": {
    "@clerk/nextjs": "^6.12.0",
    "@prisma/client": "^5.20.0",
    "@radix-ui/react-slot": "^1.1.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "framer-motion": "^11.11.17",
    "lucide-react": "^0.460.0",
    "next": "^15.2.3",
    "openai": "^4.77.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "tailwind-merge": "^2.5.5",
    "zod": "^3.23.8",
    "zustand": "^5.0.1"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.0.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "eslint": "^9.0.0",
    "eslint-config-next": "^15.2.3",
    "postcss": "^8.4.49",
    "prisma": "^5.20.0",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.6.0"
  }
}
EOF

echo "✓ Created package.json"
echo ""

# ============================================================================
# STEP 4: Install with legacy peer deps
# ============================================================================
print_step "4" "Installing dependencies..."

npm install --legacy-peer-deps

echo "✓ Installed dependencies"
echo ""

# ============================================================================
# STEP 5: Create Prisma schema
# ============================================================================
print_step "5" "Creating database schema..."

cat > prisma/schema.prisma << 'EOF'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id         String   @id @default(uuid())
  clerkId    String   @unique
  email      String   @unique
  name       String?
  phone      String?
  defaultUpi String?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

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
EOF

echo "✓ Created schema"
echo ""

# ============================================================================
# STEP 6: Create lib files
# ============================================================================
print_step "6" "Creating lib files..."

cat > src/lib/prisma.ts << 'EOF'
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
EOF

cat > src/lib/utils.ts << 'EOF'
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
EOF

cat > src/lib/calculations.ts << 'EOF'
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
EOF

cat > src/lib/openai.ts << 'EOF'
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
    return { success: false, error: 'OpenAI API key not configured', provider: 'openai' }
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '')

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: 'Extract bill items in JSON: {items:[{name,price,quantity,category}],totalAmount,restaurantName}' },
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Data}` } }
        ],
      }],
      max_tokens: 1500,
      temperature: 0.1,
    })

    const content = response.choices[0]?.message?.content?.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '')
    if (!content) return { success: false, error: 'No response', provider: 'openai' }

    const parsedBill = JSON.parse(content) as ParsedBill
    if (!parsedBill.items?.length) return { success: false, error: 'No items found', provider: 'openai' }

    return { success: true, data: parsedBill, provider: 'openai' }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to parse', provider: 'openai' }
  }
}
EOF

echo "✓ Created lib files"
echo ""

# ============================================================================
# STEP 7: Create UI components
# ============================================================================
print_step "7" "Creating UI components..."

cat > src/components/ui/button.tsx << 'EOF'
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-indigo-600 text-white hover:bg-indigo-700",
        outline: "border border-gray-300 bg-transparent hover:bg-gray-100",
        ghost: "hover:bg-gray-100",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
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
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
EOF

cat > src/components/ui/input.tsx << 'EOF'
import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50",
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
EOF

cat > src/components/ui/card.tsx << 'EOF'
import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("rounded-3xl border border-gray-200 bg-white shadow-sm", className)} {...props} />
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
    <div ref={ref} className={cn("text-2xl font-semibold", className)} {...props} />
  )
)
CardTitle.displayName = "CardTitle"

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  )
)
CardContent.displayName = "CardContent"

export { Card, CardHeader, CardTitle, CardContent }
EOF

cat > src/components/ui/toaster.tsx << 'EOF'
export function Toaster() { return null }
EOF

echo "✓ Created UI components"
echo ""

# ============================================================================
# STEP 8: Create middleware
# ============================================================================
print_step "8" "Creating middleware..."

cat > src/middleware.ts << 'EOF'
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
EOF

echo "✓ Created middleware"
echo ""

# ============================================================================
# STEP 9: Setup database
# ============================================================================
print_step "9" "Setting up database..."

npx prisma generate
npx prisma migrate dev --name init

echo "✓ Database ready"
echo ""

# ============================================================================
# STEP 10: Create .env
# ============================================================================
print_step "10" "Creating .env file..."

if [ ! -f ".env" ]; then
    cat > .env << 'EOF'
DATABASE_URL="file:./dev.db"

# Get from https://dashboard.clerk.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=

# Get from https://platform.openai.com
OPENAI_API_KEY=

NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF
    echo "✓ Created .env"
else
    echo "✓ .env exists"
fi

echo ""
echo -e "${GREEN}✅ SETUP COMPLETE!${NC}"
echo ""
echo -e "${YELLOW}NEXT STEPS:${NC}"
echo ""
echo "1. Add API keys to .env file"
echo "2. Run: npm run dev"
echo "3. Open: http://localhost:3000"
echo ""
