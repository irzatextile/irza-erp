export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { createServiceClient } from '@/lib/supabase'

export async function GET(request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const domain = process.env.SHOPIFY_STORE_DOMAIN
    const clientId = process.env.SHOPIFY_CLIENT_ID
    const clientSecret = process.env.SHOPIFY_CLIENT_SECRET

    const res = await fetch(`https://${domain}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }),
    })

    const data = await res.json()
    if (!data.access_token) throw new Error('No access_token in response')

    const supabase = createServiceClient()
    const { error } = await supabase
      .from('settings')
      .upsert({ key: 'shopify_access_token', value: data.access_token, updated_at: new Date().toISOString() }, { onConflict: 'key' })

    if (error) throw error

    return Response.json({ success: true, expires_in: data.expires_in })
  } catch (err) {
    console.error('Token refresh error:', err)
    return Response.json({ success: false, error: err.message }, { status: 500 })
  }
}
