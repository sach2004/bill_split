import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import prisma from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import crypto from 'crypto'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_demo',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'demo_secret',
})

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { amount, billId, toUserId, paymentMethod = 'RAZORPAY', payerUpi } = body

    if (!amount || !billId || !toUserId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const bill = await prisma.bill.findUnique({
      where: { id: billId },
      include: { createdBy: true },
    })

    if (!bill) {
      return NextResponse.json(
        { error: 'Bill not found' },
        { status: 404 }
      )
    }

    let razorpayOrderId = null
    let razorpayPaymentId = null

    if (paymentMethod === 'RAZORPAY' && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      const options = {
        amount: Math.round(amount * 100),
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
        notes: {
          billId,
          fromUserId: userId,
          toUserId,
        },
      }

      const order = await razorpay.orders.create(options)
      razorpayOrderId = order.id
    }

    const payment = await prisma.payment.create({
      data: {
        amount,
        razorpayOrderId,
        razorpayPaymentId,
        paymentMethod,
        payerUpi: paymentMethod === 'MANUAL_UPI' ? payerUpi : null,
        status: 'PENDING',
        billId,
        fromUserId: userId,
        toUserId,
      },
    })

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      order: razorpayOrderId ? { id: razorpayOrderId } : null,
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_demo',
      paymentMethod,
    })
  } catch (error) {
    console.error('Create payment error:', error)
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { paymentId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = body

    const secret = process.env.RAZORPAY_KEY_SECRET || 'demo_secret'
    
    const shasum = crypto.createHmac('sha256', secret)
    shasum.update(`${razorpayOrderId}|${razorpayPaymentId}`)
    const digest = shasum.digest('hex')

    if (digest !== razorpaySignature) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        razorpayPaymentId,
        status: 'COMPLETED',
      },
    })

    await prisma.billParticipant.updateMany({
      where: {
        userId: payment.fromUserId,
        billId: payment.billId,
      },
      data: {
        isPaid: true,
      },
    })

    return NextResponse.json({
      success: true,
      payment,
    })
  } catch (error) {
    console.error('Update payment error:', error)
    return NextResponse.json(
      { error: 'Failed to update payment' },
      { status: 500 }
    )
  }
}
