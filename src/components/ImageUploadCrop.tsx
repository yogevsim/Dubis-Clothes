import { useRef, useState } from 'react'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'

interface Props {
  onUpload: (url: string) => Promise<void>
  onCancel: () => void
  label?: string
}

export default function ImageUploadCrop({ onUpload, onCancel, label = 'Upload image' }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0, scale: 1 })
  const [uploading, setUploading] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileSelect(f: File | null) {
    if (!f) return
    setFile(f)
    const reader = new FileReader()
    reader.onload = e => setPreview(e.target?.result as string)
    reader.readAsDataURL(f)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f?.type.startsWith('image/')) handleFileSelect(f)
  }

  async function handleUpload() {
    if (!file || !canvasRef.current || !preview) return
    setUploading(true)

    // Draw cropped image to canvas
    const img = new Image()
    img.onload = async () => {
      const canvas = canvasRef.current!
      const size = 300
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')!

      const scaledWidth = img.width * crop.scale
      const scaledHeight = img.height * crop.scale
      const drawX = (size - scaledWidth) / 2 + crop.x
      const drawY = (size - scaledHeight) / 2 + crop.y

      ctx.drawImage(img, drawX, drawY, scaledWidth, scaledHeight)

      canvas.toBlob(async blob => {
        if (!blob) return
        try {
          const storage = getStorage()
          const fileName = `${Date.now()}-${file.name}`
          const storageRef = ref(storage, `products/${fileName}`)
          await uploadBytes(storageRef, blob)
          const url = await getDownloadURL(storageRef)
          await onUpload(url)
          setFile(null)
          setPreview(null)
        } finally {
          setUploading(false)
        }
      }, 'image/jpeg', 0.9)
    }
    img.src = preview
  }

  if (!file) {
    return (
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: '2px dashed #16121F',
          borderRadius: 16,
          padding: '32px 20px',
          textAlign: 'center',
          cursor: 'pointer',
          background: '#FFF6FB',
          transition: 'background 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = '#FFE9F5')}
        onMouseLeave={e => (e.currentTarget.style.background = '#FFF6FB')}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={e => handleFileSelect(e.target.files?.[0] ?? null)}
        />
        <div style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 700, fontSize: 15, marginBottom: 6 }}>
          {label}
        </div>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, color: '#8A8194' }}>
          Drag & drop or click to select
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Preview + crop controls */}
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              width: '100%',
              aspectRatio: '1',
              background: '#f0f0f0',
              borderRadius: 12,
              border: '2px solid #EBE3D6',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            {preview && (
              <img
                src={preview}
                alt="preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  transform: `scale(${crop.scale})`,
                  cursor: 'grab',
                }}
                onMouseDown={e => {
                  const startX = e.clientX
                  const startY = e.clientY
                  const startCrop = { ...crop }
                  const handleMouseMove = (moveE: MouseEvent) => {
                    const dx = (moveE.clientX - startX) * 0.01
                    const dy = (moveE.clientY - startY) * 0.01
                    setCrop({ x: startCrop.x + dx, y: startCrop.y + dy, scale: startCrop.scale })
                  }
                  const handleMouseUp = () => {
                    document.removeEventListener('mousemove', handleMouseMove)
                    document.removeEventListener('mouseup', handleMouseUp)
                  }
                  document.addEventListener('mousemove', handleMouseMove)
                  document.addEventListener('mouseup', handleMouseUp)
                }}
              />
            )}
          </div>
        </div>

        {/* Zoom control */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
          <div style={{ fontSize: 13, color: '#8A8194', fontWeight: 600 }}>Scale</div>
          <input
            type="range"
            min="0.5"
            max="3"
            step="0.1"
            value={crop.scale}
            onChange={e => setCrop({ ...crop, scale: parseFloat(e.target.value) })}
            style={{ width: 60, cursor: 'pointer' }}
          />
          <div style={{ fontSize: 12, color: '#8A8194', textAlign: 'center' }}>
            {(crop.scale * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="btn-lift"
          style={{
            flex: 1,
            padding: '11px 16px',
            background: '#FF3D8B',
            color: '#fff',
            border: '2.5px solid #16121F',
            borderRadius: 12,
            fontFamily: 'Fredoka, sans-serif',
            fontWeight: 700,
            fontSize: 14,
            cursor: uploading ? 'wait' : 'pointer',
            opacity: uploading ? 0.65 : 1,
            transition: 'transform .12s',
          }}
        >
          {uploading ? '…' : 'Upload'}
        </button>
        <button
          onClick={() => {
            setFile(null)
            setPreview(null)
            onCancel()
          }}
          disabled={uploading}
          style={{
            flex: 1,
            padding: '11px 16px',
            background: '#fff',
            color: '#16121F',
            border: '2px solid #EBE3D6',
            borderRadius: 12,
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 600,
            fontSize: 14,
            cursor: uploading ? 'wait' : 'pointer',
          }}
        >
          Cancel
        </button>
      </div>

      {/* Hidden canvas for cropping */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}
