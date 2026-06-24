import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import TeddyBear from '../components/TeddyBear'
import ProductsManager from '../components/ProductsManager'

const SH = (x: number, y: number, b: number, c: string) => `${x}px ${y}px ${b}px ${c}`

export default function AdminPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'products' | 'orders' | 'users'>('products')

  const tabs = {
    products: 'מוצרים',
    orders: 'הזמנות',
    users: 'משתמשים'
  }

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: '#FFFCF7', fontFamily: 'Heebo, sans-serif', position: 'relative' }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: 'linear-gradient(rgba(123,91,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(123,91,255,.05) 1px,transparent 1px)', backgroundSize: '34px 34px' }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 800, margin: '0 auto', padding: '40px 24px 80px' }}>
        <button
          onClick={() => navigate('/')}
          style={{ cursor: 'pointer', background: 'transparent', border: '2px solid #EBE3D6', borderRadius: 999, padding: '8px 16px', fontWeight: 600, fontSize: 14, color: '#4A4453', marginBottom: 32 }}
        >
          חזרה לחנות ←
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 30 }}>
          <div style={{ background: '#7B5BFF', border: '3px solid #16121F', borderRadius: 16, padding: '10px 12px', boxShadow: SH(4, 4, 0, '#16121F') }}>
            <TeddyBear size={36} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontFamily: 'Rubik, sans-serif', fontWeight: 700, fontSize: 32 }}>לוח בקרה</h1>
            <p style={{ margin: '2px 0 0', fontSize: 14, color: '#8A8194' }}>{user?.email}</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '2.5px solid #16121F', paddingBottom: 12 }}>
          {(['products', 'orders', 'users'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '10px 16px',
                background: tab === t ? '#FF3D8B' : '#fff',
                color: tab === t ? '#fff' : '#16121F',
                border: '2px solid #16121F',
                borderRadius: 10,
                fontFamily: 'Heebo, sans-serif',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              {tabs[t]}
            </button>
          ))}
        </div>

        {/* Content */}
        {tab === 'products' && <ProductsManager />}
        {tab === 'orders' && (
          <div style={{ padding: '20px', background: '#FFF6FB', borderRadius: 14, border: '2px solid #EBE3D6', textAlign: 'center', color: '#8A8194' }}>
            בקרוב
          </div>
        )}
        {tab === 'users' && (
          <div style={{ padding: '20px', background: '#FFF6FB', borderRadius: 14, border: '2px solid #EBE3D6', textAlign: 'center', color: '#8A8194' }}>
            בקרוב
          </div>
        )}
      </div>
    </div>
  )
}
