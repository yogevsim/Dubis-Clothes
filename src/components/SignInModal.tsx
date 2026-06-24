import { useEffect, useState } from 'react'
import { ConfirmationResult } from 'firebase/auth'
import TeddyBear from './TeddyBear'

interface Props {
  lang: 'en' | 'he'
  dir: 'ltr' | 'rtl'
  shadow: (x: number, y: number, b: number, c: string) => string
  onSignIn: () => Promise<void>
  onPhoneSignIn?: (phone: string) => Promise<ConfirmationResult>
  onPhoneConfirm?: (result: ConfirmationResult, code: string) => Promise<void>
  onClose: () => void
}

const COPY = {
  en: {
    title: 'Sign in to check out',
    sub: 'Save your bag and place orders. Quick and easy with Google.',
    google: 'Continue with Google',
    phone: 'Sign in with phone number',
    phoneSub: 'We\'ll send you a verification code via SMS.',
    phoneNumber: 'Phone number',
    enterCode: 'Enter verification code',
    code: 'Verification code',
    send: 'Send code',
    confirm: 'Confirm',
    back: 'Back',
    skip: 'Maybe later',
    error: 'Sign-in failed. Please try again.',
  },
  he: {
    title: 'כניסה לביצוע תשלום',
    sub: 'שמרי את הסל שלך וביצעי הזמנות. מהיר ופשוט עם Google.',
    google: 'המשך עם Google',
    phone: 'כניסה עם מספר טלפון',
    phoneSub: 'נשלח לך קוד אימות בהודעת SMS.',
    phoneNumber: 'מספר טלפון',
    enterCode: 'הזן קוד אימות',
    code: 'קוד אימות',
    send: 'שלח קוד',
    confirm: 'אישור',
    back: 'חזור',
    skip: 'אולי אחר כך',
    error: 'כניסה נכשלה. אנא נסה שוב.',
  },
}

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 13.692 17.64 11.384 17.64 9.2z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.909-2.258c-.806.54-1.837.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/>
    </svg>
  )
}

