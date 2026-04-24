'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'

export default function InventoryPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [search, setSearch] = useState('')
  const [stockFilter, setStockFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [syncMsg, setSyncMsg] = useState('')
  const [analyzingId, setAnalyzingId] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const supabase = createClient()

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    let query = supabase.from('products').select('*').order('parent_title')
    if (search) query = query.or(`parent_title.ilike.%${search}%,sku.ilike.%${search}%`)
    if (statusFilter !== 'all') query = query.eq('status', statusFilter)
    if (stockFilter === 'low') query = query.lte('inventory_quantity', 3).gt('inventory_quantity', 0)
    else if (stockFilter === 'out') query = query.lte('inventory_quantity', 0)
    const { data, error } = await query
    if (!error) setProducts(data || [])
    setLoading(false)
  }, [search, stockFilter, statusFilter])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  async function handleSync() {
    setSyncing(true)
    setSyncMsg('')
    try {
      const res = await fetch('/api/shopify/products', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setSyncMsg(`✅ ${data.total_variants_synced} variants synced`)
        fetchProducts()
      } else {
        setSyncMsg(`❌ Error: ${data.error}`)
      }
    } catch (err) {
      setSyncMsg(`❌ ${err.message}`)
    }
    setSyncing(false)
  }

  async function handleSEO(product) {
    setAnalyzingId(product.id)
    try {
      const res = await fetch('/api/seo/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: product.id }),
      })
      const data = await res.json()
      if (data.success) {
        setSelectedProduct({ ...product, ...data })
        fetchProducts()
      } else {
        alert('SEO Error: ' + data.error)
      }
    } catch (err) {
      alert('SEO Error: ' + err.message)
    }
    setAnalyzingId(null)
  }

  const totalProducts = new Set(products.map(p => p.shopify_product_id)).size
  const totalVariants = products.length
  const totalUnits = products.reduce((sum, p) => sum + (p.inventory_quantity || 0), 0)
  const lowStock = products.filter(p => p.inventory_quantity > 0 && p.inventory_quantity <= 3).length
  const outOfStock = products.filter(p => p.inventory_quantity <= 0).length
  const active = products.filter(p => p.status === 'active').length

  const stats = [
    { label: 'Products', value: totalProducts, color: 'var(--text)' },
    { label: 'Variants', value: totalVariants, color: 'var(--text)' },
    { label: 'Total Units', value: totalUnits, color: 'var(--blue)' },
    { label: 'Low Stock', value: lowStock, color: 'var(--yellow)' },
    { label: 'Out of Stock', value: outOfStock, color: 'var(--red)' },
    { label: 'Active', value: active, color: 'var(--green)' },
  ]

  function getStockBadge(qty) {
    if (qty <= 0) return <span className="badge badge-red">Out</span>
    if (qty <= 3) return <span className="badge badge-yellow">Low</span>
    return <span className="badge badge-green">{qty}</span>
  }

  function getSEOBadge(tier) {
    if (!tier) return <span className="badge badge-gray">○ None</span>
    if (tier === 'green') return <span className="badge badge-green">● Good</span>
    if (tier === 'yellow') return <span className="badge badge-yellow">● Fair</span>
    return <span className="badge badge-red">● Poor</span>
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px' }}>
      {selectedProduct && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#000000aa', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setSelectedProduct(null)}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '32px', maxWidth: '500px', width: '90%' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '600' }}>SEO Analysis</h2>
              <button onClick={() => setSelectedProduct(null)} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: '20px', cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text2)', marginBottom: '4px' }}>PRODUCT</div>
              <div style={{ fontSize: '13px' }}>{selectedProduct.parent_title}</div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text2)', marginBottom: '4px' }}>SEO SCORE</div>
              <div style={{ fontSize: '24px', fontWeight: '600', color: selectedProduct.seo_tier === 'green' ? 'var(--green)' : selectedProduct.seo_tier === 'yellow' ? 'var(--yellow)' : 'var(--red)' }}>
                {selectedProduct.seo_score}/100
              </div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text2)', marginBottom: '4px' }}>OPTIMIZED TITLE</div>
              <div style={{ fontSize: '13px', background: 'var(--bg3)', padding: '8px 12px', borderRadius: 'var(--radius)' }}>{selectedProduct.seo_title}</div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text2)', marginBottom: '4px' }}>META DESCRIPTION</div>
              <div style={{ fontSize: '13px', background: 'var(--bg3)', padding: '8px 12px', borderRadius: 'var(--radius)' }}>{selectedProduct.seo_description}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text2)', marginBottom: '8px' }}>SUGGESTIONS</div>
              {selectedProduct.suggestions?.map((s, i) => (
                <div key={i} style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '6px' }}>• {s}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '600' }}>Inventory</h1>
          <p style={{ color: 'var(--text2)', fontSize: '13px', marginTop: '2px' }}>Irza Textile — Men's Unstitched</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {syncMsg && <span style={{ fontSize: '13px', color: syncMsg.startsWith('✅') ? 'var(--green)' : 'var(--red)' }}>{syncMsg}</span>}
          <button className="btn btn-primary" onClick={handleSync} disabled={syncing}>
            {syncing ? '⏳ Syncing...' : '🔄 Sync from Shopify'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {stats.map(stat => (
          <div key={stat.label} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '600', color: stat.color }}>{stat.value.toLocaleString()}</div>
            <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '4px', letterSpacing: '0.5px' }}>{stat.label.toUpperCase()}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input type="text" placeholder="Search by name or SKU..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: '200px', padding: '8px 12px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: '13px', outline: 'none' }} />
        <select value={stockFilter} onChange={e => setStockFilter(e.target.value)}
          style={{ padding: '8px 12px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: '13px', outline: 'none' }}>
          <option value="all">All Stock</option>
          <option value="low">Low Stock (≤3)</option>
          <option value="out">Out of Stock</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '8px 12px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: '13px', outline: 'none' }}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text2)' }}>Loading products...</div>
        ) : products.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📦</div>
            <div style={{ color: 'var(--text2)', marginBottom: '16px' }}>No products yet. Click "Sync from Shopify" to import your catalog.</div>
            <button className="btn btn-primary" onClick={handleSync} disabled={syncing}>{syncing ? '⏳ Syncing...' : '🔄 Sync from Shopify'}</button>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Product', 'SKU', 'Variant', 'Price', 'Stock', 'Status', 'SEO', 'Action'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', color: 'var(--text2)', fontWeight: '500', letterSpacing: '0.5px' }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((product, i) => (
                <tr key={product.id} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : '#ffffff04' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : '#ffffff04'}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {product.image_url && <img src={product.image_url} alt="" style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover' }} />}
                      <span style={{ fontWeight: '500', fontSize: '13px' }}>{product.parent_title}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}><span className="mono" style={{ color: 'var(--text2)' }}>{product.sku || '—'}</span></td>
                  <td style={{ padding: '12px 16px', color: 'var(--text2)', fontSize: '12px' }}>{product.variant_title || '—'}</td>
                  <td style={{ padding: '12px 16px' }}><span style={{ color: 'var(--gold)', fontWeight: '500' }}>Rs {parseFloat(product.price).toLocaleString()}</span></td>
                  <td style={{ padding: '12px 16px' }}>{getStockBadge(product.inventory_quantity)}</td>
                  <td style={{ padding: '12px 16px' }}><span className={`badge ${product.status === 'active' ? 'badge-green' : 'badge-gray'}`}>{product.status}</span></td>
                  <td style={{ padding: '12px 16px' }}>{getSEOBadge(product.seo_tier)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <button
                      onClick={() => handleSEO(product)}
                      disabled={analyzingId === product.id}
                      style={{ padding: '4px 10px', fontSize: '11px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text2)', cursor: 'pointer' }}>
                      {analyzingId === product.id ? '⏳' : '🔍 SEO'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div style={{ marginTop: '12px', color: 'var(--text2)', fontSize: '12px' }}>Showing {products.length} variants</div>
    </div>
  )
}
