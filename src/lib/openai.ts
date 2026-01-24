import OpenAI from "openai";

export interface ParsedBillItem {
  name: string;
  price: number;
  quantity: number;
  category?: string;
}

export interface ParsedBill {
  items: ParsedBillItem[];
  totalAmount: number;
  restaurantName?: string;
  date?: string;
  confidence: number;
  taxes?: ParsedBillItem[];
}

async function tryOpenAI(base64Data: string): Promise<{
  success: boolean;
  data?: ParsedBill;
  error?: string;
}> {
  if (!process.env.OPENAI_API_KEY) {
    return { success: false, error: "OpenAI key not configured" };
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Extract ALL items from this bill/receipt in JSON format. IMPORTANT:
- If an item appears multiple times, include the TOTAL price (price * quantity)
- Extract ALL taxes separately (GST, Service Tax, Service Charge, etc.) as separate items
- Return format: {"items":[{"name":"item","price":TOTAL_PRICE,"quantity":qty,"category":"food/drink/service"}],"taxes":[{"name":"GST","price":amount,"quantity":1,"category":"tax"}],"totalAmount":finalTotal,"restaurantName":"name"}
- The "price" field should be the TOTAL price for that quantity
- Return ONLY valid JSON, no markdown, no backticks.`,
            },
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${base64Data}` },
            },
          ],
        },
      ],
      max_tokens: 2000,
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content
      ?.trim()
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "");
    if (!content) return { success: false, error: "No response" };

    const parsedBill = JSON.parse(content) as ParsedBill;
    if (!parsedBill.items?.length) return { success: false, error: "No items" };

    return { success: true, data: parsedBill };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function tryGemini(base64Data: string): Promise<{
  success: boolean;
  data?: ParsedBill;
  error?: string;
}> {
  if (!process.env.GOOGLE_GEMINI_API_KEY) {
    return { success: false, error: "Gemini key not configured" };
  }

  const models = ["gemini-1.5-flash-latest", "gemini-1.5-pro-latest"];

  for (const model of models) {
    try {
      console.log(`Trying: ${model}`);

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GOOGLE_GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: 'Extract ALL items with TOTAL prices (price*quantity) and taxes separately as JSON: {"items":[{"name":"item","price":TOTAL,"quantity":1}],"taxes":[{"name":"GST","price":amt,"quantity":1}],"totalAmount":500}. ONLY JSON.',
                  },
                  {
                    inline_data: { mime_type: "image/jpeg", data: base64Data },
                  },
                ],
              },
            ],
          }),
        },
      );

      if (!response.ok) {
        const err = await response.json();
        if (err.error?.message?.includes("quota")) {
          console.log(`${model}: Quota exceeded`);
          continue;
        }
        console.log(`${model}:`, err.error?.message);
        continue;
      }

      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) continue;

      const clean = text
        .trim()
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "");
      const parsed = JSON.parse(clean) as ParsedBill;

      if (parsed.items?.length) {
        console.log(`✓ ${model} success`);
        return { success: true, data: parsed };
      }
    } catch (e: any) {
      console.log(`${model}:`, e.message);
    }
  }

  return {
    success: false,
    error: "Gemini quota exceeded. Wait 24hrs or use OpenAI.",
  };
}

export async function parseBillFromImage(imageBase64: string): Promise<{
  success: boolean;
  data?: ParsedBill;
  error?: string;
  provider: string;
}> {
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

  if (process.env.OPENAI_API_KEY) {
    const openaiResult = await tryOpenAI(base64Data);
    if (openaiResult.success) {
      return { ...openaiResult, provider: "OpenAI" };
    }
  }

  const geminiResult = await tryGemini(base64Data);
  if (geminiResult.success) {
    return { ...geminiResult, provider: "Gemini" };
  }

  return {
    success: false,
    error:
      geminiResult.error ||
      "No AI provider available. Add OpenAI key or wait for Gemini quota reset.",
    provider: "none",
  };
}

export async function parseBillFromMultipleImages(images: string[]): Promise<{
  success: boolean;
  data?: ParsedBill;
  error?: string;
  provider: string;
}> {
  const allItems: ParsedBillItem[] = [];
  const allTaxes: ParsedBillItem[] = [];
  const itemNames = new Set<string>();
  const taxNames = new Set<string>();
  let totalAmount = 0;
  let restaurantName = "";
  let provider = "";

  for (const image of images) {
    const result = await parseBillFromImage(image);

    if (result.success && result.data) {
      provider = result.provider;

      for (const item of result.data.items) {
        const itemKey = `${item.name.toLowerCase()}-${item.price}`;
        if (!itemNames.has(itemKey)) {
          itemNames.add(itemKey);
          allItems.push(item);
        }
      }

      if (result.data.taxes) {
        for (const tax of result.data.taxes) {
          const taxKey = `${tax.name.toLowerCase()}-${tax.price}`;
          if (!taxNames.has(taxKey)) {
            taxNames.add(taxKey);
            allTaxes.push(tax);
          }
        }
      }

      if (result.data.totalAmount > totalAmount) {
        totalAmount = result.data.totalAmount;
      }

      if (!restaurantName && result.data.restaurantName) {
        restaurantName = result.data.restaurantName;
      }
    }
  }

  if (allItems.length === 0) {
    return {
      success: false,
      error: "No items found",
      provider: provider || "none",
    };
  }

  return {
    success: true,
    data: {
      items: allItems,
      taxes: allTaxes.length > 0 ? allTaxes : undefined,
      totalAmount,
      restaurantName,
      confidence: 85,
    },
    provider,
  };
}