export default function SignInModal({ lang, dir, shadow, onSignIn, onPhoneSignIn, onPhoneConfirm, onClose }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null)
  const [step, setStep] = useState<'method' | 'phone' | 'code'>('method')
  const t = COPY[lang]

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase()
    const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent)
    setIsMobile(isMobileDevice)
    if (isMobileDevice) setStep('phone')
  }, [])

  async function handleSignIn() {
    setLoading(true)
    setError(null)
    try {
      await onSignIn()
      onClose()
    } catch (e: unknown) {
      const code = (e as { code?: string }).code
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setLoading(false)
        return
      }
      setError(t.error)
      setLoading(false)
    }
  }

  async function handleSendCode() {
    if (!phoneNumber || !onPhoneSignIn) return
    setLoading(true)
    setError(null)
    try {
      const result = await onPhoneSignIn(phoneNumber)
      setConfirmationResult(result)
      setStep('code')
    } catch (e: unknown) {
      setError(t.error)
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirmCode() {
    if (!verificationCode || !confirmationResult || !onPhoneConfirm) return
    setLoading(true)
    setError(null)
    try {
      await onPhoneConfirm(confirmationResult, verificationCode)
      onClose()
    } catch (e: unknown) {
      setError(t.error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(22,18,31,.6)' }}
      />
      <div
        dir={dir}
        role="dialog"
        aria-modal="true"
        style={{
          position: 'fixed', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)', zIndex: 101,
          width: 360, maxWidth: '92vw',
          background: '#FFFCF7', border: '3px solid #16121F',
          borderRadius: 24, boxShadow: '8px 8px 0 #16121F',
          padding: '32px 28px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <TeddyBear size={58} />
        </div>
        <h2 style={{ margin: '0 0 10px', fontFamily: 'Fredoka, sans-serif', fontWeight: 700, fontSize: 24, textAlign: 'center', lineHeight: 1.2 }}>
          {t.title}
        </h2>

        {step === 'method' && (
          <>
            <p style={{ margin: '0 0 24px', fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, color: '#8A8194', textAlign: 'center', lineHeight: 1.55 }}>
              {t.sub}
            </p>
            <button
              onClick={handleSignIn}
              disabled={loading}
              className="btn-lift"
              style={{
                cursor: loading ? 'wait' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                width: '100%', padding: '13px 20px',
                background: '#fff', border: '2.5px solid #16121F',
                borderRadius: 14, boxShadow: shadow(4, 4, 0, '#16121F'),
                fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15,
                transition: 'transform .12s', opacity: loading ? 0.65 : 1,
              }}
            >
              <GoogleLogo />
              {loading ? '…' : t.google}
            </button>
          </>
        )}

        {step === 'phone' && (
          <>
            <p style={{ margin: '0 0 24px', fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, color: '#8A8194', textAlign: 'center', lineHeight: 1.55 }}>
              {confirmationResult ? t.enterCode : t.phoneSub}
            </p>
            {!confirmationResult ? (
              <>
                <input
                  type="tel"
                  placeholder={t.phoneNumber}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={loading}
                  style={{
                    width: '100%', padding: '11px 14px', marginBottom: 12,
                    border: '2.5px solid #16121F', borderRadius: 12,
                    fontFamily: "'Space Grotesk', sans-serif", fontSize: 15,
                    background: '#fff', outline: 'none',
                  }}
                />
                <button
                  onClick={handleSendCode}
                  disabled={loading || !phoneNumber}
                  className="btn-lift"
                  style={{
                    cursor: loading ? 'wait' : 'pointer',
                    width: '100%', padding: '13px 20px',
                    background: '#FF3D8B', color: '#fff', border: '2.5px solid #16121F',
                    borderRadius: 14, boxShadow: shadow(4, 4, 0, '#16121F'),
                    fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15,
                    transition: 'transform .12s', opacity: loading || !phoneNumber ? 0.65 : 1,
                  }}
                >
                  {loading ? '…' : t.send}
                </button>
              </>
            ) : (
              <>
                <input
                  type="text"
                  placeholder={t.code}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  disabled={loading}
                  maxLength={6}
                  style={{
                    width: '100%', padding: '11px 14px', marginBottom: 12,
                    border: '2.5px solid #16121F', borderRadius: 12,
                    fontFamily: "'Space Grotesk', sans-serif", fontSize: 15,
                    background: '#fff', outline: 'none', textAlign: 'center',
                  }}
                />
                <button
                  onClick={handleConfirmCode}
                  disabled={loading || verificationCode.length < 6}
                  className="btn-lift"
                  style={{
                    cursor: loading ? 'wait' : 'pointer',
                    width: '100%', padding: '13px 20px',
                    background: '#FF3D8B', color: '#fff', border: '2.5px solid #16121F',
                    borderRadius: 14, boxShadow: shadow(4, 4, 0, '#16121F'),
                    fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15,
                    transition: 'transform .12s', opacity: loading || verificationCode.length < 6 ? 0.65 : 1,
                  }}
                >
                  {loading ? '…' : t.confirm}
                </button>
                <button
                  onClick={() => { setConfirmationResult(null); setVerificationCode('') }}
                  disabled={loading}
                  style={{
                    cursor: 'pointer', display: 'block', width: '100%', marginTop: 12,
                    padding: '11px 20px', background: 'transparent',
                    border: '2px solid #EBE3D6', borderRadius: 14,
                    fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14, color: '#8A8194',
                  }}
                >
                  {t.back}
                </button>
              </>
            )}
          </>
        )}

        {error && (
          <p style={{ margin: '12px 0 0', fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, color: '#B5707E', textAlign: 'center' }}>
            {error}
          </p>
        )}

        {step === 'method' && (
          <button
            onClick={onClose}
            style={{
              cursor: 'pointer', display: 'block', width: '100%', marginTop: 12,
              padding: '11px 20px', background: 'transparent',
              border: '2px solid #EBE3D6', borderRadius: 14,
              fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14, color: '#8A8194',
            }}
          >
            {t.skip}
          </button>
        )}
      </div>
    </>
  )
}
