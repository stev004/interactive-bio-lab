import { useState } from 'react'
import Enzymes from './simulations/Enzymes'
import Membrane from './simulations/Membrane'
import GeneRegulation from './simulations/GeneRegulation' // <--- IMPORT THIS
import './App.css'

export default function App() {
  const [currentSim, setCurrentSim] = useState('menu')

  if (currentSim === 'enzymes') return <><BackButton set={setCurrentSim} /><Enzymes /></>
  if (currentSim === 'membrane') return <><BackButton set={setCurrentSim} /><Membrane /></>
  if (currentSim === 'gene') return <><BackButton set={setCurrentSim} /><GeneRegulation /></> // <--- ADD THIS

  return (
    <div style={{ 
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
      height: '100vh', width: '100vw', background: '#f8f9fa', gap: '2rem' 
    }}>
      <h1 style={{ fontSize: '3rem', color: '#343a40', margin: 0 }}>Biology Lab</h1>
      <p style={{ color: '#868e96', fontSize: '1.2rem' }}>Interactive simulations for complex concepts.</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}> {/* Change cols to 3 */}
        <Card 
          title="Enzyme Kinetics" 
          desc="Collision theory & Inhibition" 
          color="#339af0"
          onClick={() => setCurrentSim('enzymes')} 
        />
        <Card 
          title="Membrane Transport" 
          desc="Fluid Mosaic & Diffusion" 
          color="#51cf66"
          onClick={() => setCurrentSim('membrane')} 
        />
        {/* NEW CARD */}
        <Card 
          title="Gene Regulation" 
          desc="The Lac Operon Model" 
          color="#ff922b"
          onClick={() => setCurrentSim('gene')} 
        />
      </div>
    </div>
  )
}

function Card({ title, desc, color, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: 'white', padding: '2rem', borderRadius: '16px', cursor: 'pointer',
      boxShadow: '0 4px 20px rgba(0,0,0,0.05)', width: '250px', borderTop: `6px solid ${color}`,
      transition: 'transform 0.2s'
    }}
    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
    >
      <h2 style={{ margin: '0 0 0.5rem 0', color: '#212529', fontSize: '1.2rem' }}>{title}</h2>
      <p style={{ margin: 0, color: '#868e96', fontSize: '0.9rem' }}>{desc}</p>
    </div>
  )
}

function BackButton({ set }) {
  return (
    <button 
      onClick={() => set('menu')}
      style={{
        position: 'absolute', top: '10px', left: '10px', zIndex: 1000,
        background: 'white', border: '1px solid #dee2e6', padding: '8px 16px',
        borderRadius: '8px', cursor: 'pointer', fontWeight: '600', color: '#495057'
      }}
    >
      ← Back to Menu
    </button>
  )
}