import { useEffect, useState } from 'react'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { db } from '../firebase'
import TeddyBear from '../components/TeddyBear'

const SH = (x: number, y: number, b: number, c: string) => `${x}px ${y}px ${b}px ${c}`

export default function ProfilePage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState(false)
  const [createdAt, setCreatedAt] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    async function load() {
      const snap = await getDoc(doc(db, 'users', user!.uid))
      if (snap.exists()) {
        const data = snap.data()
        setPhone(data.phone ?? '')
        if (data.createdAt?.toDate) {
          setCreatedAt(data.createdAt.toDate().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }))
        }
      }
    }
    void load()
  }, [user?.uid])

  if (!user) return <Navigate to="/" replace />

  async function savePhone() {
    setSaving(true)
    await updateDoc(doc(db, 'users', user.uid), { phone })
    setSaving(false)
    setSavedMsg(true)
    setTimeout(() => setSavedMsg(false), 2000)
  }

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FFFCF7', fontFamily: "'Space Grotesk', sans-serif", position: 'relative' }}>
      {/* grid bg */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: 'linear-gradient(rgba(123,91,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(123,91,255,.05) 1px,transparent 1px)', backgroundSize: '34px 34px' }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 480, margin: '0 auto', padding: '40px 24px 80px' }}>
        <button
          onClick={() => navigate('/')}
          style={{ cursor: 'pointer', background: 'transparent', border: '2px solid #EBE3D6', borderRadius: 999, padding: '8px 16px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14, color: '#4A4453', marginBottom: 32 }}
        >
          ← Back to store
        </button>

        <div style={{ background: '#fff', border: '3px solid #16121F', borderRadius: 24, boxShadow: SH(6, 6, 0, '#16121F'), overflow: 'hidden' }}>
          {/* header */}
          <div style={{ background: '#E6DBFF', borderBottom: '3px solid #16121F', padding: '28px 28px 24px', display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', border: '3px solid #16121F', overflow: 'hidden', background: '#D0C4F0', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {user.photoURL ? (
                <img src={user.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <TeddyBear size={44} />
              )}
            </div>
            <div>
              <div style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 700, fontSize: 22, lineHeight: 1.2 }}>
                {user.displayName ?? 'Shopper'}
              </div>
              <div style={{ fontSize: 14, color: '#6B6475', marginTop: 4 }}>{user.email}</div>
              {createdAt && (
                <div style={{ fontSize: 12, color: '#8A8194', marginTop: 2 }}>Member since {createdAt}</div>
              )}
            </div>
          </div>

          {/* phone */}
          <div style={{ padding: '24px 28px' }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 700, fontSize: 14 }}>
              Phone number
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+972 50 000 0000"
                style={{ flex: 1, padding: '11px 14px', border: '2.5px solid #16121F', borderRadius: 12, fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, background: '#fff', outline: 'none' }}
              />
              <button
                onClick={savePhone}
                disabled={saving}
                className="btn-lift"
                style={{ cursor: saving ? 'wait' : 'pointer', padding: '11px 18px', background: '#FF3D8B', color: '#fff', border: '2.5px solid #16121F', borderRadius: 12, fontFamily: 'Fredoka, sans-serif', fontWeight: 700, fontSize: 15, boxShadow: SH(3, 3, 0, '#16121F'), opacity: saving ? 0.65 : 1, transition: 'transform .12s', minWidth: 64 }}
              >
                {savedMsg ? '✓' : saving ? '…' : 'Save'}
              </button>
            </div>
            <p style={{ margin: '8px 0 0', fontSize: 12, color: '#8A8194' }}>Used for order notifications only.</p>
          </div>

          {/* sign out */}
          <div style={{ padding: '0 28px 24px' }}>
            <hr style={{ border: 'none', borderTop: '2px solid #EBE3D6', margin: '0 0 20px' }} />
            <button
              onClick={handleSignOut}
              className="btn-lift"
              style={{ cursor: 'pointer', width: '100%', padding: '12px 20px', background: '#fff', color: '#16121F', border: '2.5px solid #16121F', borderRadius: 14, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, boxShadow: SH(3, 3, 0, '#16121F'), transition: 'transform .12s' }}
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
