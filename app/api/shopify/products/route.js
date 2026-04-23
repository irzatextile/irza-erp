export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { createServiceClient } from '@/lib/supabase'

export async function POST() {
  try {
    const domain = process.env.SHOPIFY_STORE_DOMAIN
    const token = process.env.SHOPIFY_ACCESS_TOKEN
    const supabase = createServiceClient()

    let products = []
    let url = `https://${domain}/admin/api/2024-01/products.json?limit=250&fields=id,title,status,variants,images,product_type,tags,handle`

    while (url) {
      const res = await fetch(url, {
        headers: {
          'X-Shopify-Access-Token': token,
          'Content-Type': 'application/json',
        },
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Shopify error: ${res.status} ${text}`)
      }

      const data = await res.json()
      products = [...products, ...data.products]

      const linkHeader = res.headers.get('Link')
      if (linkHeader && linkHeader.includes('rel="next"')) {
        const match = linkHeader.match(/<([^>]+)>;\s*rel="next"/)
        url = match ? match[1] : null
      } else {
        url = null
      }
    }

    let synced = 0
    let errors = 0

    for (const product of products) {
      const image = product.images?.[0]?.src || null
      const variants = product.variants || []

      for (const variant of variants) {
        const row = {
          shopify_product_id: String(product.id),
          shopify_variant_id: String(variant.id),
          parent_title: product.title,
          variant_title: variant.title === 'Default Title' ? null : variant.title,
          sku: variant.sku || null,
          price: parseFloat(variant.price) || 0,
          compare_at_price: variant.compare_at_price ? parseFloat(variant.compare_at_price) : null,
          inventory_quantity: variant.inventory_quantity || 0,
          status: product.status,
          product_type: product.product_type || null,
          tags: product.tags ? product.tags.split(', ').filter(Boolean) : [],
          image_url: image,
          handle: product.handle,
          updated_at: new Date().toISOString(),
        }

        const { error } = await supabase
          .from('products')
          .upsert(row, { onConflict: 'shopify_variant_id' })

        if (error) {
          console.error('Upsert error:', error)
          errors++
        } else {
          synced++
        }
      }
    }

    return Response.json({
      success: true,
      total_products: products.length,
      total_variants_synced: synced,
      errors,
    })
  } catch (err) {
    console.error('Sync error:', err)
    return Response.json({ success: false, error: err.message }, { status: 500 })
  }
}
