import { useState, useEffect } from 'react'
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
      en: { name: '', price: 0, tag: '' },
      he: { name: '', price: 0, tag: '' },
      photoUrl: null,
    }
  )
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (product) {
      setForm(product)
    }
  }, [product])

  async function handleSubmit() {
    if (!form.en?.name || !form.he?.name) return
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
        <h2 style={{ margin: '0 0 20px', fontFamily: 'Fredoka, sans-serif', fontWeight: 700, fontSize: 24 }}>
          {product ? 'Edit Product' : 'New Product'}
        </h2>

        {/* Category & Colors */}
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
              {categories.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>Background</label>
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

        {/* English */}
        <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '2px solid #EBE3D6' }}>
          <h4 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700 }}>English</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 12 }}>
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
              onChange={e => setForm({ ...form, en: { ...form.en!, price: parseFloat(e.target.value) || 0 } })}
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

        {/* Hebrew */}
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700 }}>Hebrew</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 12 }}>
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
              onChange={e => setForm({ ...form, he: { ...form.he!, price: parseFloat(e.target.value) || 0 } })}
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
        <div style={{ marginBottom: 16 }}>
          {form.photoUrl ? (
            <>
              <div style={{ marginBottom: 10, fontWeight: 600, fontSize: 13 }}>Photo</div>
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
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  marginBottom: 16,
                }}
              >
                Change photo
              </button>
            </>
          ) : (
            <div style={{ marginBottom: 16 }}>
              <ImageUploadCrop
                onUpload={url => setForm({ ...form, photoUrl: url })}
                onCancel={() => {}}
                label="Upload product photo"
              />
            </div>
          )}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleSubmit}
            disabled={uploading || !form.en?.name || !form.he?.name}
            style={{
              flex: 1,
              cursor: uploading ? 'wait' : 'pointer',
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
            {uploading ? '…' : 'Save'}
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
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 600,
              fontSize: 15,
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  )
}
