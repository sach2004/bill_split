import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { currentUser } from '@clerk/nextjs/server'
import { generateShareId } from '@/lib/calculations'
import { z } from 'zod'

const createBillSchema = z.object({
  title: z.string().min(1),
  imageUrl: z.string().url().optional(),
  totalAmount: z.number().positive(),
  restaurantName: z.string().optional(),
  location: z.string().optional(),
  items: z.array(z.object({
    name: z.string(),
    price: z.number(),
    quantity: z.number().int().positive(),
    category: z.string().optional(),
  })),
})

export async function POST(req: NextRequest) {
  try {
    const { userId } = await currentUser()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const validation = createBillSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid bill data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const billData = validation.data
    
    const shareId = generateShareId()

    const bill = await prisma.bill.create({
      data: {
        shareId,
        title: billData.title,
        imageUrl: billData.imageUrl,
        totalAmount: billData.totalAmount,
        restaurantName: billData.restaurantName,
        location: billData.location,
        createdById: userId,
        items: {
          create: billData.items.map(item => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            category: item.category,
          })),
        },
      },
    })

    return NextResponse.json({
      success: true,
      bill,
    })
  } catch (error) {
    console.error('Create bill error:', error)
    return NextResponse.json(
      { error: 'Failed to create bill' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await currentUser()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const bills = await prisma.bill.findMany({
      where: {
        OR: [
          { createdById: userId },
          { participants: { some: { userId } } },
        ],
      },
      include: {
        items: true,
        participants: {
          include: {
            items: {
              select: {
                id: true,
                name: true,
                price: true,
                quantity: true,
                category: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      success: true,
      bills,
    })
  } catch (error) {
    console.error('Get bills error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bills' },
      { status: 500 }
    )
  }
}
