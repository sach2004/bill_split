# SplitBills - Money Splitter Application

A modern, cartoonish bill splitting application built with Next.js 15, featuring AI-powered bill parsing, real-time collaboration, and UPI payments via Razorpay.

## 🚀 Features

- **AI Bill Scanning**: Upload bill images and let GPT-4o Vision automatically extract items, prices, and details
- **Easy Sharing**: Generate unique shareable links (max 10 participants per bill)
- **Real-time Updates**: Polling-based updates for participant changes
- **UPI Payments**: Secure payments via PhonePe, Google Pay, Paytm
- **Bill History**: Track all your bills and payments in dashboard
- **Mobile-First Design**: Cartoonish, playful UX optimized for mobile devices
- **Smooth Animations**: Bouncy, friendly animations using Framer Motion

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS with custom cartoonish design system
- **Authentication**: Clerk
- **Database**: SQLite (Prisma ORM) - easily switchable to PostgreSQL
- **AI/ML**: OpenAI GPT-4o Vision for bill parsing
- **Payments**: Razorpay integration for Indian UPI
- **Animations**: Framer Motion
- **State Management**: Zustand

## 📋 Prerequisites

Before running the application, you'll need to set up accounts for these services:

### 1. Clerk (Authentication)
1. Go to [clerk.com](https://clerk.com)
2. Create a new application
3. Get your API keys from the dashboard
4. Set up JWT templates and webhooks

### 2. OpenAI (Bill Parsing)
1. Go to [platform.openai.com](https://platform.openai.com)
2. Create an API key
3. Ensure you have access to GPT-4o Vision model
4. Note: Costs ~$0.01 per image

### 3. Razorpay (Payments)
1. Go to [dashboard.razorpay.com](https://dashboard.razorpay.com)
2. Create a test account
3. Get your key ID and secret
4. Configure webhook endpoints in production

## 🚦 Installation

1. **Install dependencies**
```bash
npm install
```

2. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` and add your API keys:
```env
# Database
DATABASE_URL="file:./dev.db"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here

# OpenAI API
OPENAI_API_KEY=sk-proj_your_openai_key_here

# Razorpay Payments
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_secret_here
```

3. **Set up database**
```bash
npx prisma generate
npx prisma migrate dev
```

4. **Run development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
money-splitter/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Authentication routes
│   ├── api/                 # API routes
│   ├── bill/[shareId]/      # Shared bill page
│   ├── create-bill/          # Bill creation flow
│   └── dashboard/           # User dashboard
├── components/
│   ├── ui/                  # Base UI components
│   ├── bill/                # Bill-specific components
│   └── animations/          # Animation components
├── lib/                     # Utility libraries
│   ├── prisma.ts           # Prisma client
│   ├── openai.ts           # OpenAI integration
│   ├── calculations.ts      # Bill calculation helpers
│   └── utils.ts           # General utilities
├── store/                   # Zustand state management
└── prisma/                  # Database schema & migrations
```

## 🎨 Design System

### Colors
- **Primary**: Indigo (#6366f1)
- **Secondary**: Pink (#f472b6)
- **Accent**: Amber (#fbbf24)
- **Success**: Green (#34d399)
- **Background**: Cream (#fef3c7)

### Typography
- **Headings**: Poppins (rounded, friendly)
- **Body**: Inter (readable)
- **Numbers**: Space Mono (for prices)

### Animation Style
- Bouncy spring physics
- Scale effects on hover/tap
- Staggered entrances
- Smooth page transitions

## 🚀 Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

## 📄 License

MIT
# bill_split
