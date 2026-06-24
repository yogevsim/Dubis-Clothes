import { useState, useEffect } from 'react'
import ImageUploadCrop from './ImageUploadCrop'

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

interface Props {
  product?: Product
  categories: string[]
  onSave: (product: Partial<Product>) => Promise<void>
  onClose: () => void
}

const SH = (x: number, y: number, b: number, c: string) => `${x}px ${y}px ${b}px ${c}`

export default function ProductFormModal({ product, categories, onSave, onClose }: Props) {
  const [form, setForm] = useState<Partial<Product>>(
    product || {
      category: categories[0],
      backgroundHex: '#FFD9EC',
      inkHex: '#FF3D8B',
      name: '',
      price: 0,
      tag: '',
      photoUrl: null,
    }
  )
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (product) {
      setForm({
        ...product,
        tag: product.tag || '', // Ensure tag is always a string
      })
    }
  }, [product])

  async function handleSubmit() {
    if (!form.name) return
    setUploading(true)
    try {
      await onSave(form)
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(22,18,31,.6)',
          zIndex: 100,
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 101,
          width: 500,
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: '#fff',
          border: '3px solid #16121F',
          borderRadius: 20,
          padding: '28px',
          boxShadow: SH(8, 8, 0, '#16121F'),
        }}
      >
        <h2 style={{ margin: '0 0 20px', fontFamily: 'Rubik, sans-serif', fontWeight: 700, fontSize: 24 }}>
          {product ? 'ערוך מוצר' : 'מוצר חדש'}
        </h2>

        {/* Category & Colors */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>קטגוריה</label>
            <select
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '2px solid #16121F',
                borderRadius: 10,
                fontFamily: 'Heebo, sans-serif',
                fontSize: 14,
              }}
            >
              {categories.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>צבע רקע</label>
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
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>צבע דיו</label>
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
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>תג</label>
            <input
              type="text"
              value={form.tag ?? ''}
              onChange={e => setForm({ ...form, tag: e.target.value })}
              placeholder="לדוגמה: חדש"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '2px solid #16121F',
                borderRadius: 10,
                fontFamily: 'Heebo, sans-serif',
                fontSize: 14,
              }}
            />
          </div>
        </div>

        {/* Product Details */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 12 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>שם המוצר</label>
              <input
                type="text"
                value={form.name ?? ''}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="שם המוצר"
                style={{
                  padding: '8px 12px',
                  border: '2px solid #16121F',
                  borderRadius: 10,
                  fontFamily: 'Heebo, sans-serif',
                  fontSize: 14,
                  width: '100%',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>מחיר</label>
              <input
                type="number"
                value={form.price ?? 0}
                onChange={e => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                placeholder="מחיר"
                style={{
                  padding: '8px 12px',
                  border: '2px solid #16121F',
                  borderRadius: 10,
                  fontFamily: 'Heebo, sans-serif',
                  fontSize: 14,
                  width: '100%',
                }}
              />
            </div>
          </div>
        </div>

        {/* Photo */}
        <div style={{ marginBottom: 16 }}>
          {form.photoUrl ? (
            <>
              <div style={{ marginBottom: 10, fontWeight: 600, fontSize: 13 }}>תמונה</div>
              <img src={form.photoUrl} alt="preview" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 10, border: '2px solid #16121F', marginBottom: 10 }} />
              <button
                onClick={() => setForm({ ...form, photoUrl: null })}
                style={{
                  width: '100%',
                  padding: '8px 16px',
                  background: '#fff',
                  color: '#16121F',
                  border: '2px solid #EBE3D6',
                  borderRadius: 10,
                  fontFamily: 'Heebo, sans-serif',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  marginBottom: 16,
                }}
              >
                החלף תמונה
              </button>
            </>
          ) : (
            <div style={{ marginBottom: 16 }}>
              <ImageUploadCrop
                onUpload={async (url) => setForm({ ...form, photoUrl: url })}
                onCancel={() => {}}
                label="העלה תמונת מוצר"
              />
            </div>
          )}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleSubmit}
            disabled={uploading || !form.name}
            style={{
              flex: 1,
              cursor: uploading ? 'wait' : 'pointer',
              padding: '12px 20px',
              background: '#FF3D8B',
              color: '#fff',
              border: '2.5px solid #16121F',
              borderRadius: 12,
              fontFamily: 'Rubik, sans-serif',
              fontWeight: 700,
              fontSize: 15,
              opacity: uploading || !form.name ? 0.65 : 1,
            }}
          >
            {uploading ? '…' : 'שמור'}
          </button>
          <button
            onClick={onClose}
            disabled={uploading}
            style={{
              flex: 1,
              cursor: uploading ? 'wait' : 'pointer',
              padding: '12px 20px',
              background: '#fff',
              color: '#16121F',
              border: '2px solid #EBE3D6',
              borderRadius: 12,
              fontFamily: 'Heebo, sans-serif',
              fontWeight: 600,
              fontSize: 15,
            }}
          >
            ביטול
          </button>
        </div>
      </div>
    </>
  )
}
