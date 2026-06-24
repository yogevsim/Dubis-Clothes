import { useEffect, useRef, useState } from 'react'
import { doc, getDoc, setDoc, collection, getDocs, updateDoc } from 'firebase/firestore'
import TeddyBear from '../components/TeddyBear'
import NavAvatar from '../components/NavAvatar'
import SignInModal from '../components/SignInModal'
import ProductFormModal from '../components/ProductFormModal'
import { useAuth } from '../contexts/AuthContext'
import { db } from '../firebase'

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
  All:'הכל', Tops:'חולצות', Dresses:'שמלות', Bottoms:'מכנסיים', Outerwear:'מעילים', Knit:'סריגים', Shoes:'נעליים', Accessories:'אקססוריז', Vintage:"וינטג'",
}

const t = {
  dir: 'rtl' as const,
  fontHead: 'Rubik, sans-serif',
  fontBody: 'Heebo, sans-serif',
  fontMono: 'Heebo, sans-serif',
  headWeight: 800,
  brand: 'הבגדים של דובי',
  marquee: "✦  דרופים חדשים בכל יום שישי  ✦  חבילת מדבקות חינם בכל הזמנה  ✦  נאסף ונבחר באהבה ע״י דובי  ✦  פריטים שיש רק אחד מהם  ✦  כשנגמר — נגמר  ",
  shopBtn: 'לרכישה ↓',
  cartBtn: 'סל',
  heroBadge: "✦ נאסף ונבחר ע״י דובי",
  heroH1a: 'יד שנייה, נבחר בקפידה,',
  heroH1b: 'וקצת כאוטי.',
  heroP: "פריטים נבחרים מהארון הכל־כך־גדול של דובי — חולצות, שמלות, ג׳ינסים, וכל הדברים המוזרים והטובים. דרופים חדשים בכל יום שישי. כשזה נגמר, זה נגמר.",
  heroCta1: 'לגלוש בארון ↓',
  heroCta2: 'מה חדש',
  stats: [['+120','פריטים במלאי'],['1 מתוך 1','אספנות נדירה'],['48 שעות','משלוח מהיר']] as [string,string][],
  collage: [
    { label:'חולצה', color:'rgba(255,61,139,.45)', bg:'#FFD9EC', r:'7deg',  anim:'floaty 6s ease-in-out infinite',       pos:{top:18,  right:24}, w:200, h:250, badge:{text:'חדש ✦', bg:'#FF3D8B', bpos:{top:-12,left:-12}, rot:'rotate(-8deg)'} },
    { label:"ג׳ינס", color:'rgba(45,125,210,.5)',  bg:'#CFE3FF', r:'-6deg', anim:'floaty 7s ease-in-out infinite .8s',   pos:{top:78,  left:14},  w:188, h:236, badge:null },
    { label:'שמלה',  color:'rgba(229,148,0,.55)',  bg:'#FFE9B0', r:'3deg',  anim:'floaty 6.5s ease-in-out infinite .4s', pos:{bottom:0,right:96}, w:176, h:210, badge:{text:'1 מתוך 1', bg:'#7B5BFF', bpos:{bottom:-14,right:-14}, rot:'rotate(10deg)'} },
  ],
  bearPos: { bottom:24, left:-6 } as React.CSSProperties,
  bearRotate: 'rotate(-8deg)', bearR: '-8deg',
  shadow: (x:number,y:number,b:number,c:string) => `-${x}px ${y}px ${b}px ${c}`,
  closetTitle: 'הארון',
  addBtn: 'להוסיף ✦',
  cartTitle: 'הסל שלך',
  each: 'ליחידה',
  remove: 'הסרה',
  subtotalLabel: 'סכום ביניים',
  checkoutBtn: 'לתשלום ✦',
  sticker: 'חבילת מדבקות חינם כלולה :)',
  emptyTitle: 'הסל שלך מרגיש קצת בודד',
  emptyP: 'לכי תתפסי משהו חמוד\nמהארון ✦',
  emptyBtn: 'להתחיל לגלוש',
  footerLinks: ['שאלות נפוצות','החזרות','@dubisclothes'],
  copy: 'נעשה באהבה + קפאין ✦ 2026',
  fmtPrice: (n:number) => n.toLocaleString('he-IL') + ' ₪',
  shipThreshold: 200,
  shipNote: (rem:number) => rem > 0 ? `✦ עוד ${rem.toLocaleString('he-IL')} ₪ למשלוח חינם` : '✦ פתחת משלוח חינם!',
  resultLabel: (cat:Cat, n:number) => `${cat==='All'?'מציג הכל':'קטגוריה: '+CAT_LABELS[cat]} — ${n} ${n===1?'פריט':'פריטים'}`,
  toastSuffix: 'נוסף לסל',
  checkoutSoon: '🚧 תשלום בקרוב',
  drawerSide: 'left' as const,
  drawerBorderSide: 'borderRight' as const,
} as const

