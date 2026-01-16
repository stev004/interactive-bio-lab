import { useState } from 'react'
import Enzymes from './simulations/EnzymeSim' 
import Membrane from './simulations/Membrane'
import GeneRegulation from './simulations/GeneRegulation'
import ATPSynthase from './simulations/ATPSynthase'
import ProteinSynthesis from './simulations/ProteinSynthesis'
import Mutation from './simulations/Mutation'
import './App.css'

export default function App() {
  const [currentSim, setCurrentSim] = useState('menu')

  // Navigation Logic
  if (currentSim === 'enzymes') return <><BackButton set={setCurrentSim} /><Enzymes /></>
  if (currentSim === 'membrane') return <><BackButton set={setCurrentSim} /><Membrane /></>
  if (currentSim === 'gene') return <><BackButton set={setCurrentSim} /><GeneRegulation /></>
  if (currentSim === 'atp') return <><BackButton set={setCurrentSim} /><ATPSynthase /></>
  if (currentSim === 'protein') return <><BackButton set={setCurrentSim} /><ProteinSynthesis /></>
  if (currentSim === 'mutation') return <><BackButton set={setCurrentSim} /><Mutation /></>

  return (
    <div className="menu-container">
      <div className="menu-header">
        <h1>Biology Lab</h1>
        <p>Interactive simulations for complex concepts.</p>
      </div>
      
      {/* THE RESPONSIVE GRID */}
      <div className="card-grid">
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
        <Card 
          title="Gene Regulation" 
          desc="The Lac Operon Model" 
          color="#ff922b"
          onClick={() => setCurrentSim('gene')} 
        />
        <Card 
          title="ATP Synthase" 
          desc="The Molecular Motor" 
          color="#e8590c"
          onClick={() => setCurrentSim('atp')} 
        />
        <Card 
          title="Protein Synthesis" 
          desc="Transcription & Translation" 
          color="#be4bdb"
          onClick={() => setCurrentSim('protein')} 
        />
        <Card 
          title="Mutation" 
          desc="DNA Replication Errors" 
          color="#e64980" 
          onClick={() => setCurrentSim('mutation')} 
        />
      </div>
    </div>
  )
}

// --- SUB-COMPONENTS ---

function Card({ title, desc, color, onClick }) {
  return (
    <div 
      className="menu-card" 
      onClick={onClick}
      style={{ borderTop: `6px solid ${color}` }}
    >
      <h2>{title}</h2>
      <p>{desc}</p>
    </div>
  )
}

function BackButton({ set }) {
  return (
    <button 
      onClick={() => set('menu')}
      className="back-button"
    >
      ← Back to Menu
    </button>
  )
}