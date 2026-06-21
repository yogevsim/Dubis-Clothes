import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { type User, signInWithPopup, signOut as fbSignOut, onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, googleProvider, db } from '../firebase'

interface AuthContextValue {
  user: User | null
  isAdmin: boolean
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        const token = await firebaseUser.getIdTokenResult()
        const roles = (token.claims.roles as string[] | undefined) ?? []
        setIsAdmin(roles.includes('admin'))
        const userRef = doc(db, 'users', firebaseUser.uid)
        const snap = await getDoc(userRef)
        if (!snap.exists()) {
          await setDoc(userRef, { phone: null, createdAt: serverTimestamp() })
        }
      } else {
        setIsAdmin(false)
      }
      setLoading(false)
    })
  }, [])

  async function signInWithGoogle() {
    await signInWithPopup(auth, googleProvider)
  }

  async function signOut() {
    await fbSignOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
