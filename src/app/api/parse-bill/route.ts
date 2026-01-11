import { NextRequest, NextResponse } from 'next/server'
import { parseBillFromImage } from '@/lib/openai'
import { z } from 'zod'

const parseBillSchema = z.object({
  image: z.string(),
  imageData: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    const validation = parseBillSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { image } = validation.data
    
    const result = await parseBillFromImage(image)
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error, provider: result.provider },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      provider: result.provider,
    })
  } catch (error: any) {
    console.error('Parse bill error:', error)
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to parse bill',
        provider: error.provider || null,
      },
      { status: 500 }
    )
  }
}
