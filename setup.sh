#!/bin/bash

echo "🚀 SplitBills Setup Script"
echo ""
echo "This script will help you set up the required API keys."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
  echo "📝 Creating .env file from .env.example..."
  cp .env.example .env
  echo "✅ Created .env file"
else
  echo "✅ .env file already exists"
fi

echo ""
echo "📋 You need to set up the following API keys:"
echo ""
echo "1️⃣  Clerk (Authentication)"
echo "   → Go to: https://clerk.com"
echo "   → Create a new application"
echo "   → Get keys and add to .env"
echo ""
echo "2️⃣  OpenAI (Bill Parsing)"
echo "   → Go to: https://platform.openai.com"
echo "   → Create API key with GPT-4o Vision access"
echo "   → Add OPENAI_API_KEY to .env"
echo "   → Cost: ~$0.01 per bill image"
echo ""
echo "3️⃣  Razorpay (Payments - Optional for now)"
echo "   → Go to: https://dashboard.razorpay.com"
echo "   → Get test keys for UPI payments"
echo ""
echo "📝 After adding keys to .env, run:"
echo "   npm install"
echo "   npx prisma generate"
echo "   npx prisma migrate dev"
echo "   npm run dev"
echo ""
echo "🌐 Then open http://localhost:3000"
echo ""
