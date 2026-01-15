import { useFrame } from '@react-three/fiber'
import { OrthographicCamera } from '@react-three/drei'
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier'
import { useState, useRef, useMemo, useEffect } from 'react'
import * as THREE from 'three'
import SimulationLayout from '../components/SimulationLayout'

// --- ACTORS (Static Definitions) ---

function Substrate({ position }) {
  const rigidBody = useRef()
  // Apply a tiny impulse every frame to simulate Brownian motion (heat)
  useFrame(() => { 
    if (rigidBody.current) {
        rigidBody.current.applyImpulse({ x: (Math.random() - 0.5) * 0.15, y: (Math.random() - 0.5) * 0.15, z: 0 }, true) 
    }
  })
  return (
    <RigidBody ref={rigidBody} position={position} restitution={1} friction={0} linearDamping={0.5} colliders="ball" lockTranslations={[false,false,true]} enabledTranslations={[true, true, false]}>
      <mesh><circleGeometry args={[0.3, 32]} /><meshToonMaterial color="#ff6b6b" /></mesh>
    </RigidBody>
  )
}

function Inhibitor({ position }) {
  const rigidBody = useRef()
  useFrame(() => { 
    if (rigidBody.current) {
        rigidBody.current.applyImpulse({ x: (Math.random() - 0.5) * 0.1, y: (Math.random() - 0.5) * 0.1, z: 0 }, true) 
    }
  })
  const shape = useMemo(() => {
    const s = new THREE.Shape(); s.moveTo(0, 0.4); s.lineTo(0.4, -0.4); s.lineTo(-0.4, -0.4); s.lineTo(0, 0.4); return s
  }, [])
  return (
    <RigidBody ref={rigidBody} position={position} restitution={0.8} friction={0} linearDamping={0.5} colliders="hull" lockTranslations={[false,false,true]} enabledTranslations={[true, true, false]}>
      <mesh><shapeGeometry args={[shape]} /><meshToonMaterial color="#868e96" /></mesh>
    </RigidBody>
  )
}

function Enzyme({ position, onReaction }) {
  const [active, setActive] = useState(false)
  const groupRef = useRef()
  
  const handleCollision = ({ other }) => { 
      // Only react if we aren't already busy
      if (!active) {
        setActive(true)
        onReaction()
        setTimeout(() => setActive(false), 200)
      }
  }

  const enzymeShape = useMemo(() => {
    const shape = new THREE.Shape(); const angle = 0.8; const radius = 1.2
    shape.absarc(0, 0, radius, angle, Math.PI * 2 - angle, false); shape.lineTo(0, 0); return shape
  }, [])

  useFrame((state) => { if (groupRef.current) groupRef.current.rotation.z = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.1 + (Math.PI / 4) })
  
  return (
    <RigidBody position={position} type="fixed" onCollisionEnter={handleCollision} colliders="hull">
      <group ref={groupRef}>
        <mesh>
          <extrudeGeometry args={[enzymeShape, { depth: 0.4, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05 }]} />
          <meshToonMaterial color={active ? "#51cf66" : "#228be6"} /> 
        </mesh>
      </group>
    </RigidBody>
  )
}

function PetriDish() {
  return (
    <group>
      <mesh position={[0, 0, -1]}><planeGeometry args={[16, 10]} /><meshStandardMaterial color="#f8f9fa" /></mesh>
      <RigidBody type="fixed" friction={0} restitution={1}>
        <CuboidCollider args={[1, 5, 10]} position={[-9, 0, 0]} />
        <CuboidCollider args={[1, 5, 10]} position={[9, 0, 0]} />
        <CuboidCollider args={[8, 1, 10]} position={[0, 6, 0]} />
        <CuboidCollider args={[8, 1, 10]} position={[0, -6, 0]} />
        {/* Front and Back glass to keep balls in 2D plane */}
        <CuboidCollider args={[16, 10, 1]} position={[0, 0, -2]} />
        <CuboidCollider args={[16, 10, 1]} position={[0, 0, 2]} />
      </RigidBody>
    </group>
  )
}

