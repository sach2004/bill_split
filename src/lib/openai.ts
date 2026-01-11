import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'

let openaiClient: OpenAI | null = null
let geminiClient: GoogleGenerativeAI | null = null

if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_key_here') {
  openaiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

if (process.env.GOOGLE_GEMINI_API_KEY && process.env.GOOGLE_GEMINI_API_KEY !== 'your_google_gemini_api_key_here') {
  geminiClient = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY)
}

const SYSTEM_PROMPT = `Extract all information from restaurant bills and return strictly valid JSON with the following structure:
{
  "restaurantName": "string (restaurant name, optional)",
  "totalAmount": "number (total bill amount)",
  "items": [
    {
      "name": "string (item name)",
      "price": "number (item price)",
      "quantity": "number (item quantity, default 1)",
      "category": "food" | "drinks" | "tax" | "service" | "other"
    }
  ]
}

Rules:
- Extract ALL items visible in bill
- Calculate quantity if shown
- Categorize items appropriately (food, drinks, tax, service, other)
- Include taxes and service charges as items with category "tax" or "service"
- Return ONLY valid JSON, no additional text
- Prices must be positive numbers
- If total is shown, use that, otherwise sum items
- Ensure JSON is valid and properly formatted`

async function parseWithOpenAI(imageBase64: string) {
  if (!openaiClient) {
    throw new Error('OpenAI API key not configured')
  }

  try {
    const response = await openaiClient.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: imageBase64,
              },
            },
          ],
        },
      ],
      temperature: 0.1,
      max_tokens: 2000,
    })

    const content = response.choices[0]?.message?.content

    if (!content) {
      throw new Error('No content received from OpenAI')
    }

    const cleanedContent = content
      .replace(/^```json\s*/, '')
      .replace(/```\s*$/, '')
      .trim()

    const parsed = JSON.parse(cleanedContent)

    return {
      success: true,
      data: parsed,
      provider: 'openai',
    }
  } catch (error: any) {
    console.error('OpenAI API error:', error)
    
    if (error.message?.includes('DOCTYPE') || error.message?.includes('HTML')) {
      throw new Error('API returned HTML instead of JSON. This usually means the API key is invalid or quota exceeded.')
    }

    throw new Error(`OpenAI parsing failed: ${error.message}`)
  }
}

async function parseWithGemini(imageBase64: string) {
  if (!geminiClient) {
    throw new Error('Google Gemini API key not configured')
  }

  try {
    const model = geminiClient.getGenerativeModel({ model: 'gemini-pro-vision' })

    const imagePart = {
      inlineData: {
        data: imageBase64.split(',')[1],
        mimeType: 'image/jpeg',
      },
    }

    const prompt = `${SYSTEM_PROMPT}\n\nPlease analyze this bill image and extract the information.`

    const result = await model.generateContent([prompt, imagePart])

    const text = result.response.text()
    
    if (!text) {
      throw new Error('No content received from Gemini')
    }

    const cleanedText = text
      .replace(/^```json\s*/, '')
      .replace(/```\s*$/, '')
      .trim()

    const parsed = JSON.parse(cleanedText)

    return {
      success: true,
      data: parsed,
      provider: 'gemini',
    }
  } catch (error: any) {
    console.error('Gemini API error:', error)
    throw new Error(`Gemini parsing failed: ${error.message}`)
  }
}

export async function parseBillFromImage(imageBase64: string) {
  if (!imageBase64) {
    return {
      success: false,
      error: 'No image provided',
      provider: null,
    }
  }

  const providersToTry: Array<{ name: string; parse: () => Promise<any> }> = []

  if (openaiClient) {
    providersToTry.push({
      name: 'OpenAI',
      parse: () => parseWithOpenAI(imageBase64),
    })
  }

  if (geminiClient) {
    providersToTry.push({
      name: 'Google Gemini',
      parse: () => parseWithGemini(imageBase64),
    })
  }

  if (providersToTry.length === 0) {
    return {
      success: false,
      error: 'No AI provider configured. Please add OPENAI_API_KEY or GOOGLE_GEMINI_API_KEY to your .env file',
      provider: null,
    }
  }

  for (const provider of providersToTry) {
    try {
      const result = await provider.parse()
      return result
    } catch (error: any) {
      console.error(`${provider.name} failed:`, error)
      continue
    }
  }

  return {
    success: false,
    error: 'All AI providers failed. Please check your API keys.',
    provider: null,
  }
}

export default { openaiClient, geminiClient }
