import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { type User, signInWithPopup, signOut as fbSignOut, onAuthStateChanged, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, googleProvider, db } from '../firebase'

interface AuthContextValue {
  user: User | null
  isAdmin: boolean
  loading: boolean
  error: string | null
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  sendPhoneCode: (phoneNumber: string) => Promise<ConfirmationResult>
  confirmPhoneCode: (confirmationResult: ConfirmationResult, code: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null)

  useEffect(() => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdTokenResult()
          const roles = (token.claims.roles as string[] | undefined) ?? []
          setIsAdmin(roles.includes('admin'))
          const userRef = doc(db, 'users', firebaseUser.uid)
          const snap = await getDoc(userRef)
          if (!snap.exists()) {
            await setDoc(userRef, { phone: null, createdAt: serverTimestamp() })
            console.log('User document created:', firebaseUser.uid)
          }
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error)
          console.error('Error setting up user:', error)
          setError(`Setup error: ${msg}`)
        }
      } else {
        setIsAdmin(false)
      }
      setLoading(false)
    })
  }, [])

  async function signInWithGoogle() {
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (error) {
      console.error('Sign-in error:', error)
      throw error
    }
  }

  async function sendPhoneCode(phoneNumber: string) {
    try {
      const recaptchaVerifier = new (window as any).grecaptcha.enterprise.RecaptchaVerifier('recaptcha-container', {
        size: 'invisible',
        callback: () => {},
      }, auth)
      const result = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier)
      setConfirmationResult(result)
      return result
    } catch (error) {
      console.error('Phone sign-in error:', error)
      throw error
    }
  }

  async function confirmPhoneCode(confirmationResult: ConfirmationResult, code: string) {
    try {
      await confirmationResult.confirm(code)
    } catch (error) {
      console.error('Phone code confirmation error:', error)
      throw error
    }
  }

  async function signOut() {
    await fbSignOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, error, signInWithGoogle, signOut, sendPhoneCode, confirmPhoneCode }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
