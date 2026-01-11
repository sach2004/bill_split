import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth, currentUser } from '@clerk/nextjs/server'
import { generateShareId } from '@/lib/calculations'

export async function POST(req: NextRequest) {
  try {
    const authResult = await auth()
    const userId = authResult.userId
    const clerkUser = await currentUser()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get or create user in database
    let dbUser = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!dbUser) {
      const userName = clerkUser?.firstName && clerkUser?.lastName 
        ? `${clerkUser.firstName} ${clerkUser.lastName}`.trim()
        : clerkUser?.firstName || clerkUser?.username || 'User'

      dbUser = await prisma.user.create({
        data: {
          clerkId: userId,
          email: clerkUser?.emailAddresses?.[0]?.emailAddress || `user-${userId}@temp.com`,
          name: userName,
          phone: clerkUser?.phoneNumbers?.[0]?.phoneNumber || null,
        }
      })
    }

    const body = await req.json()
    const { title, imageUrl, totalAmount, restaurantName, items } = body
    
    if (!title || !totalAmount || !items) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const shareId = generateShareId()

    const bill = await prisma.bill.create({
      data: {
        shareId,
        title,
        imageUrl,
        totalAmount,
        restaurantName,
        createdById: dbUser.id,
        items: {
          create: items.map((item: any) => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity || 1,
            category: item.category,
          })),
        },
      },
      include: {
        items: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            defaultUpi: true,
          }
        }
      }
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
    const authResult = await auth()
    const userId = authResult.userId
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!dbUser) {
      return NextResponse.json({
        success: true,
        bills: [],
      })
    }

    const bills = await prisma.bill.findMany({
      where: {
        OR: [
          { createdById: dbUser.id },
          { participants: { some: { userId: dbUser.id } } },
        ],
      },
      include: {
        items: true,
        participants: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
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
