import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { calculateParticipantShare } from '@/lib/calculations'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  try {
    const { shareId } = await params
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

    // NO PARTICIPANT LIMIT - removed the 10 person cap

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