// --- MAIN COMPONENT ---
export default function EnzymeSim() {
  const [stage, setStage] = useState(1) 
  const [substrateCount, setSubstrateCount] = useState(15)
  const [inhibitorCount, setInhibitorCount] = useState(0)
  const [reactions, setReactions] = useState(0)

  useEffect(() => { const interval = setInterval(() => setReactions(0), 5000); return () => clearInterval(interval) }, [])
  
  const handleNextStage = () => { 
      setStage(2)
      setInhibitorCount(8) 
  }

  // Pre-calculate items so they don't regenerate on every render
  const items = useMemo(() => {
    const subs = new Array(50).fill(0).map((_, i) => ({ id: `sub-${i}`, pos: [(Math.random()-0.5)*14, (Math.random()-0.5)*8, 0] }))
    const inhibs = new Array(20).fill(0).map((_, i) => ({ id: `inh-${i}`, pos: [(Math.random()-0.5)*14, (Math.random()-0.5)*8, 0] }))
    return { subs, inhibs }
  }, [])

  // 1. COMPACT CONTROLS
  const MyControls = (
    <>
      <div className="control-group">
        <div style={{display: 'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem'}}>
             <h3 style={{margin: 0}}>Controls</h3>
             <div style={{ background: '#e7f5ff', padding: '4px 12px', borderRadius: '20px', color: '#1971c2', fontWeight: 'bold', fontSize: '0.9rem' }}>
                {Math.round(reactions / 5 * 10) / 10} /sec
             </div>
        </div>

        <div style={{marginBottom: '1rem'}}>
             <label style={{display:'block', marginBottom: 6, fontWeight:'bold', color:'#495057', fontSize:'0.9rem'}}>Substrate (Food)</label>
             <input type="range" min="1" max="50" style={{width: '100%'}} value={substrateCount} onChange={(e) => setSubstrateCount(parseInt(e.target.value))} />
        </div>
        
        {stage === 2 && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{display:'block', marginBottom: 6, fontWeight:'bold', color: '#e03131', fontSize:'0.9rem' }}>Inhibitor (Blockers)</label>
              <input type="range" min="0" max="20" style={{width: '100%'}} value={inhibitorCount} onChange={(e) => setInhibitorCount(parseInt(e.target.value))} />
            </div>
        )}

        {stage === 1 && (
            <button 
                onClick={handleNextStage}
                style={{ width: '100%', padding: '12px', background: '#339af0', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize:'0.9rem' }}
            >
                Add Competitive Inhibitors +
            </button>
        )}
      </div>

      <div className="control-group" style={{marginTop: '1.5rem'}}>
            <h3 style={{marginTop: 0, fontSize:'1.1rem'}}>The Science</h3>
            <p style={{lineHeight: 1.5, color: '#495057', fontSize:'0.9rem', marginBottom:'0.5rem'}}>
               Enzymes depend on random collisions. Higher concentration = more collisions.
            </p>
            {stage === 2 && (
                <p style={{ lineHeight: 1.5, color: '#495057', fontSize:'0.9rem', marginTop: '10px', borderTop: '1px solid #eee', paddingTop: '10px'}}>
                   <strong>Inhibitors</strong> mimic the substrate, blocking the active site.
                </p>
            )}
      </div>
    </>
  )

  // 2. THE RENDER
  // Note: We pass the scene DIRECTLY as children, no "MyScene" wrapper function.
  return (
    <SimulationLayout
      title="Enzyme Kinetics"
      description="Collision Theory"
      topic="TOPIC 1"
      color="#1971c2"
      controls={MyControls}
    >
        <OrthographicCamera makeDefault position={[0, 0, 20]} zoom={45} />
        <ambientLight intensity={0.9} />
        <directionalLight position={[5, 10, 10]} intensity={0.5} />
        
        <Physics gravity={[0, 0, 0]}>
            <PetriDish />
            {/* We use a stable callback wrapper for the reaction update to be safe, though inline is fine now */}
            <Enzyme position={[-3, 0, 0]} onReaction={() => setReactions(r => r + 1)} />
            <Enzyme position={[3, 1.5, 0]} onReaction={() => setReactions(r => r + 1)} />
            
            {items.subs.slice(0, substrateCount).map(s => <Substrate key={s.id} position={s.pos} />)}
            {items.inhibs.slice(0, inhibitorCount).map(s => <Inhibitor key={s.id} position={s.pos} />)}
        </Physics>
    </SimulationLayout>
  )
}