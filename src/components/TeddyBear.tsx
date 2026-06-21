export default function TeddyBear({ size = 40 }: { size?: number }) {
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 0, left: '5%', width: '36%', height: '36%', borderRadius: '50%', background: '#E0A872', border: '2.5px solid #16121F' }} />
      <div style={{ position: 'absolute', top: 0, right: '5%', width: '36%', height: '36%', borderRadius: '50%', background: '#E0A872', border: '2.5px solid #16121F' }} />
      <div style={{ position: 'absolute', top: '8%', left: '13%', width: '18%', height: '18%', borderRadius: '50%', background: '#FF8FCF' }} />
      <div style={{ position: 'absolute', top: '8%', right: '13%', width: '18%', height: '18%', borderRadius: '50%', background: '#FF8FCF' }} />
      <div style={{ position: 'absolute', bottom: 0, left: '6%', width: '88%', height: '80%', borderRadius: '48% 48% 46% 46%', background: '#E0A872', border: '2.5px solid #16121F' }} />
      <div style={{ position: 'absolute', top: '54%', left: '13%', width: '15%', height: '13%', borderRadius: '50%', background: '#FF8FCF', opacity: 0.85 }} />
      <div style={{ position: 'absolute', top: '54%', right: '13%', width: '15%', height: '13%', borderRadius: '50%', background: '#FF8FCF', opacity: 0.85 }} />
      <div style={{ position: 'absolute', top: '40%', left: '31%', width: '9%', height: '12%', borderRadius: '50%', background: '#16121F' }} />
      <div style={{ position: 'absolute', top: '40%', right: '31%', width: '9%', height: '12%', borderRadius: '50%', background: '#16121F' }} />
      <div style={{ position: 'absolute', top: '55%', left: '31%', width: '38%', height: '30%', borderRadius: '50%', background: '#FBE7CE', border: '2.5px solid #16121F' }} />
      <div style={{ position: 'absolute', top: '60%', left: '44%', width: '12%', height: '9%', borderRadius: '50%', background: '#16121F' }} />
    </div>
  )
}
