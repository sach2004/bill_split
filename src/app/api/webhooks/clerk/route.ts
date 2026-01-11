import { NextRequest, NextResponse } from 'next/server'
import { WebhookEvent } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const evt = body as WebhookEvent

    const clerkUserId = evt.data.id

    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'No user ID provided' },
        { status: 400 }
      )
    }

    switch (evt.type) {
      case 'user.created': {
        const { email_addresses, first_name, last_name, phone_numbers } = evt.data
        
        const email = email_addresses[0]?.email_address
        const name = `${first_name || ''} ${last_name || ''}`.trim()
        const phone = phone_numbers?.[0]?.phone_number

        await prisma.user.upsert({
          where: { clerkId: clerkUserId },
          update: { email, name, phone },
          create: {
            clerkId: clerkUserId,
            email,
            name,
            phone,
          },
        })
        break
      }

      case 'user.deleted': {
        await prisma.user.delete({
          where: { clerkId: clerkUserId },
        })
        break
      }

      default:
        break
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
