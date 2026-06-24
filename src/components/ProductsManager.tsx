import { useEffect, useState } from 'react'
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc, Timestamp } from 'firebase/firestore'
import { db } from '../firebase'
import ProductFormModal from './ProductFormModal'

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

interface ProductWithDocId extends Product {
  _docId?: string
}

const CATEGORIES = ['Tops', 'Dresses', 'Bottoms', 'Outerwear', 'Accessories', 'Knit', 'Shoes', 'Vintage']

const SH = (x: number, y: number, b: number, c: string) => `${x}px ${y}px ${b}px ${c}`

export default function ProductsManager() {
  const [products, setProducts] = useState<ProductWithDocId[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductWithDocId | undefined>()

  useEffect(() => {
    loadProducts()
  }, [])

  async function loadProducts() {
    const snap = await getDocs(collection(db, 'products'))
    const prods = snap.docs
      .map(d => {
        const data = d.data() as any
        // Support both old (he/en) and new (flat) structures
        const product: Product = data.name !== undefined
          ? (data as Product)
          : {
              id: data.id,
              category: data.category,
              backgroundHex: data.backgroundHex,
              inkHex: data.inkHex,
              name: data.he?.name || '',
              price: data.he?.price || 0,
              tag: data.he?.tag || '',
              photoUrl: data.photoUrl,
            }
        return { ...product, _docId: d.id }
      })
      .sort((a, b) => (a.id ?? 0) - (b.id ?? 0))
    setProducts(prods)
    setLoading(false)
  }

  async function handleSave(formData: Partial<Product>) {
    try {
      console.log('Saving:', formData, 'Editing:', editingProduct?.id, 'DocId:', editingProduct?._docId)

      if (editingProduct) {
        // Update existing
        const docRef = doc(db, 'products', editingProduct._docId || String(editingProduct.id))
        const updateData = {
          category: formData.category || editingProduct.category,
          backgroundHex: formData.backgroundHex || editingProduct.backgroundHex,
          inkHex: formData.inkHex || editingProduct.inkHex,
          name: formData.name || editingProduct.name,
          price: formData.price !== undefined ? formData.price : editingProduct.price,
          tag: formData.tag || editingProduct.tag,
          photoUrl: formData.photoUrl !== undefined ? formData.photoUrl : editingProduct.photoUrl,
        }
        console.log('Update data:', updateData)
        await updateDoc(docRef, updateData)
        console.log('Update succeeded')
      } else {
        // Create new
        const nextId = (Math.max(...products.map(p => p.id ?? 0), 0) as number) + 1
        await addDoc(collection(db, 'products'), {
          id: nextId,
          category: formData.category,
          backgroundHex: formData.backgroundHex,
          inkHex: formData.inkHex,
          name: formData.name,
          price: formData.price,
          tag: formData.tag,
          photoUrl: formData.photoUrl,
          createdAt: Timestamp.now(),
        })
        console.log('Create succeeded')
      }
      await loadProducts()
      setModalOpen(false)
      setEditingProduct(undefined)
    } catch (error) {
      console.error('Save failed:', error)
      alert(`Error saving product: ${error}`)
    }
  }

  async function handleDelete(product: ProductWithDocId) {
    if (!confirm('Delete this product?')) return
    try {
      const docId = product._docId || String(product.id)
      await deleteDoc(doc(db, 'products', docId))
      await loadProducts()
    } catch (error) {
      console.error('Delete failed:', error)
    }
  }

  function openAddModal() {
    setEditingProduct(undefined)
    setModalOpen(true)
  }

  function openEditModal(product: ProductWithDocId) {
    setEditingProduct(product)
    setModalOpen(true)
  }

  if (loading) return <div>טוען…</div>

  return (
    <div style={{ padding: '20px 0' }}>
      <button
        onClick={openAddModal}
        className="btn-lift"
        style={{
          cursor: 'pointer',
          padding: '12px 20px',
          background: '#FF3D8B',
          color: '#fff',
          border: '2.5px solid #16121F',
          borderRadius: 14,
          fontFamily: 'Rubik, sans-serif',
          fontWeight: 700,
          fontSize: 15,
          boxShadow: SH(3, 3, 0, '#16121F'),
          marginBottom: 20,
        }}
      >
        + הוסף מוצר
      </button>

      {/* Product grid */}
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
                alt={p.name}
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
                  textAlign: 'center',
                  padding: '8px',
                }}
              >
                {p.name}
              </div>
            )}
            <div style={{ padding: '12px' }}>
              <div style={{ fontFamily: 'Rubik, sans-serif', fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
                {p.name}
              </div>
              <div style={{ fontSize: 12, color: '#8A8194', marginBottom: 8 }}>
                ₪{p.price}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => openEditModal(p)}
                  style={{
                    flex: 1,
                    padding: '6px',
                    background: '#D9F5EC',
                    border: '2px solid #16121F',
                    borderRadius: 8,
                    fontFamily: 'Heebo, sans-serif',
                    fontWeight: 600,
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  עריכה
                </button>
                <button
                  onClick={() => handleDelete(p)}
                  style={{
                    flex: 1,
                    padding: '6px',
                    background: '#FFE9F5',
                    border: '2px solid #16121F',
                    borderRadius: 8,
                    fontFamily: 'Heebo, sans-serif',
                    fontWeight: 600,
                    fontSize: 12,
                    cursor: 'pointer',
                    color: '#B5707E',
                  }}
                >
                  מחק
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modalOpen && (
        <ProductFormModal
          product={editingProduct}
          categories={CATEGORIES}
          onSave={handleSave}
          onClose={() => {
            setModalOpen(false)
            setEditingProduct(undefined)
          }}
        />
      )}
    </div>
  )
}
