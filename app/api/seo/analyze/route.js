export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { createServiceClient } from '@/lib/supabase'

export async function POST(request) {
  try {
    const { product_id } = await request.json()
    const supabase = createServiceClient()

    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', product_id)
      .single()

    if (error || !product) throw new Error('Product not found')

    const prompt = `You are an SEO expert for a Pakistani textile ecommerce store. Analyze this product and respond ONLY with a raw JSON object. No markdown, no backticks, no explanation, just the JSON.

Product: ${product.parent_title}
Type: ${product.product_type || 'Unstitched Fabric'}
Price: Rs ${product.price}
Tags: ${product.tags?.join(', ') || 'none'}

Return exactly this JSON structure:
{"seo_title":"optimized title under 60 chars","seo_description":"meta description under 160 chars","seo_score":75,"seo_tier":"green","suggestions":["suggestion 1","suggestion 2","suggestion 3"]}`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const aiData = await response.json()
    const text = aiData.content[0].text
    const clean = text.replace(/```json|```/g, '').trim()
    const seoResult = JSON.parse(clean)

    const { error: updateError } = await supabase
      .from('products')
      .update({
        seo_title: seoResult.seo_title,
        seo_description: seoResult.seo_description,
        seo_score: seoResult.seo_score,
        seo_tier: seoResult.seo_tier,
        seo_suggestions: seoResult.suggestions,
        seo_analyzed_at: new Date().toISOString(),
      })
      .eq('id', product_id)

    if (updateError) throw updateError

    return Response.json({ success: true, ...seoResult })
  } catch (err) {
    console.error('SEO error:', err)
    return Response.json({ success: false, error: err.message }, { status: 500 })
  }
}