export default function StorePage() {
  const { user, isAdmin, signInWithGoogle, error } = useAuth()
  const [cart, setCart] = useState<Record<string, number>>({})
  const [cat, setCat] = useState<Cat>('All')
  const [cartOpen, setCartOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [showSignInModal, setShowSignInModal] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [editingProduct, setEditingProduct] = useState<Product | undefined>()
  const [showEditModal, setShowEditModal] = useState(false)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cartRef = useRef(cart)
  const docIdMapRef = useRef<Record<number, string>>({})
  cartRef.current = cart

  const catLabels = CAT_LABELS

  // Fetch products from Firestore
  useEffect(() => {
    async function load() {
      const docs = await getDocs(collection(db, 'products'))
      const docIdMap: Record<number, string> = {}
      const prods = docs.docs
        .map(d => {
          const data = d.data() as any
          docIdMap[data.id] = d.id // Map product ID to Firestore doc ID
          // Support both old (he/en) and new (flat) structures
          if (data.name !== undefined) {
            return data as Product
          }
          // Old structure - extract from he
          return {
            id: data.id,
            category: data.category,
            backgroundHex: data.backgroundHex,
            inkHex: data.inkHex,
            name: data.he?.name || '',
            price: data.he?.price || 0,
            tag: data.he?.tag || '',
            photoUrl: data.photoUrl,
          } as Product
        })
        .sort((a, b) => Number(a.id) - Number(b.id))
      docIdMapRef.current = docIdMap
      setProducts(prods)
      setProductsLoading(false)
    }
    void load()
  }, [])

  // Merge local cart with Firestore cart when user signs in
  useEffect(() => {
    if (!user) return
    async function mergeCart() {
      const userRef = doc(db, 'users', user!.uid)
      const snap = await getDoc(userRef)
      const fsCart = ((snap.exists() && snap.data().cart) || {}) as Record<string, number>

      const local = cartRef.current
      const merged: Record<string, number> = { ...local }
      for (const [id, qty] of Object.entries(fsCart)) {
        merged[id] = (merged[id] || 0) + qty
      }
      setCart(merged)

      await setDoc(userRef, { cart: merged }, { merge: true })
    }
    void mergeCart()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid])

  async function saveCartToFirestore(newCart: Record<string, number>) {
    if (!user) return
    const userRef = doc(db, 'users', user.uid)
    await setDoc(userRef, { cart: newCart }, { merge: true })
  }

  function showToast(msg: string, duration = 1900) {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), duration)
  }

  function add(id: string) {
    const p = products.find(x => x.id === id)!
    const newCart = { ...cart, [id]: (cart[id] || 0) + 1 }
    setCart(newCart)
    void saveCartToFirestore(newCart)
    showToast(`${p.name} ${t.toastSuffix}`)
  }

  function inc(id: string) {
    const newCart = { ...cart, [id]: (cart[id] || 0) + 1 }
    setCart(newCart)
    void saveCartToFirestore(newCart)
  }

  function dec(id: string) {
    const newCart = { ...cart }
    if ((newCart[id] || 0) <= 1) delete newCart[id]; else newCart[id]--
    setCart(newCart)
    void saveCartToFirestore(newCart)
  }

  function remove(id: string) {
    const newCart = { ...cart }
    delete newCart[id]
    setCart(newCart)
    void saveCartToFirestore(newCart)
  }

  function handleEditProduct(product: Product) {
    setEditingProduct(product)
    setShowEditModal(true)
  }

  async function handleSaveProduct(formData: Partial<Product>) {
    if (!editingProduct) return
    try {
      const docId = docIdMapRef.current[editingProduct.id]
      if (!docId) {
        throw new Error('Document ID not found for product')
      }
      const docRef = doc(db, 'products', docId)
      await updateDoc(docRef, {
        category: formData.category || editingProduct.category,
        backgroundHex: formData.backgroundHex || editingProduct.backgroundHex,
        inkHex: formData.inkHex || editingProduct.inkHex,
        name: formData.name || editingProduct.name,
        price: formData.price !== undefined ? formData.price : editingProduct.price,
        tag: formData.tag || editingProduct.tag,
        photoUrl: formData.photoUrl !== undefined ? formData.photoUrl : editingProduct.photoUrl,
      })
      // Update local products list
      setProducts(products.map(p => p.id === editingProduct.id ? { ...p, ...formData } : p))
      setShowEditModal(false)
      setEditingProduct(undefined)
      showToast('✓ המוצר עודכן')
    } catch (error) {
      console.error('Save failed:', error)
      showToast('שגיאה בשמירה')
    }
  }

  function toCatalog() {
    const el = document.getElementById('catalog')
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 16, behavior: 'smooth' })
  }

  function handleCheckout() {
    if (!user) {
      setShowSignInModal(true)
    } else {
      showToast(t.checkoutSoon, 2500)
    }
  }

  const filtered  = products.filter(p => cat === 'All' || p.category === cat)
  const cartItems = Object.entries(cart)
    .map(([id, qty]) => {
      const p = products.find(x => x.id === id)
      if (!p) return null
      return { ...p, qty }
    })
    .filter((x): x is Product & { qty: number } => x !== null)
  const cartCount = cartItems.reduce((n, it) => n + it.qty, 0)
  const subtotal  = cartItems.reduce((n, it) => n + it.price * it.qty, 0)
  const hasItems  = cartItems.length > 0
  const remain    = t.shipThreshold - subtotal
  const sh        = t.shadow

  const primaryBtn: React.CSSProperties = { cursor:'pointer', fontFamily:t.fontHead, fontWeight:t.headWeight, fontSize:16, color:'#fff', background:ACCENT, border:'2px solid #16121F', borderRadius:14, padding:'13px 24px', boxShadow:sh(3,3,0,'#16121F'), transition:'transform .12s' }
  const addBtnStyle: React.CSSProperties = { cursor:'pointer', fontFamily:t.fontHead, fontWeight:t.headWeight, fontSize:14, color:'#fff', background:ACCENT, border:'2px solid #16121F', borderRadius:11, padding:'8px 15px', boxShadow:sh(2,2,0,'#16121F'), transition:'transform .12s' }

  return (
    <div dir={t.dir} style={{ position:'relative', minHeight:'100vh', overflowX:'hidden', fontFamily:t.fontBody }}>

      {/* grid bg */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, backgroundImage:'linear-gradient(rgba(123,91,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(123,91,255,.05) 1px,transparent 1px)', backgroundSize:'34px 34px' }} />

      {error && (
        <div style={{ position:'fixed', top:0, left:0, right:0, zIndex:1000, background:'#FFB5C5', border:'2px solid #16121F', padding:'12px 24px', fontFamily:t.fontBody, fontSize:13, color:'#16121F', textAlign:'center' }}>
          {error}
        </div>
      )}

      <div style={{ position:'relative', zIndex:1, paddingTop: error ? 50 : 0 }}>

        {/* ── MARQUEE ── */}
        <div style={{ background:'#16121F', color:'#FFE9B0', overflow:'hidden', whiteSpace:'nowrap', borderBottom:'3px solid #16121F' }}>
          <div className="marquee" style={{ display:'inline-flex', fontFamily:t.fontBody, fontSize:13, fontWeight:700, letterSpacing:'.04em', padding:'9px 0' }}>
            <span>{t.marquee}</span><span>{t.marquee}</span>
          </div>
        </div>

        {/* ── NAV ── */}
        <nav style={{ position:'sticky', top:0, zIndex:40, display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, padding:'14px 24px', background:'rgba(255,252,247,.86)', backdropFilter:'blur(10px)', borderBottom:'2px solid #16121F' }}>
          <div style={{ display:'flex', alignItems:'center', gap:11 }}>
            <TeddyBear size={40} />
            <span style={{ fontFamily:t.fontHead, fontWeight:t.headWeight, fontSize:21, letterSpacing:'-.01em' }}>{t.brand}</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <button onClick={toCatalog} className="shop-btn" style={{ cursor:'pointer', fontFamily:t.fontBody, fontWeight:700, fontSize:14, color:'#16121F', background:'transparent', border:'2px solid #16121F', borderRadius:999, padding:'9px 16px', transition:'background .15s' }}>
              {t.shopBtn}
            </button>
            <button onClick={() => setCartOpen(o => !o)} className="btn-lift" style={{ cursor:'pointer', display:'flex', alignItems:'center', gap:8, background:'#FFC233', border:'2px solid #16121F', borderRadius:999, padding:'8px 14px', boxShadow:sh(3,3,0,'#16121F'), transition:'transform .12s' }}>
              <span style={{ fontSize:16 }}>🛍</span>
              <span style={{ fontFamily:t.fontBody, fontWeight:700, fontSize:14 }}>{t.cartBtn}</span>
              {cartCount > 0 && (
                <span style={{ minWidth:22, height:22, padding:'0 6px', borderRadius:999, background:'#fff', color:'#16121F', border:'2px solid #16121F', display:'inline-flex', alignItems:'center', justifyContent:'center', fontFamily:t.fontMono, fontWeight:700, fontSize:12 }}>{cartCount}</span>
              )}
            </button>
            {user && (
              <NavAvatar user={user} shadow={sh} isAdmin={isAdmin} fontBody={t.fontBody} />
            )}
          </div>
        </nav>

        {/* ── HERO ── */}
        <section style={{ maxWidth:1180, margin:'0 auto', padding:'54px 24px 30px', display:'grid', gridTemplateColumns:'1.05fr .95fr', gap:40, alignItems:'center' }}>
          <div>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'#D9F5EC', border:'2px solid #16121F', borderRadius:999, padding:'6px 14px', fontFamily:t.fontBody, fontSize:13, fontWeight:700, letterSpacing:'.02em', boxShadow:sh(2,2,0,'#16121F'), marginBottom:22 }}>
              {t.heroBadge}
            </div>
            <h1 style={{ margin:0, fontFamily:t.fontHead, fontWeight:t.headWeight, fontSize:60, lineHeight:1.05, letterSpacing:'-.02em' }}>
              {t.heroH1a}<br /><span style={{ color:ACCENT }}>{t.heroH1b}</span>
            </h1>
            <p style={{ margin:'22px 0 0', fontSize:17, lineHeight:1.6, maxWidth:460, color:'#4A4453' }}>{t.heroP}</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:12, marginTop:28 }}>
              <button onClick={toCatalog} className="btn-lift" style={primaryBtn}>{t.heroCta1}</button>
              <button onClick={toCatalog} className="btn-lift" style={{ cursor:'pointer', fontFamily:t.fontHead, fontWeight:t.headWeight, fontSize:16, color:'#16121F', background:'#fff', border:'2px solid #16121F', borderRadius:14, padding:'13px 22px', boxShadow:sh(3,3,0,'#16121F'), transition:'transform .12s' }}>{t.heroCta2}</button>
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:18, marginTop:30 }}>
              {t.stats.map(([val, label], i, arr) => (
                <div key={val} style={{ display:'contents' }}>
                  <div style={{ display:'flex', flexDirection:'column' }}>
                    <span style={{ fontFamily:t.fontHead, fontWeight:t.headWeight, fontSize:24 }}>{val}</span>
                    <span style={{ fontFamily:t.fontBody, fontSize:12, color:'#8A8194' }}>{label}</span>
                  </div>
                  {i < arr.length - 1 && <div style={{ width:2, background:'#EBE3D6' }} />}
                </div>
              ))}
            </div>
          </div>

          {/* collage */}
          <div style={{ position:'relative', height:420 }}>
            <div style={{ position:'absolute', zIndex:3, width:84, height:84, borderRadius:'50%', background:'#FFFCF7', border:'2.5px solid #16121F', boxShadow:sh(4,4,0,'#16121F'), display:'flex', alignItems:'center', justifyContent:'center', transform:t.bearRotate, animation:'floaty 5.5s ease-in-out infinite .2s', '--r':t.bearR, ...t.bearPos } as unknown as React.CSSProperties}>
              <TeddyBear size={54} />
            </div>
            {t.collage.map(({ label, color, bg, r, anim, pos, w, h, badge }) => (
              <div key={label} style={{ position:'absolute', ...pos, width:w, height:h, background:bg, border:'2.5px solid #16121F', borderRadius:22, boxShadow:sh(6,6,0,'#16121F'), animation:anim, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, '--r':r } as unknown as React.CSSProperties}>
                <span style={{ fontFamily:t.fontHead, fontWeight:t.headWeight, fontSize:label.length > 4 ? 36 : 42, color }}>{label}</span>
                <span style={{ fontFamily:t.fontBody, fontSize:11, color:'rgba(22,18,31,.5)' }}>תמונה בקרוב</span>
                {badge && (
                  <div style={{ position:'absolute', background:badge.bg, color:'#fff', fontFamily:t.fontBody, fontSize:11, fontWeight:700, padding:'6px 10px', borderRadius:10, border:'2px solid #16121F', boxShadow:sh(2,2,0,'#16121F'), transform:badge.rot, ...badge.bpos }}>
                    {badge.text}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── CATALOG ── */}
        <section id="catalog" style={{ maxWidth:1180, margin:'0 auto', padding:'34px 24px 70px' }}>
          <div style={{ marginBottom:20 }}>
            <h2 style={{ margin:0, fontFamily:t.fontHead, fontWeight:t.headWeight, fontSize:38, letterSpacing:'-.01em' }}>{t.closetTitle}</h2>
            <p style={{ margin:'6px 0 0', fontFamily:t.fontMono, fontSize:13, color:'#8A8194' }}>
              {t.resultLabel(cat, filtered.length)}
            </p>
          </div>

          <div style={{ display:'flex', flexWrap:'wrap', gap:10, marginBottom:26 }}>
            {CATS.map(c => (
              <button key={c} onClick={() => setCat(c)} style={{ cursor:'pointer', fontFamily:t.fontBody, fontWeight:700, fontSize:14, padding:'9px 16px', borderRadius:999, border:'2px solid #16121F', transition:'transform .12s, box-shadow .12s', ...(c===cat ? { background:ACCENT, color:'#fff', boxShadow:sh(3,3,0,'#16121F') } : { background:'#fff', color:'#16121F' }) }}>
                {catLabels[c]}
              </button>
            ))}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(238px, 1fr))', gap:22 }}>
            {productsLoading ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 20px', color: '#8A8194', fontFamily: t.fontBody }}>
                Loading products…
              </div>
            ) : (
              filtered.map(p => {
                const { name, price, tag } = p
                return (
                  <div key={p.id} className="card-hover" style={{ background:'#fff', border:'2.5px solid #16121F', borderRadius:22, overflow:'hidden', boxShadow:sh(4,4,0,'#16121F'), display:'flex', flexDirection:'column', position:'relative' }}>
                    <div style={{ position:'relative', aspectRatio:'4/5', overflow:'hidden', background:p.photoUrl ? 'transparent' : p.backgroundHex, borderBottom:'2.5px solid #16121F' }}>
                      {p.photoUrl ? (
                        <img src={p.photoUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <>
                          <div style={{ position:'absolute', inset:0, backgroundImage:'repeating-linear-gradient(45deg,rgba(255,255,255,.4) 0 11px,transparent 11px 22px)' }} />
                          <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:7 }}>
                            <span style={{ fontFamily:t.fontHead, fontWeight:t.headWeight, fontSize:28, color:'rgba(22,18,31,.32)' }}>{catLabels[p.category as Cat]}</span>
                            <span style={{ fontFamily:t.fontBody, fontSize:11, color:'rgba(22,18,31,.5)' }}>תמונה בקרוב</span>
                          </div>
                        </>
                      )}
                      <div style={{ position:'absolute', top:11, right:11, transform:'rotate(5deg)', background:p.inkHex, color:'#fff', fontFamily:t.fontBody, fontSize:11, fontWeight:700, padding:'5px 9px', borderRadius:9, border:'2px solid #16121F', boxShadow:sh(2,2,0,'#16121F') }}>
                        {tag}
                      </div>
                      {isAdmin && (
                        <button
                          onClick={() => handleEditProduct(p)}
                          style={{
                            position:'absolute',
                            top:11,
                            left:11,
                            background:'#7B5BFF',
                            color:'#fff',
                            border:'2px solid #16121F',
                            borderRadius:8,
                            padding:'6px 11px',
                            fontFamily:t.fontBody,
                            fontSize:12,
                            fontWeight:700,
                            cursor:'pointer',
                            boxShadow:sh(2,2,0,'#16121F'),
                          }}
                        >
                          עריכה
                        </button>
                      )}
                    </div>
                    <div style={{ padding:'15px 15px 17px', display:'flex', flexDirection:'column', gap:9, flex:1 }}>
                      <h3 style={{ margin:0, fontFamily:t.fontHead, fontWeight:t.headWeight === 800 ? 700 : 600, fontSize:18, lineHeight:1.25 }}>{name}</h3>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, marginTop:'auto' }}>
                        <span style={{ fontFamily:t.fontHead, fontWeight:t.headWeight, fontSize:22 }}>{t.fmtPrice(price)}</span>
                        <button onClick={() => add(p.id)} className="btn-lift" style={addBtnStyle}>{t.addBtn}</button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{ background:'#16121F', color:'#FFFCF7', borderTop:'3px solid #16121F' }}>
          <div style={{ maxWidth:1180, margin:'0 auto', padding:'40px 24px', display:'flex', flexWrap:'wrap', gap:24, alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:11 }}>
              <TeddyBear size={38} />
              <span style={{ fontFamily:t.fontHead, fontWeight:t.headWeight, fontSize:20 }}>{t.brand}</span>
            </div>
            <div style={{ display:'flex', gap:20, fontFamily:t.fontMono, fontSize:13 }}>
              {t.footerLinks.map(l => <span key={l} style={{ opacity:.85 }}>{l}</span>)}
            </div>
            <span style={{ fontFamily:t.fontBody, fontSize:12, opacity:.6 }}>{t.copy}</span>
          </div>
        </footer>
      </div>

      {/* ── CART BACKDROP ── */}
      <div onClick={() => setCartOpen(false)} style={{ position:'fixed', inset:0, zIndex:70, background:'rgba(22,18,31,.4)', transition:'opacity .25s', opacity:cartOpen?1:0, pointerEvents:cartOpen?'auto':'none' }} />

      {/* ── CART DRAWER ── */}
      <aside dir={t.dir} style={{ position:'fixed', top:0, [t.drawerSide]:0, height:'100vh', width:380, maxWidth:'92vw', zIndex:80, background:'#FFFCF7', [t.drawerBorderSide]:'3px solid #16121F', boxShadow:'8px 0 30px rgba(22,18,31,.18)', display:'flex', flexDirection:'column', transition:'transform .3s cubic-bezier(.22,1,.36,1)', transform: cartOpen ? 'translateX(0)' : 'translateX(-105%)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:20, borderBottom:'2.5px solid #16121F' }}>
          <h3 style={{ margin:0, fontFamily:t.fontHead, fontWeight:t.headWeight, fontSize:24 }}>{t.cartTitle}</h3>
          <button onClick={() => setCartOpen(false)} style={{ cursor:'pointer', width:36, height:36, borderRadius:11, background:'#fff', border:'2px solid #16121F', boxShadow:sh(2,2,0,'#16121F'), fontSize:16, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
        </div>

        {hasItems ? (
          <>
            <div style={{ flex:1, overflowY:'auto', padding:'16px 20px', display:'flex', flexDirection:'column', gap:14 }}>
              {cartItems.map(it => (
                <div key={it.id} style={{ display:'flex', gap:12, alignItems:'center' }}>
                  <div style={{ position:'relative', width:62, height:74, flexShrink:0, borderRadius:12, border:'2px solid #16121F', background:it.backgroundHex, overflow:'hidden' }}>
                    <div style={{ position:'absolute', inset:0, backgroundImage:'repeating-linear-gradient(45deg,rgba(255,255,255,.4) 0 8px,transparent 8px 16px)' }} />
                    <span style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:t.fontHead, fontWeight:700, fontSize:12, color:'rgba(22,18,31,.4)' }}>{catLabels[it.category as Cat]}</span>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontFamily:t.fontHead, fontWeight:700, fontSize:15, lineHeight:1.25 }}>{it.name}</div>
                    <div style={{ fontFamily:t.fontBody, fontSize:12, color:'#8A8194', marginTop:2 }}>{t.fmtPrice(it.price)} {t.each}</div>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:8 }}>
                      <button onClick={() => dec(it.id)} style={{ cursor:'pointer', width:26, height:26, borderRadius:8, border:'2px solid #16121F', background:'#fff', fontWeight:700, fontSize:15, display:'flex', alignItems:'center', justifyContent:'center' }}>–</button>
                      <span style={{ fontFamily:t.fontMono, fontWeight:700, fontSize:14, minWidth:18, textAlign:'center' }}>{it.qty}</span>
                      <button onClick={() => inc(it.id)} style={{ cursor:'pointer', width:26, height:26, borderRadius:8, border:'2px solid #16121F', background:'#fff', fontWeight:700, fontSize:15, display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
                      <button onClick={() => remove(it.id)} style={{ cursor:'pointer', marginRight:6, background:'transparent', border:'none', fontFamily:t.fontBody, fontSize:12, color:'#B5707E', textDecoration:'underline' }}>{t.remove}</button>
                    </div>
                  </div>
                  <div style={{ fontFamily:t.fontHead, fontWeight:t.headWeight, fontSize:16, flexShrink:0 }}>{t.fmtPrice(it.price * it.qty)}</div>
                </div>
              ))}
            </div>
            <div style={{ borderTop:'2.5px solid #16121F', padding:'18px 20px', background:'#FFF6FB' }}>
              <div style={{ fontFamily:t.fontBody, fontSize:13, color:'#6B6475', marginBottom:10 }}>{t.shipNote(remain)}</div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                <span style={{ fontFamily:t.fontHead, fontWeight:700, fontSize:16 }}>{t.subtotalLabel}</span>
                <span style={{ fontFamily:t.fontHead, fontWeight:t.headWeight, fontSize:24 }}>{t.fmtPrice(subtotal)}</span>
              </div>
              <button onClick={handleCheckout} className="btn-lift" style={{ cursor:'pointer', width:'100%', fontFamily:t.fontHead, fontWeight:t.headWeight, fontSize:18, color:'#fff', background:ACCENT, border:'2.5px solid #16121F', borderRadius:15, padding:14, boxShadow:sh(4,4,0,'#16121F'), transition:'transform .12s' }}>
                {t.checkoutBtn}
              </button>
              <p style={{ margin:'10px 0 0', textAlign:'center', fontFamily:t.fontBody, fontSize:12, color:'#8A8194' }}>{t.sticker}</p>
            </div>
          </>
        ) : (
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:14, padding:30, textAlign:'center' }}>
            <TeddyBear size={74} />
            <div style={{ fontFamily:t.fontHead, fontWeight:700, fontSize:19 }}>{t.emptyTitle}</div>
            <p style={{ margin:0, fontFamily:t.fontBody, fontSize:13, color:'#8A8194', lineHeight:1.6 }}>
              {t.emptyP.split('\n').map((line, i) => <span key={i}>{line}{i===0&&<br/>}</span>)}
            </p>
            <button onClick={() => { setCartOpen(false); setTimeout(toCatalog, 120) }} style={{ cursor:'pointer', fontFamily:t.fontHead, fontWeight:t.headWeight, fontSize:15, color:'#fff', background:'#FF3D8B', border:'2px solid #16121F', borderRadius:13, padding:'11px 20px', boxShadow:sh(3,3,0,'#16121F') }}>
              {t.emptyBtn}
            </button>
          </div>
        )}
      </aside>

      {/* ── TOAST ── */}
      {toast && (
        <div style={{ position:'fixed', bottom:26, left:'50%', transform:'translateX(-50%)', zIndex:90, background:'#16121F', color:'#fff', borderRadius:14, padding:'13px 20px', display:'flex', alignItems:'center', gap:10, boxShadow:'4px 4px 0 rgba(0,0,0,.25)', animation:'toastup .25s ease', fontFamily:t.fontHead, fontWeight:t.headWeight, fontSize:15 }}>
          <span style={{ color:'#FFE9B0' }}>✦</span>
          <span>{toast}</span>
        </div>
      )}

      {/* ── SIGN-IN MODAL ── */}
      {showSignInModal && (
        <SignInModal
          lang="he"
          dir={t.dir}
          shadow={sh}
          onSignIn={signInWithGoogle}
          onClose={() => setShowSignInModal(false)}
        />
      )}

      {/* ── PRODUCT EDIT MODAL ── */}
      {showEditModal && editingProduct && (
        <ProductFormModal
          product={editingProduct}
          categories={['Tops','Dresses','Bottoms','Outerwear','Accessories','Knit','Shoes','Vintage']}
          onSave={handleSaveProduct}
          onClose={() => {
            setShowEditModal(false)
            setEditingProduct(undefined)
          }}
        />
      )}
    </div>
  )
}
