import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import TeddyBear from '../components/TeddyBear'

const SH = (x: number, y: number, b: number, c: string) => `${x}px ${y}px ${b}px ${c}`

export default function AdminPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const cards = [
    { label: 'Products', desc: 'Manage catalog items', bg: '#FFD9EC', ink: '#FF3D8B' },
    { label: 'Orders',   desc: 'View & fulfill orders', bg: '#CFE3FF', ink: '#2D7DD2' },
    { label: 'Users',    desc: 'Manage shopper accounts', bg: '#E6DBFF', ink: '#7B5BFF' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#FFFCF7', fontFamily: "'Space Grotesk', sans-serif", position: 'relative' }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: 'linear-gradient(rgba(123,91,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(123,91,255,.05) 1px,transparent 1px)', backgroundSize: '34px 34px' }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 800, margin: '0 auto', padding: '40px 24px 80px' }}>
        <button
          onClick={() => navigate('/')}
          style={{ cursor: 'pointer', background: 'transparent', border: '2px solid #EBE3D6', borderRadius: 999, padding: '8px 16px', fontWeight: 600, fontSize: 14, color: '#4A4453', marginBottom: 32 }}
        >
          ← Back to store
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 36 }}>
          <div style={{ background: '#7B5BFF', border: '3px solid #16121F', borderRadius: 16, padding: '10px 12px', boxShadow: SH(4, 4, 0, '#16121F') }}>
            <TeddyBear size={36} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontFamily: 'Fredoka, sans-serif', fontWeight: 700, fontSize: 32 }}>Admin Panel</h1>
            <p style={{ margin: '2px 0 0', fontSize: 14, color: '#8A8194' }}>Signed in as {user?.email}</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
          {cards.map(card => (
            <div key={card.label} style={{ background: '#fff', border: '2.5px solid #16121F', borderRadius: 20, boxShadow: SH(4, 4, 0, '#16121F'), overflow: 'hidden' }}>
              <div style={{ height: 80, background: card.bg, borderBottom: '2.5px solid #16121F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 700, fontSize: 28, color: card.ink }}>{card.label}</span>
              </div>
              <div style={{ padding: '14px 16px' }}>
                <p style={{ margin: '0 0 12px', fontSize: 13, color: '#6B6475' }}>{card.desc}</p>
                <span style={{ display: 'inline-block', background: '#FFE9B0', border: '2px solid #16121F', borderRadius: 999, padding: '4px 10px', fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 700 }}>
                  coming soon
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
