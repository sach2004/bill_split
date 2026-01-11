import { NextRequest, NextResponse } from 'next/server'
import { parseBillFromImage, parseBillFromMultipleImages } from '@/lib/openai'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { image, images, multiple } = body
    
    if (!image && (!images || !Array.isArray(images))) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      )
    }

    let result

    if (multiple && images && images.length > 1) {
      // Multiple images
      result = await parseBillFromMultipleImages(images)
    } else {
      // Single image
      result = await parseBillFromImage(image || images[0])
    }
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error, provider: result.provider },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { ...result.data, provider: result.provider },
      provider: result.provider,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to parse' },
      { status: 500 }
    )
  }
}
