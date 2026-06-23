import { useEffect, useState } from 'react'
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc, Timestamp } from 'firebase/firestore'
import { db } from '../firebase'
import ImageUploadCrop from './ImageUploadCrop'

interface Product {
  id: number
  category: string
  backgroundHex: string
  inkHex: string
  en: { name: string; price: number; tag: string }
  he: { name: string; price: number; tag: string }
  photoUrl: string | null
}

const CATEGORIES = ['Tops', 'Dresses', 'Bottoms', 'Outerwear', 'Accessories', 'Knit', 'Shoes', 'Vintage']

const SH = (x: number, y: number, b: number, c: string) => `${x}px ${y}px ${b}px ${c}`

export default function ProductsManager() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [uploading, setUploading] = useState(false)
  const [expandedForm, setExpandedForm] = useState(false)
  const [form, setForm] = useState<Partial<Product>>({
    category: CATEGORIES[0],
    backgroundHex: '#FFD9EC',
    inkHex: '#FF3D8B',
    en: { name: '', price: 0, tag: '' },
    he: { name: '', price: 0, tag: '' },
    photoUrl: null,
  })

  useEffect(() => {
    loadProducts()
  }, [])

  async function loadProducts() {
    const snap = await getDocs(collection(db, 'products'))
    const prods = snap.docs
      .map(d => d.data() as Product)
      .sort((a, b) => (a.id ?? 0) - (b.id ?? 0))
    setProducts(prods)
    setLoading(false)
  }

  async function handleSave() {
    if (!form.en?.name || !form.he?.name || editingId === undefined) return

    setUploading(true)
    try {
      if (editingId !== null) {
        const docRef = doc(db, 'products', String(editingId))
        await updateDoc(docRef, {
          category: form.category,
          backgroundHex: form.backgroundHex,
          inkHex: form.inkHex,
          en: form.en,
          he: form.he,
          photoUrl: form.photoUrl,
        })
      } else {
        const nextId = (Math.max(...products.map(p => p.id ?? 0), 0) as number) + 1
        await addDoc(collection(db, 'products'), {
          id: nextId,
          category: form.category,
          backgroundHex: form.backgroundHex,
          inkHex: form.inkHex,
          en: form.en,
          he: form.he,
          photoUrl: form.photoUrl,
          createdAt: Timestamp.now(),
        })
      }
      await loadProducts()
      setEditingId(null)
      setForm({
        category: CATEGORIES[0],
        backgroundHex: '#FFD9EC',
        inkHex: '#FF3D8B',
        en: { name: '', price: 0, tag: '' },
        he: { name: '', price: 0, tag: '' },
        photoUrl: null,
      })
      setExpandedForm(false)
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this product?')) return
    await deleteDoc(doc(db, 'products', String(id)))
    await loadProducts()
  }

  function handleEdit(p: Product) {
    setEditingId(p.id)
    setForm(p)
    setExpandedForm(true)
  }

  async function handlePhotoUpload(url: string) {
    setForm({ ...form, photoUrl: url })
  }

  if (loading) return <div>Loading…</div>

  return (
    <div style={{ padding: '20px 0' }}>
      <button
        onClick={() => {
          setEditingId(null)
          setForm({
            category: CATEGORIES[0],
            backgroundHex: '#FFD9EC',
            inkHex: '#FF3D8B',
            en: { name: '', price: 0, tag: '' },
            he: { name: '', price: 0, tag: '' },
            photoUrl: null,
          })
          setExpandedForm(!expandedForm)
        }}
        className="btn-lift"
        style={{
          cursor: 'pointer',
          padding: '12px 20px',
          background: '#FF3D8B',
          color: '#fff',
          border: '2.5px solid #16121F',
          borderRadius: 14,
          fontFamily: 'Fredoka, sans-serif',
          fontWeight: 700,
          fontSize: 15,
          boxShadow: SH(3, 3, 0, '#16121F'),
          marginBottom: 20,
        }}
      >
        {expandedForm ? '✕ Cancel' : '+ Add Product'}
      </button>

      {expandedForm && (
        <div
          style={{
            background: '#fff',
            border: '2.5px solid #16121F',
            borderRadius: 16,
            padding: '20px',
            marginBottom: 20,
            boxShadow: SH(4, 4, 0, '#16121F'),
          }}
        >
          <h3 style={{ margin: '0 0 16px', fontFamily: 'Fredoka, sans-serif', fontWeight: 700 }}>
            {editingId ? 'Edit Product' : 'New Product'}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>Category</label>
              <select
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '2px solid #16121F',
                  borderRadius: 10,
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 14,
                }}
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>Background Color</label>
              <input
                type="color"
                value={form.backgroundHex}
                onChange={e => setForm({ ...form, backgroundHex: e.target.value })}
                style={{
                  width: '100%',
                  height: 40,
                  border: '2px solid #16121F',
                  borderRadius: 10,
                  cursor: 'pointer',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>Ink Color</label>
              <input
                type="color"
                value={form.inkHex}
                onChange={e => setForm({ ...form, inkHex: e.target.value })}
                style={{
                  width: '100%',
                  height: 40,
                  border: '2px solid #16121F',
                  borderRadius: 10,
                  cursor: 'pointer',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>Tag</label>
              <input
                type="text"
                value={form.en?.tag ?? ''}
                onChange={e => setForm({ ...form, en: { ...form.en!, tag: e.target.value } })}
                placeholder="e.g., new in"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '2px solid #16121F',
                  borderRadius: 10,
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 14,
                }}
              />
            </div>
          </div>

          {/* EN */}
          <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '2px solid #EBE3D6' }}>
            <h4 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700 }}>English</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 12 }}>
              <input
                type="text"
                value={form.en?.name ?? ''}
                onChange={e => setForm({ ...form, en: { ...form.en!, name: e.target.value } })}
                placeholder="Product name"
                style={{
                  padding: '8px 12px',
                  border: '2px solid #16121F',
                  borderRadius: 10,
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 14,
                }}
              />
              <input
                type="number"
                value={form.en?.price ?? 0}
                onChange={e => setForm({ ...form, en: { ...form.en!, price: parseFloat(e.target.value) } })}
                placeholder="Price"
                style={{
                  padding: '8px 12px',
                  border: '2px solid #16121F',
                  borderRadius: 10,
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 14,
                }}
              />
            </div>
          </div>

          {/* HE */}
          <div style={{ marginBottom: 16 }}>
            <h4 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700 }}>Hebrew</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 12 }}>
              <input
                type="text"
                value={form.he?.name ?? ''}
                onChange={e => setForm({ ...form, he: { ...form.he!, name: e.target.value } })}
                placeholder="שם המוצר"
                style={{
                  padding: '8px 12px',
                  border: '2px solid #16121F',
                  borderRadius: 10,
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 14,
                }}
              />
              <input
                type="number"
                value={form.he?.price ?? 0}
                onChange={e => setForm({ ...form, he: { ...form.he!, price: parseFloat(e.target.value) } })}
                placeholder="מחיר"
                style={{
                  padding: '8px 12px',
                  border: '2px solid #16121F',
                  borderRadius: 10,
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 14,
                }}
              />
            </div>
          </div>

          {/* Photo */}
          {form.photoUrl ? (
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 10, fontWeight: 600, fontSize: 13 }}>Photo</div>
              <div style={{ position: 'relative', marginBottom: 10 }}>
                <img src={form.photoUrl} alt="preview" style={{ maxWidth: 200, borderRadius: 10, border: '2px solid #16121F' }} />
                <button
                  onClick={() => setForm({ ...form, photoUrl: null })}
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    background: '#FF3D8B',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    width: 28,
                    height: 28,
                    cursor: 'pointer',
                    fontWeight: 700,
                  }}
                >
                  ✕
                </button>
              </div>
              <button
                onClick={() => setForm({ ...form, photoUrl: null })}
                style={{
                  padding: '8px 16px',
                  background: '#fff',
                  color: '#16121F',
                  border: '2px solid #EBE3D6',
                  borderRadius: 10,
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Change photo
              </button>
            </div>
          ) : (
            <div style={{ marginBottom: 16 }}>
              <ImageUploadCrop
                onUpload={handlePhotoUpload}
                onCancel={() => {}}
                label="Upload product photo"
              />
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={uploading || !form.en?.name || !form.he?.name}
            style={{
              cursor: uploading ? 'wait' : 'pointer',
              width: '100%',
              padding: '12px 20px',
              background: '#FF3D8B',
              color: '#fff',
              border: '2.5px solid #16121F',
              borderRadius: 12,
              fontFamily: 'Fredoka, sans-serif',
              fontWeight: 700,
              fontSize: 15,
              opacity: uploading || !form.en?.name || !form.he?.name ? 0.65 : 1,
            }}
          >
            {uploading ? '…' : 'Save Product'}
          </button>
        </div>
      )}

      {/* Product list */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
        {products.map(p => (
          <div
            key={p.id}
            style={{
              background: '#fff',
              border: '2.5px solid #16121F',
              borderRadius: 14,
              overflow: 'hidden',
              boxShadow: SH(4, 4, 0, '#16121F'),
            }}
          >
            {p.photoUrl ? (
              <img
                src={p.photoUrl}
                alt={p.en.name}
                style={{ width: '100%', height: 160, objectFit: 'cover' }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: 160,
                  background: p.backgroundHex,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  color: 'rgba(22,18,31,0.3)',
                }}
              >
                {p.en.name}
              </div>
            )}
            <div style={{ padding: '12px' }}>
              <div style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
                {p.en.name}
              </div>
              <div style={{ fontSize: 12, color: '#8A8194', marginBottom: 8 }}>
                ${p.en.price} / ₪{p.he.price}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => handleEdit(p)}
                  style={{
                    flex: 1,
                    padding: '6px',
                    background: '#D9F5EC',
                    border: '2px solid #16121F',
                    borderRadius: 8,
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 600,
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  style={{
                    flex: 1,
                    padding: '6px',
                    background: '#FFE9F5',
                    border: '2px solid #16121F',
                    borderRadius: 8,
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 600,
                    fontSize: 12,
                    cursor: 'pointer',
                    color: '#B5707E',
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
