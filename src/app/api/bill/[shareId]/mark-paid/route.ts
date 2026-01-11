import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  try {
    const { shareId } = await params
    const body = await req.json()
    const { participantId } = body

    if (!participantId) {
      return NextResponse.json(
        { success: false, error: 'Participant ID required' },
        { status: 400 }
      )
    }

    const bill = await prisma.bill.findUnique({
      where: { shareId },
      include: { participants: true }
    })

    if (!bill) {
      return NextResponse.json(
        { success: false, error: 'Bill not found' },
        { status: 404 }
      )
    }

    const participant = bill.participants.find(p => p.id === participantId)
    if (!participant) {
      return NextResponse.json(
        { success: false, error: 'Participant not found' },
        { status: 404 }
      )
    }

    await prisma.billParticipant.update({
      where: { id: participantId },
      data: { isPaid: true }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Mark paid error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to mark as paid' },
      { status: 500 }
    )
  }
}
