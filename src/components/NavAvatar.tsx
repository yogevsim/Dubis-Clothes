import { useNavigate } from 'react-router-dom'
import type { User } from 'firebase/auth'

interface Props {
  user: User
  shadow: (x: number, y: number, b: number, c: string) => string
  isAdmin: boolean
  fontBody: string
}

export default function NavAvatar({ user, shadow, isAdmin, fontBody }: Props) {
  const navigate = useNavigate()
  const initials = user.displayName
    ? user.displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : (user.email?.[0]?.toUpperCase() ?? '?')

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {isAdmin && (
        <button
          onClick={() => navigate('/admin')}
          style={{
            cursor: 'pointer',
            fontFamily: fontBody, fontWeight: 700, fontSize: 13,
            color: '#fff', background: '#7B5BFF',
            border: '2px solid #16121F', borderRadius: 999,
            padding: '7px 13px', boxShadow: shadow(2, 2, 0, '#16121F'),
          }}
        >
          מנהל
        </button>
      )}
      <button
        onClick={() => navigate('/profile')}
        title={user.displayName ?? undefined}
        className="btn-lift"
        style={{
          cursor: 'pointer', width: 38, height: 38, borderRadius: '50%',
          border: '2.5px solid #16121F', boxShadow: shadow(3, 3, 0, '#16121F'),
          overflow: 'hidden', padding: 0, background: '#E6DBFF',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform .12s', flexShrink: 0,
        }}
      >
        {user.photoURL ? (
          <img src={user.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14, color: '#16121F', userSelect: 'none' }}>
            {initials}
          </span>
        )}
      </button>
    </div>
  )
}
