import { NextRequest, NextResponse } from 'next/server'
import { WebhookEvent } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const evt = body as WebhookEvent

    if (evt.type === 'user.created' || evt.type === 'user.updated') {
      const { id, email_addresses, first_name, last_name, phone_numbers } = evt.data
      
      const email = email_addresses?.[0]?.email_address || `user-${id}@temp.com`
      const name = `${first_name || ''} ${last_name || ''}`.trim() || null
      const phone = phone_numbers?.[0]?.phone_number || null

      await prisma.user.upsert({
        where: { clerkId: id },
        update: { email, name, phone },
        create: {
          clerkId: id,
          email,
          name,
          phone,
        },
      })

      console.log('✅ User synced:', id, email)
    }

    if (evt.type === 'user.deleted') {
      const { id } = evt.data
      if (id) {
        await prisma.user.delete({
          where: { clerkId: id },
        }).catch(err => console.log('User not found in DB:', id))
      }
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
