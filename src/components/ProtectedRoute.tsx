import { type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface Props {
  children: ReactNode
  adminOnly?: boolean
}

export default function ProtectedRoute({ children, adminOnly = false }: Props) {
  const { user, isAdmin, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: "'Space Grotesk', sans-serif", color: '#8A8194', fontSize: 24 }}>
        …
      </div>
    )
  }
  if (!user) return <Navigate to="/" replace />
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />

  return <>{children}</>
}
