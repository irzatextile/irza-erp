'use client'
import { createClient } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'

export default function DashboardLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navItems = [
    { href: '/inventory', label: 'Inventory', icon: '📦' },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{ width: 'var(--sidebar-width)', background: 'var(--bg2)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 100 }}>
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: '20px', fontWeight: '600', color: 'var(--gold)', letterSpacing: '2px' }}>IRZA</div>
          <div style={{ fontSize: '10px', color: 'var(--text3)', letterSpacing: '2px', marginTop: '2px' }}>ERP SYSTEM</div>
        </div>
        <nav style={{ padding: '12px 8px', flex: 1 }}>
          {navItems.map(item => (
            <a key={item.href} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: 'var(--radius)', color: pathname === item.href ? 'var(--text)' : 'var(--text2)', background: pathname === item.href ? 'var(--bg3)' : 'transparent', fontSize: '13px', fontWeight: pathname === item.href ? '500' : '400', marginBottom: '2px', transition: 'all 0.15s' }}>
              <span>{item.icon}</span>{item.label}
            </a>
          ))}
        </nav>
        <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)' }}>
          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: 'var(--radius)', color: 'var(--text2)', background: 'transparent', border: 'none', width: '100%', fontSize: '13px', cursor: 'pointer' }}>
            <span>🚪</span>Logout
          </button>
        </div>
      </aside>
      <main style={{ marginLeft: 'var(--sidebar-width)', flex: 1, minHeight: '100vh', background: 'var(--bg)' }}>
        {children}
      </main>
    </div>
  )
}
