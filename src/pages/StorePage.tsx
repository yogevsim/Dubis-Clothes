import { useEffect, useRef, useState } from 'react'
import { doc, getDoc, setDoc, collection, getDocs, updateDoc } from 'firebase/firestore'
import TeddyBear from '../components/TeddyBear'
import NavAvatar from '../components/NavAvatar'
import SignInModal from '../components/SignInModal'
import ProductFormModal from '../components/ProductFormModal'
import { useAuth } from '../contexts/AuthContext'
import { db } from '../firebase'
import { useIsMobile } from '../hooks/useIsMobile'

const ACCENT = '#FF3D8B'

interface Product {
  id: string
  category: string
  backgroundHex: string
  inkHex: string
  name: string
  price: number
  tag: string
  photoUrl: string | null
}

const CATS = ['All','Tops','Dresses','Bottoms','Outerwear','Knit','Shoes','Accessories','Vintage'] as const
type Cat = typeof CATS[number]

const CAT_LABELS: Record<Cat, string> = {
  All:'הכל', Tops:'חולצות', Dresses:'שמלות', Bottoms:'מכנסיים',
  Outerwear:'מעילים', Knit:'סריגים', Shoes:'נעליים', Accessories:'אקססוריז', Vintage:"וינטג'",
}

const MOBILE_STRIPS = [
  { bg:'#FFD9EC', color:'rgba(255,61,139,.5)',   label:'חולצות',  badge:{ text:'חדש ✦',     badgeBg:'#FF3D8B', style:'top:-4px;right:-4px;transform:rotate(-5deg)' } },
  { bg:'#E6DBFF', color:'rgba(123,91,255,.5)',   label:'שמלות',   badge:{ text:'1 מתוך 1', badgeBg:'#7B5BFF', style:'bottom:-4px;left:-4px;transform:rotate(6deg)' } },
  { bg:'#CFE3FF', color:'rgba(45,125,210,.5)',   label:"ג׳ינסים", badge:null },
  { bg:'#FFE9B0', color:'rgba(229,148,0,.55)',   label:'סריגים',  badge:null },
  { bg:'#D9F5EC', color:'rgba(22,199,154,.55)',  label:'אקססוריז',badge:null },
]

const sh = (x: number, y: number, b: number, c: string) => `-${x}px ${y}px ${b}px ${c}`
const fmt = (n: number) => n.toLocaleString('he-IL') + ' ₪'

