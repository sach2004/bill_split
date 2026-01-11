import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  try {
    const { shareId } = await params

    const bill = await prisma.bill.findUnique({
      where: { shareId },
      include: {
        items: true,
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
            phone: true,
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  try {
    const authResult = await auth()
    if (!authResult.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { shareId } = await params

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: authResult.userId }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const bill = await prisma.bill.findUnique({
      where: { shareId }
    })

    if (!bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 })
    }

    if (bill.createdById !== dbUser.id) {
      return NextResponse.json({ error: 'Not authorized to delete this bill' }, { status: 403 })
    }

    await prisma.bill.delete({
      where: { shareId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