export default function StorePage() {
  const { user, isAdmin, signInWithGoogle, signOut, error } = useAuth()
  const isMobile = useIsMobile()
  const [cart, setCart] = useState<Record<string, number>>({})
  const [cat, setCat] = useState<Cat>('All')
  const [cartOpen, setCartOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [showSignInModal, setShowSignInModal] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [editingProduct, setEditingProduct] = useState<Product | undefined>()
  const [showEditModal, setShowEditModal] = useState(false)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cartRef = useRef(cart)
  const docIdMapRef = useRef<Record<string, string>>({})
  cartRef.current = cart

  useEffect(() => {
    async function load() {
      const docs = await getDocs(collection(db, 'products'))
      const docIdMap: Record<string, string> = {}
      const prods = docs.docs
        .map(d => {
          const data = d.data() as any
          const productId = String(data.id)
          docIdMap[productId] = d.id
          if (data.name !== undefined) return { ...data, id: productId } as Product
          return {
            id: productId, category: data.category,
            backgroundHex: data.backgroundHex, inkHex: data.inkHex,
            name: data.he?.name || '', price: data.he?.price || 0,
            tag: data.he?.tag || '', photoUrl: data.photoUrl,
          } as Product
        })
        .sort((a, b) => Number(a.id) - Number(b.id))
      docIdMapRef.current = docIdMap
      setProducts(prods)
      setProductsLoading(false)
    }
    void load()
  }, [])

  useEffect(() => {
    if (!user) return
    async function mergeCart() {
      const userRef = doc(db, 'users', user!.uid)
      const snap = await getDoc(userRef)
      const fsCart = ((snap.exists() && snap.data().cart) || {}) as Record<string, number>
      const local = cartRef.current
      const merged: Record<string, number> = { ...local }
      for (const [id, qty] of Object.entries(fsCart)) merged[id] = (merged[id] || 0) + qty
      setCart(merged)
      await setDoc(userRef, { cart: merged }, { merge: true })
    }
    void mergeCart()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid])

  async function saveCartToFirestore(newCart: Record<string, number>) {
    if (!user) return
    await setDoc(doc(db, 'users', user.uid), { cart: newCart }, { merge: true })
  }

  function showToast(msg: string, duration = 1900) {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), duration)
  }

  function add(id: string) {
    const p = products.find(x => x.id === id)!
    const newCart = { ...cart, [id]: (cart[id] || 0) + 1 }
    setCart(newCart); void saveCartToFirestore(newCart)
    showToast(`${p.name} נוסף לסל`)
  }
  function inc(id: string) {
    const newCart = { ...cart, [id]: (cart[id] || 0) + 1 }
    setCart(newCart); void saveCartToFirestore(newCart)
  }
  function dec(id: string) {
    const newCart = { ...cart }
    if ((newCart[id] || 0) <= 1) delete newCart[id]; else newCart[id]--
    setCart(newCart); void saveCartToFirestore(newCart)
  }
  function remove(id: string) {
    const newCart = { ...cart }; delete newCart[id]
    setCart(newCart); void saveCartToFirestore(newCart)
  }

  function handleEditProduct(product: Product) {
    setEditingProduct(product); setShowEditModal(true)
  }

  async function handleSaveProduct(formData: Partial<Product>) {
    if (!editingProduct) return
    try {
      const docId = docIdMapRef.current[editingProduct.id]
      if (!docId) throw new Error('Document ID not found')
      await updateDoc(doc(db, 'products', docId), {
        category: formData.category || editingProduct.category,
        backgroundHex: formData.backgroundHex || editingProduct.backgroundHex,
        inkHex: formData.inkHex || editingProduct.inkHex,
        name: formData.name || editingProduct.name,
        price: formData.price !== undefined ? formData.price : editingProduct.price,
        tag: formData.tag || editingProduct.tag,
        photoUrl: formData.photoUrl !== undefined ? formData.photoUrl : editingProduct.photoUrl,
      })
      setProducts(products.map(p => p.id === editingProduct.id ? { ...p, ...formData } : p))
      setShowEditModal(false); setEditingProduct(undefined)
      showToast('✓ המוצר עודכן')
    } catch { showToast('שגיאה בשמירה') }
  }

  function toCatalog() {
    const el = document.getElementById('catalog')
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 16, behavior: 'smooth' })
  }

  function handleCheckout() {
    if (!user) setShowSignInModal(true)
    else showToast('🚧 תשלום בקרוב', 2500)
  }

  const filtered = products.filter(p => cat === 'All' || p.category === cat)
  const cartItems = Object.entries(cart)
    .map(([id, qty]) => { const p = products.find(x => x.id === id); return p ? { ...p, qty } : null })
    .filter((x): x is Product & { qty: number } => x !== null)
  const cartCount = cartItems.reduce((n, it) => n + it.qty, 0)
  const subtotal  = cartItems.reduce((n, it) => n + it.price * it.qty, 0)
  const hasItems  = cartItems.length > 0
  const remain    = 200 - subtotal

  const primaryBtn: React.CSSProperties = { cursor:'pointer', fontFamily:'Rubik, sans-serif', fontWeight:700, fontSize:isMobile?15:16, color:'#fff', background:ACCENT, border:'2px solid #16121F', borderRadius:14, padding:isMobile?'12px 20px':'13px 24px', boxShadow:sh(3,3,0,'#16121F'), transition:'transform .12s' }
  const addBtnStyle: React.CSSProperties = { cursor:'pointer', fontFamily:'Rubik, sans-serif', fontWeight:700, fontSize:isMobile?12:14, color:'#fff', background:ACCENT, border:'2px solid #16121F', borderRadius:11, padding:isMobile?'7px 10px':'8px 15px', boxShadow:sh(2,2,0,'#16121F'), transition:'transform .12s', whiteSpace:'nowrap' }

  const cartContainerStyle: React.CSSProperties = isMobile
    ? { position:'fixed', bottom:0, left:0, right:0, maxHeight:'88vh', zIndex:80, background:'#FFFCF7', borderRadius:'24px 24px 0 0', border:'2.5px solid #16121F', borderBottom:'none', boxShadow:'0 -6px 32px rgba(22,18,31,.18)', display:'flex', flexDirection:'column', transition:'transform .38s cubic-bezier(.22,1,.36,1)', transform: cartOpen ? 'translateY(0)' : 'translateY(110%)' }
    : { position:'fixed', top:0, left:0, height:'100vh', width:380, maxWidth:'92vw', zIndex:80, background:'#FFFCF7', borderRight:'3px solid #16121F', boxShadow:'8px 0 30px rgba(22,18,31,.18)', display:'flex', flexDirection:'column', transition:'transform .3s cubic-bezier(.22,1,.36,1)', transform: cartOpen ? 'translateX(0)' : 'translateX(-105%)' }

  return (
    <div dir="rtl" style={{ position:'relative', minHeight:'100vh', overflowX:'hidden', fontFamily:'Heebo, sans-serif' }}>

      {/* BG grid */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, backgroundImage:'linear-gradient(rgba(123,91,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(123,91,255,.05) 1px,transparent 1px)', backgroundSize:'34px 34px' }} />

      {error && (
        <div style={{ position:'fixed', top:0, left:0, right:0, zIndex:1000, background:'#FFB5C5', border:'2px solid #16121F', padding:'12px 24px', fontFamily:'Heebo, sans-serif', fontSize:13, color:'#16121F', textAlign:'center' }}>
          {error}
        </div>
      )}

      <div style={{ position:'relative', zIndex:1, paddingTop: error ? 50 : 0 }}>

        {/* ── MARQUEE ── */}
        <div style={{ background:'#16121F', color:'#FFE9B0', overflow:'hidden', whiteSpace:'nowrap', borderBottom:'3px solid #16121F' }}>
          <div className="marquee" style={{ display:'inline-flex', fontFamily:'Heebo, sans-serif', fontSize:13, fontWeight:700, letterSpacing:'.04em', padding:'9px 0' }}>
            <span>✦&nbsp;&nbsp;דרופים חדשים בכל יום שישי&nbsp;&nbsp;✦&nbsp;&nbsp;חבילת מדבקות חינם בכל הזמנה&nbsp;&nbsp;✦&nbsp;&nbsp;נאסף ונבחר באהבה ע״י דובי&nbsp;&nbsp;✦&nbsp;&nbsp;פריטים שיש רק אחד מהם&nbsp;&nbsp;✦&nbsp;&nbsp;כשנגמר — נגמר&nbsp;&nbsp;</span>
            <span>✦&nbsp;&nbsp;דרופים חדשים בכל יום שישי&nbsp;&nbsp;✦&nbsp;&nbsp;חבילת מדבקות חינם בכל הזמנה&nbsp;&nbsp;✦&nbsp;&nbsp;נאסף ונבחר באהבה ע״י דובי&nbsp;&nbsp;✦&nbsp;&nbsp;פריטים שיש רק אחד מהם&nbsp;&nbsp;✦&nbsp;&nbsp;כשנגמר — נגמר&nbsp;&nbsp;</span>
          </div>
        </div>

        {/* ══ MOBILE NAV ══ */}
        {isMobile && (
          <nav style={{ position:'sticky', top:0, zIndex:40, display:'grid', gridTemplateColumns:'52px 1fr 52px', alignItems:'center', padding:'0 14px', height:62, background:'rgba(255,252,247,.94)', backdropFilter:'blur(14px)', borderBottom:'2px solid #16121F' }}>
            {/* Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(o => !o)}
              style={{ cursor:'pointer', justifySelf:'start', width:44, height:44, borderRadius:14, border:'2px solid #16121F', background:'transparent', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4.5, padding:0 }}
            >
              <span style={{ display:'block', width:18, height:2, background:'#16121F', borderRadius:2 }} />
              <span style={{ display:'block', width:18, height:2, background:'#16121F', borderRadius:2 }} />
              <span style={{ display:'block', width:13, height:2, background:'#16121F', borderRadius:2, alignSelf:'flex-start' }} />
            </button>

            {/* Centered logo */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              <TeddyBear size={30} />
              <span style={{ fontFamily:'Rubik, sans-serif', fontWeight:800, fontSize:16, whiteSpace:'nowrap', letterSpacing:'-.01em' }}>הבגדים של דובי</span>
            </div>

            {/* Cart icon */}
            <button
              onClick={() => setCartOpen(o => !o)}
              style={{ cursor:'pointer', justifySelf:'end', position:'relative', width:44, height:44, borderRadius:14, background:'#FFC233', border:'2px solid #16121F', boxShadow:sh(2,2,0,'#16121F'), display:'flex', alignItems:'center', justifyContent:'center', fontSize:19 }}
            >
              🛍
              {cartCount > 0 && (
                <span style={{ position:'absolute', top:-7, left:-7, minWidth:19, height:19, padding:'0 4px', borderRadius:999, background:ACCENT, color:'#fff', border:'2px solid #16121F', fontFamily:'Heebo, sans-serif', fontWeight:700, fontSize:10, display:'flex', alignItems:'center', justifyContent:'center' }}>{cartCount}</span>
              )}
            </button>
          </nav>
        )}

        {/* ══ DESKTOP NAV ══ */}
        {!isMobile && (
          <nav style={{ position:'sticky', top:0, zIndex:40, display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, padding:'14px 24px', background:'rgba(255,252,247,.88)', backdropFilter:'blur(12px)', borderBottom:'2px solid #16121F' }}>
            <div style={{ display:'flex', alignItems:'center', gap:11 }}>
              <TeddyBear size={40} />
              <span style={{ fontFamily:'Rubik, sans-serif', fontWeight:800, fontSize:21, letterSpacing:'-.01em' }}>הבגדים של דובי</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              {user ? (
                <NavAvatar user={user} shadow={sh} isAdmin={isAdmin} fontBody="Heebo, sans-serif" />
              ) : (
                <button onClick={signInWithGoogle} style={{ cursor:'pointer', fontFamily:'Heebo, sans-serif', fontWeight:700, fontSize:13, color:'#16121F', background:'#D9F5EC', border:'2px solid #16121F', borderRadius:999, padding:'8px 14px', transition:'background .12s' }}>
                  כניסה
                </button>
              )}
              <button onClick={toCatalog} className="shop-btn" style={{ cursor:'pointer', fontFamily:'Heebo, sans-serif', fontWeight:700, fontSize:14, color:'#16121F', background:'transparent', border:'2px solid #16121F', borderRadius:999, padding:'9px 16px', transition:'background .15s' }}>
                לרכישה ↓
              </button>
              <button onClick={() => setCartOpen(o => !o)} className="btn-lift" style={{ cursor:'pointer', display:'flex', alignItems:'center', gap:8, background:'#FFC233', border:'2px solid #16121F', borderRadius:999, padding:'8px 14px', boxShadow:sh(3,3,0,'#16121F'), transition:'transform .12s' }}>
                <span style={{ fontSize:16 }}>🛍</span>
                <span style={{ fontFamily:'Heebo, sans-serif', fontWeight:700, fontSize:14 }}>סל</span>
                {cartCount > 0 && (
                  <span style={{ minWidth:22, height:22, padding:'0 6px', borderRadius:999, background:'#fff', color:'#16121F', border:'2px solid #16121F', display:'inline-flex', alignItems:'center', justifyContent:'center', fontFamily:'Heebo, sans-serif', fontWeight:700, fontSize:12 }}>{cartCount}</span>
                )}
              </button>
            </div>
          </nav>
        )}

        {/* ══ MOBILE MENU DRAWER ══ */}
        {isMobile && (
          <>
            {/* Backdrop */}
            <div
              onClick={() => setMobileMenuOpen(false)}
              style={{ position:'fixed', inset:0, zIndex:85, background:'rgba(22,18,31,.45)', transition:'opacity .28s', opacity: mobileMenuOpen ? 1 : 0, pointerEvents: mobileMenuOpen ? 'auto' : 'none' }}
            />
            {/* Drawer */}
            <div dir="rtl" style={{ position:'fixed', top:0, right:0, height:'100%', width:'min(300px, 86vw)', zIndex:90, background:'#FFFCF7', borderLeft:'2.5px solid #16121F', boxShadow:'-8px 0 28px rgba(22,18,31,.16)', display:'flex', flexDirection:'column', transition:'transform .32s cubic-bezier(.22,1,.36,1)', transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(110%)' }}>
              {/* Drawer header */}
              <div style={{ flexShrink:0, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 18px 16px', borderBottom:'2px solid #EBE3D6' }}>
                <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                  <TeddyBear size={34} />
                  <span style={{ fontFamily:'Rubik, sans-serif', fontWeight:800, fontSize:17 }}>הבגדים של דובי</span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} style={{ cursor:'pointer', width:36, height:36, borderRadius:11, background:'#F5F0FA', border:'2px solid #16121F', fontSize:15, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
              </div>

              {/* Body */}
              <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column' }}>
                {/* Nav links */}
                <div style={{ padding:'12px 16px', display:'flex', flexDirection:'column', gap:2 }}>
                  {[
                    { icon:'🏠', label:'ראשי', action: () => { setMobileMenuOpen(false); window.scrollTo({ top:0, behavior:'smooth' }) } },
                    { icon:'👗', label:'הארון', action: () => { setMobileMenuOpen(false); setTimeout(toCatalog, 160) } },
                  ].map(({ icon, label, action }) => (
                    <button key={label} onClick={action} style={{ cursor:'pointer', display:'flex', alignItems:'center', gap:12, fontFamily:'Heebo, sans-serif', fontWeight:700, fontSize:17, color:'#16121F', background:'transparent', border:'none', padding:'12px 8px', width:'100%', textAlign:'right', borderRadius:12, transition:'background .1s' }}>
                      <span style={{ fontSize:18 }}>{icon}</span><span>{label}</span>
                    </button>
                  ))}
                </div>

                <div style={{ height:1, background:'#EBE3D6', margin:'0 16px' }} />

                {/* Categories */}
                <div style={{ padding:'14px 16px' }}>
                  <div style={{ fontFamily:'Heebo, sans-serif', fontSize:11, fontWeight:700, color:'#B5AEBF', textTransform:'uppercase', letterSpacing:'.12em', marginBottom:11 }}>קטגוריות</div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:7 }}>
                    {CATS.map(c => (
                      <button
                        key={c}
                        onClick={() => { setCat(c); setMobileMenuOpen(false); setTimeout(toCatalog, 160) }}
                        style={{ cursor:'pointer', fontFamily:'Heebo, sans-serif', fontWeight:700, fontSize:13, padding:'9px 6px', borderRadius:12, border:'2px solid', textAlign:'center', ...(c === cat ? { borderColor:ACCENT, background:ACCENT, color:'#fff' } : { borderColor:'#EBE3D6', background:'#fff', color:'#16121F' }) }}
                      >
                        {CAT_LABELS[c]}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ height:1, background:'#EBE3D6', margin:'0 16px' }} />

                {/* Account */}
                <div style={{ padding:'14px 16px' }}>
                  {user ? (
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:38, height:38, borderRadius:'50%', background:'#E6DBFF', border:'2px solid #16121F', display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, overflow:'hidden', flexShrink:0 }}>
                          {user.photoURL ? <img src={user.photoURL} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : '👤'}
                        </div>
                        <div>
                          <div style={{ fontFamily:'Rubik, sans-serif', fontWeight:700, fontSize:14 }}>שלום! כיף שחזרת</div>
                          <div style={{ fontFamily:'Heebo, sans-serif', fontSize:12, color:'#8A8194' }}>חשבון פעיל ✦</div>
                        </div>
                      </div>
                      <button onClick={() => { setMobileMenuOpen(false); signOut() }} style={{ cursor:'pointer', fontFamily:'Heebo, sans-serif', fontSize:12, color:'#B5707E', background:'transparent', border:'none', textDecoration:'underline' }}>יציאה</button>
                    </div>
                  ) : (
                    <button onClick={() => { setMobileMenuOpen(false); signInWithGoogle() }} style={{ cursor:'pointer', width:'100%', fontFamily:'Rubik, sans-serif', fontWeight:800, fontSize:15, color:'#fff', background:ACCENT, border:'2px solid #16121F', borderRadius:14, padding:13, boxShadow:sh(3,3,0,'#16121F'), transition:'transform .1s' }}>
                      כניסה / הרשמה
                    </button>
                  )}
                </div>
              </div>

              {/* Footer links */}
              <div style={{ flexShrink:0, padding:'14px 16px', borderTop:'1.5px solid #EBE3D6', display:'flex', gap:18 }}>
                {['שאלות נפוצות','החזרות','@dubisclothes'].map(l => (
                  <span key={l} style={{ fontFamily:'Heebo, sans-serif', fontSize:13, color:'#8A8194', cursor:'pointer' }}>{l}</span>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ══ DESKTOP HERO ══ */}
        {!isMobile && (
          <section style={{ maxWidth:1180, margin:'0 auto', padding:'54px 24px 30px', display:'grid', gridTemplateColumns:'1.05fr .95fr', gap:40, alignItems:'center' }}>
            <div>
              <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'#D9F5EC', border:'2px solid #16121F', borderRadius:999, padding:'6px 14px', fontFamily:'Heebo, sans-serif', fontSize:13, fontWeight:700, letterSpacing:'.02em', boxShadow:sh(2,2,0,'#16121F'), marginBottom:22 }}>
                ✦ נאסף ונבחר ע״י דובי
              </div>
              <h1 style={{ margin:0, fontFamily:'Rubik, sans-serif', fontWeight:800, fontSize:60, lineHeight:1.05, letterSpacing:'-.02em' }}>
                יד שנייה, נבחר בקפידה,<br /><span style={{ color:ACCENT }}>וקצת כאוטי.</span>
              </h1>
              <p style={{ margin:'22px 0 0', fontSize:17, lineHeight:1.6, maxWidth:460, color:'#4A4453' }}>
                פריטים נבחרים מהארון הכל־כך־גדול של דובי — חולצות, שמלות, ג׳ינסים, וכל הדברים המוזרים והטובים. דרופים חדשים בכל יום שישי. כשזה נגמר, זה נגמר.
              </p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:12, marginTop:28 }}>
                <button onClick={toCatalog} className="btn-lift" style={primaryBtn}>לגלוש בארון ↓</button>
                <button onClick={toCatalog} className="btn-lift" style={{ cursor:'pointer', fontFamily:'Rubik, sans-serif', fontWeight:700, fontSize:16, color:'#16121F', background:'#fff', border:'2px solid #16121F', borderRadius:14, padding:'13px 22px', boxShadow:sh(3,3,0,'#16121F'), transition:'transform .12s' }}>מה חדש</button>
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:18, marginTop:30 }}>
                {[['‎+120','פריטים במלאי'],['1 מתוך 1','אספנות נדירה'],['48 שעות','משלוח מהיר']].map(([val, label], i, arr) => (
                  <div key={val} style={{ display:'contents' }}>
                    <div style={{ display:'flex', flexDirection:'column' }}>
                      <span style={{ fontFamily:'Rubik, sans-serif', fontWeight:800, fontSize:24 }}>{val}</span>
                      <span style={{ fontFamily:'Heebo, sans-serif', fontSize:12, color:'#8A8194' }}>{label}</span>
                    </div>
                    {i < arr.length - 1 && <div style={{ width:2, background:'#EBE3D6' }} />}
                  </div>
                ))}
              </div>
            </div>

            {/* Collage */}
            <div style={{ position:'relative', height:420 }}>
              <div style={{ position:'absolute', bottom:24, left:-6, zIndex:3, width:84, height:84, borderRadius:'50%', background:'#FFFCF7', border:'2.5px solid #16121F', boxShadow:sh(4,4,0,'#16121F'), display:'flex', alignItems:'center', justifyContent:'center', transform:'rotate(-8deg)', animation:'floaty 5.5s ease-in-out infinite .2s', ['--r' as any]:'-8deg' }}>
                <TeddyBear size={54} />
              </div>
              {[
                { label:'חולצה', color:'rgba(255,61,139,.45)', bg:'#FFD9EC', r:'7deg',  anim:'floaty 6s ease-in-out infinite',       top:18,  right:24,  bottom:undefined, left:undefined,  w:200, h:250, badge:{ text:'חדש ✦',     bg:'#FF3D8B', top:-12, left:-12, bottom:undefined, right:undefined, rot:'rotate(-8deg)' } },
                { label:"ג׳ינס", color:'rgba(45,125,210,.5)',  bg:'#CFE3FF', r:'-6deg', anim:'floaty 7s ease-in-out infinite .8s',   top:78,  left:14,   bottom:undefined, right:undefined, w:188, h:236, badge:null },
                { label:'שמלה',  color:'rgba(229,148,0,.55)',  bg:'#FFE9B0', r:'3deg',  anim:'floaty 6.5s ease-in-out infinite .4s', bottom:0,right:96,  top:undefined,    left:undefined,  w:176, h:210, badge:{ text:'1 מתוך 1', bg:'#7B5BFF', bottom:-14, right:-14, top:undefined, left:undefined, rot:'rotate(10deg)' } },
              ].map(({ label, color, bg, r, anim, top, left, bottom, right, w, h, badge }) => (
                <div key={label} style={{ position:'absolute', top, left, bottom, right, width:w, height:h, background:bg, border:'2.5px solid #16121F', borderRadius:22, boxShadow:sh(6,6,0,'#16121F'), animation:anim, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, ['--r' as any]:r }}>
                  <span style={{ fontFamily:'Rubik, sans-serif', fontWeight:800, fontSize:label.length > 4 ? 36 : 42, color }}>{label}</span>
                  <span style={{ fontFamily:'Heebo, sans-serif', fontSize:11, color:'rgba(22,18,31,.5)' }}>תמונה בקרוב</span>
                  {badge && (
                    <div style={{ position:'absolute', background:badge.bg, color:'#fff', fontFamily:'Heebo, sans-serif', fontSize:11, fontWeight:700, padding:'6px 10px', borderRadius:10, border:'2px solid #16121F', boxShadow:sh(2,2,0,'#16121F'), transform:badge.rot, top:badge.top, left:badge.left, bottom:badge.bottom, right:badge.right }}>
                      {badge.text}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ══ MOBILE HERO ══ */}
        {isMobile && (
          <section style={{ padding:'26px 16px 18px' }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:7, background:'#D9F5EC', border:'2px solid #16121F', borderRadius:999, padding:'5px 13px', fontFamily:'Heebo, sans-serif', fontSize:12, fontWeight:700, boxShadow:sh(2,2,0,'#16121F'), marginBottom:16 }}>
              ✦ נאסף ונבחר ע״י דובי
            </div>
            <h1 style={{ margin:'0 0 14px', fontFamily:'Rubik, sans-serif', fontWeight:800, fontSize:36, lineHeight:1.08, letterSpacing:'-.02em' }}>
              יד שנייה, נבחר בקפידה,<br /><span style={{ color:ACCENT }}>וקצת כאוטי.</span>
            </h1>
            <p style={{ margin:'0 0 22px', fontSize:15, lineHeight:1.58, color:'#4A4453' }}>
              פריטים נבחרים מהארון של דובי — חולצות, שמלות, ג׳ינסים, וכל מה שמוזר וטוב. דרופים כל יום שישי.
            </p>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:22 }}>
              <button onClick={toCatalog} className="btn-lift" style={primaryBtn}>לגלוש בארון ↓</button>
              <button onClick={toCatalog} className="btn-lift" style={{ cursor:'pointer', fontFamily:'Rubik, sans-serif', fontWeight:700, fontSize:15, color:'#16121F', background:'#fff', border:'2px solid #16121F', borderRadius:14, padding:'12px 18px', boxShadow:sh(3,3,0,'#16121F'), transition:'transform .12s' }}>מה חדש</button>
            </div>

            {/* Stats card */}
            <div style={{ display:'flex', gap:14, alignItems:'center', padding:'14px 16px', background:'#fff', border:'2px solid #16121F', borderRadius:18, boxShadow:sh(3,3,0,'#16121F'), marginBottom:24 }}>
              {[['‎+120','פריטים'],['1/1','וינטג׳'],['48h','משלוח']].map(([val, label], i, arr) => (
                <div key={val} style={{ display:'contents' }}>
                  <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center' }}>
                    <span style={{ fontFamily:'Rubik, sans-serif', fontWeight:800, fontSize:20 }}>{val}</span>
                    <span style={{ fontFamily:'Heebo, sans-serif', fontSize:11, color:'#8A8194' }}>{label}</span>
                  </div>
                  {i < arr.length - 1 && <div style={{ width:1.5, height:32, background:'#EBE3D6' }} />}
                </div>
              ))}
            </div>

            {/* Horizontal category strip */}
            <div className="cat-scroll" style={{ overflowX:'auto', scrollbarWidth:'none', marginRight:-16, marginLeft:-16, paddingBottom:4 }}>
              <div style={{ display:'flex', gap:11, padding:'4px 16px', width:'max-content' }}>
                {MOBILE_STRIPS.map(({ bg, color, label, badge }) => (
                  <div key={label} onClick={() => { setCat(CATS.find(c => CAT_LABELS[c] === label) ?? 'All'); setTimeout(toCatalog, 100) }} style={{ cursor:'pointer', flex:'none', position:'relative', width:128, height:148, background:bg, border:'2.5px solid #16121F', borderRadius:18, boxShadow:sh(3,3,0,'#16121F'), display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:5, overflow:'hidden' }}>
                    <div style={{ position:'absolute', inset:0, backgroundImage:'repeating-linear-gradient(45deg,rgba(255,255,255,.35) 0 9px,transparent 9px 18px)' }} />
                    <span style={{ position:'relative', fontFamily:'Rubik, sans-serif', fontWeight:800, fontSize:20, color }}>{label}</span>
                    <span style={{ position:'relative', fontFamily:'Heebo, sans-serif', fontSize:10, color:'rgba(22,18,31,.4)' }}>תמונה בקרוב</span>
                    {badge && (
                      <div style={{ position:'absolute', background:badge.badgeBg, color:'#fff', fontFamily:'Heebo, sans-serif', fontSize:10, fontWeight:700, padding:'4px 8px', borderRadius:8, border:'2px solid #16121F', ...(Object.fromEntries(badge.style.split(';').filter(Boolean).map(s => { const [k,v]=s.split(':'); return [k.trim().replace(/-([a-z])/g, (_,c)=>c.toUpperCase()), v?.trim()] }))) }}>
                        {badge.text}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ══ CATALOG ══ */}
        <section id="catalog" style={{ maxWidth: isMobile ? '100%' : 1180, margin:'0 auto', padding: isMobile ? '20px 16px 100px' : '34px 24px 70px' }}>
          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:16, flexWrap:'wrap', marginBottom:16 }}>
            <div>
              <h2 style={{ margin:0, fontFamily:'Rubik, sans-serif', fontWeight:800, fontSize: isMobile ? 28 : 38, letterSpacing:'-.01em' }}>הארון</h2>
              <p style={{ margin:'5px 0 0', fontFamily:'Heebo, sans-serif', fontSize:13, color:'#8A8194' }}>
                {(cat === 'All' ? 'מציג הכל' : 'קטגוריה: ' + CAT_LABELS[cat]) + ` — ${filtered.length} ${filtered.length === 1 ? 'פריט' : 'פריטים'}`}
              </p>
            </div>
          </div>

          {/* Filter chips */}
          <div className={isMobile ? 'cat-scroll' : undefined} style={{ display:'flex', gap:8, ...(isMobile ? { flexWrap:'nowrap', overflowX:'auto', paddingBottom:10, scrollbarWidth:'none', marginBottom:20 } : { flexWrap:'wrap', marginBottom:26 }) }}>
            {CATS.map(c => (
              <button key={c} onClick={() => setCat(c)} style={{ cursor:'pointer', fontFamily:'Heebo, sans-serif', fontWeight:700, fontSize: isMobile ? 13 : 14, padding: isMobile ? '7px 12px' : '9px 16px', borderRadius:999, border:'2px solid #16121F', flexShrink:0, transition:'transform .12s, box-shadow .12s', ...(c === cat ? { background:ACCENT, color:'#fff', boxShadow:sh(3,3,0,'#16121F') } : { background:'#fff', color:'#16121F' }) }}>
                {CAT_LABELS[c]}
              </button>
            ))}
          </div>

          {/* Product grid */}
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(auto-fill,minmax(238px,1fr))', gap: isMobile ? 13 : 22 }}>
            {productsLoading ? (
              <div style={{ gridColumn:'1 / -1', textAlign:'center', padding:'40px 20px', color:'#8A8194', fontFamily:'Heebo, sans-serif' }}>טוען מוצרים…</div>
            ) : (
              filtered.map(p => (
                <div key={p.id} className="card-hover" style={{ background:'#fff', border:'2.5px solid #16121F', borderRadius:22, overflow:'hidden', boxShadow:sh(4,4,0,'#16121F'), display:'flex', flexDirection:'column', position:'relative' }}>
                  <div style={{ position:'relative', aspectRatio:'4/5', overflow:'hidden', background: p.photoUrl ? 'transparent' : p.backgroundHex, borderBottom:'2.5px solid #16121F' }}>
                    {p.photoUrl ? (
                      <img src={p.photoUrl} alt={p.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    ) : (
                      <>
                        <div style={{ position:'absolute', inset:0, backgroundImage:'repeating-linear-gradient(45deg,rgba(255,255,255,.4) 0 11px,transparent 11px 22px)' }} />
                        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:7 }}>
                          <span style={{ fontFamily:'Rubik, sans-serif', fontWeight:800, fontSize: isMobile ? 18 : 28, color:'rgba(22,18,31,.28)' }}>{CAT_LABELS[p.category as Cat]}</span>
                          <span style={{ fontFamily:'Heebo, sans-serif', fontSize:10, color:'rgba(22,18,31,.45)' }}>תמונה בקרוב</span>
                        </div>
                      </>
                    )}
                    <div style={{ position:'absolute', top:10, right:10, transform:'rotate(4deg)', background:p.inkHex, color:'#fff', fontFamily:'Heebo, sans-serif', fontSize:10, fontWeight:700, padding:'5px 9px', borderRadius:9, border:'2px solid #16121F', boxShadow:sh(2,2,0,'#16121F') }}>
                      {p.tag}
                    </div>
                    {isAdmin && (
                      <button onClick={() => handleEditProduct(p)} style={{ position:'absolute', top:10, left:10, background:'#7B5BFF', color:'#fff', border:'2px solid #16121F', borderRadius:8, padding:'6px 11px', fontFamily:'Heebo, sans-serif', fontSize:12, fontWeight:700, cursor:'pointer', boxShadow:sh(2,2,0,'#16121F') }}>
                        עריכה
                      </button>
                    )}
                  </div>
                  <div style={{ padding: isMobile ? '13px 13px 15px' : '15px 15px 17px', display:'flex', flexDirection:'column', gap:8, flex:1 }}>
                    <h3 style={{ margin:0, fontFamily:'Rubik, sans-serif', fontWeight:700, fontSize: isMobile ? 15 : 18, lineHeight:1.25 }}>{p.name}</h3>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, marginTop:'auto' }}>
                      <span style={{ fontFamily:'Rubik, sans-serif', fontWeight:800, fontSize: isMobile ? 18 : 22 }}>{fmt(p.price)}</span>
                      <button onClick={() => add(p.id)} className="btn-lift" style={addBtnStyle}>להוסיף ✦</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* ══ FOOTER ══ */}
        <footer style={{ background:'#16121F', color:'#FFFCF7', borderTop:'3px solid #16121F' }}>
          <div style={{ maxWidth:1180, margin:'0 auto', padding: isMobile ? '28px 16px' : '36px 20px', display:'flex', flexDirection: isMobile ? 'column' : 'row', flexWrap:'wrap', gap: isMobile ? 16 : 20, alignItems: isMobile ? 'flex-start' : 'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <TeddyBear size={isMobile ? 30 : 36} />
              <span style={{ fontFamily:'Rubik, sans-serif', fontWeight:800, fontSize: isMobile ? 16 : 19 }}>הבגדים של דובי</span>
            </div>
            <div style={{ display:'flex', gap:18, fontFamily:'Heebo, sans-serif', fontSize:13 }}>
              {['שאלות נפוצות','החזרות','@dubisclothes'].map(l => <span key={l} style={{ opacity:.85, cursor:'pointer' }}>{l}</span>)}
            </div>
            <span style={{ fontFamily:'Heebo, sans-serif', fontSize:11, opacity:.55 }}>נעשה באהבה + קפאין ✦ 2026</span>
          </div>
        </footer>
      </div>

      {/* ══ CART BACKDROP ══ */}
      <div onClick={() => setCartOpen(false)} style={{ position:'fixed', inset:0, zIndex:70, background:'rgba(22,18,31,.42)', transition:'opacity .25s', opacity: cartOpen ? 1 : 0, pointerEvents: cartOpen ? 'auto' : 'none' }} />

      {/* ══ CART ══ */}
      <aside dir="rtl" style={cartContainerStyle}>
        {/* Mobile drag handle */}
        {isMobile && (
          <div style={{ padding:'12px 0 0', display:'flex', justifyContent:'center', flexShrink:0 }}>
            <div style={{ width:38, height:4, borderRadius:999, background:'#CCC4D0' }} />
          </div>
        )}

        {/* Header */}
        <div style={{ flexShrink:0, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 20px', borderBottom:'2.5px solid #16121F' }}>
          <h3 style={{ margin:0, fontFamily:'Rubik, sans-serif', fontWeight:800, fontSize:22 }}>הסל שלך</h3>
          <button onClick={() => setCartOpen(false)} style={{ cursor:'pointer', width:36, height:36, borderRadius:11, background:'#fff', border:'2px solid #16121F', boxShadow:sh(2,2,0,'#16121F'), fontSize:15, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
        </div>

        {hasItems ? (
          <>
            <div style={{ flex:1, overflowY:'auto', padding:'14px 18px', display:'flex', flexDirection:'column', gap:13 }}>
              {cartItems.map(it => (
                <div key={it.id} style={{ display:'flex', gap:11, alignItems:'center' }}>
                  <div style={{ position:'relative', width:58, height:70, flexShrink:0, borderRadius:12, border:'2px solid #16121F', background:it.backgroundHex, overflow:'hidden' }}>
                    {it.photoUrl
                      ? <img src={it.photoUrl} alt={it.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                      : <>
                          <div style={{ position:'absolute', inset:0, backgroundImage:'repeating-linear-gradient(45deg,rgba(255,255,255,.4) 0 8px,transparent 8px 16px)' }} />
                          <span style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Rubik, sans-serif', fontWeight:700, fontSize:11, color:'rgba(22,18,31,.38)' }}>{CAT_LABELS[it.category as Cat]}</span>
                        </>
                    }
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontFamily:'Rubik, sans-serif', fontWeight:700, fontSize:14, lineHeight:1.25 }}>{it.name}</div>
                    <div style={{ fontFamily:'Heebo, sans-serif', fontSize:12, color:'#8A8194', marginTop:2 }}>{fmt(it.price)} ליחידה</div>
                    <div style={{ display:'flex', alignItems:'center', gap:7, marginTop:8 }}>
                      <button onClick={() => dec(it.id)} style={{ cursor:'pointer', width:28, height:28, borderRadius:9, border:'2px solid #16121F', background:'#fff', fontWeight:700, fontSize:15, display:'flex', alignItems:'center', justifyContent:'center', lineHeight:1 }}>–</button>
                      <span style={{ fontFamily:'Heebo, sans-serif', fontWeight:700, fontSize:14, minWidth:18, textAlign:'center' }}>{it.qty}</span>
                      <button onClick={() => inc(it.id)} style={{ cursor:'pointer', width:28, height:28, borderRadius:9, border:'2px solid #16121F', background:'#fff', fontWeight:700, fontSize:15, display:'flex', alignItems:'center', justifyContent:'center', lineHeight:1 }}>+</button>
                      <button onClick={() => remove(it.id)} style={{ cursor:'pointer', marginRight:4, background:'transparent', border:'none', fontFamily:'Heebo, sans-serif', fontSize:12, color:'#B5707E', textDecoration:'underline' }}>הסרה</button>
                    </div>
                  </div>
                  <div style={{ fontFamily:'Rubik, sans-serif', fontWeight:800, fontSize:15, flexShrink:0 }}>{fmt(it.price * it.qty)}</div>
                </div>
              ))}
            </div>
            <div style={{ flexShrink:0, borderTop:'2.5px solid #16121F', padding:'16px 20px', background:'#FFF6FB' }}>
              <div style={{ fontFamily:'Heebo, sans-serif', fontSize:13, color:'#6B6475', marginBottom:10 }}>
                {remain > 0 ? `✦ עוד ${fmt(remain)} למשלוח חינם` : '✦ פתחת משלוח חינם!'}
              </div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:13 }}>
                <span style={{ fontFamily:'Rubik, sans-serif', fontWeight:700, fontSize:15 }}>סכום ביניים</span>
                <span style={{ fontFamily:'Rubik, sans-serif', fontWeight:800, fontSize:22 }}>{fmt(subtotal)}</span>
              </div>
              <button onClick={handleCheckout} className="btn-lift" style={{ cursor:'pointer', width:'100%', fontFamily:'Rubik, sans-serif', fontWeight:800, fontSize:17, color:'#fff', background:ACCENT, border:'2.5px solid #16121F', borderRadius:15, padding:14, boxShadow:sh(4,4,0,'#16121F'), transition:'transform .12s' }}>
                לתשלום ✦
              </button>
              <p style={{ margin:'10px 0 0', textAlign:'center', fontFamily:'Heebo, sans-serif', fontSize:11, color:'#8A8194' }}>חבילת מדבקות חינם כלולה :)</p>
            </div>
          </>
        ) : (
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:14, padding:30, textAlign:'center' }}>
            <TeddyBear size={70} />
            <div style={{ fontFamily:'Rubik, sans-serif', fontWeight:700, fontSize:18 }}>הסל שלך מרגיש קצת בודד</div>
            <p style={{ margin:0, fontFamily:'Heebo, sans-serif', fontSize:13, color:'#8A8194', lineHeight:1.6 }}>לכי תתפסי משהו חמוד<br />מהארון ✦</p>
            <button onClick={() => { setCartOpen(false); setTimeout(toCatalog, 120) }} style={{ cursor:'pointer', fontFamily:'Rubik, sans-serif', fontWeight:700, fontSize:15, color:'#fff', background:ACCENT, border:'2px solid #16121F', borderRadius:13, padding:'11px 20px', boxShadow:sh(3,3,0,'#16121F') }}>
              להתחיל לגלוש
            </button>
          </div>
        )}
      </aside>

      {/* ══ TOAST ══ */}
      {toast && (
        <div style={{ position:'fixed', bottom: isMobile ? 96 : 26, left:'50%', transform:'translateX(-50%)', zIndex:95, background:'#16121F', color:'#fff', borderRadius:14, padding:'12px 20px', display:'flex', alignItems:'center', gap:10, boxShadow:'0 6px 22px rgba(0,0,0,.28)', animation:'toastup .25s ease', fontFamily:'Rubik, sans-serif', fontWeight:700, fontSize:15, whiteSpace:'nowrap' }}>
          <span style={{ color:'#FFE9B0' }}>✦</span>
          <span>{toast}</span>
        </div>
      )}

      {/* ══ SIGN-IN MODAL ══ */}
      {showSignInModal && (
        <SignInModal lang="he" dir="rtl" shadow={sh} onSignIn={signInWithGoogle} onClose={() => setShowSignInModal(false)} />
      )}

      {/* ══ PRODUCT EDIT MODAL ══ */}
      {showEditModal && editingProduct && (
        <ProductFormModal
          product={editingProduct}
          categories={['Tops','Dresses','Bottoms','Outerwear','Accessories','Knit','Shoes','Vintage']}
          onSave={handleSaveProduct}
          onClose={() => { setShowEditModal(false); setEditingProduct(undefined) }}
        />
      )}
    </div>
  )
}
