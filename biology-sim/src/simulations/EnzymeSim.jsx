import { useFrame } from '@react-three/fiber'
import { OrthographicCamera } from '@react-three/drei'
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier'
import { useState, useRef, useMemo, useEffect } from 'react'
import * as THREE from 'three'
import SimulationLayout from '../components/SimulationLayout'

// --- ACTORS ---

function Substrate({ position }) {
  const rigidBody = useRef()
  useFrame(() => { 
    if (rigidBody.current) {
        rigidBody.current.applyImpulse({ x: (Math.random() - 0.5) * 0.15, y: (Math.random() - 0.5) * 0.15, z: 0 }, true) 
    }
  })
  return (
    <RigidBody ref={rigidBody} position={position} restitution={1} friction={0} linearDamping={0.5} colliders="ball" lockTranslations={[false,false,true]} enabledTranslations={[true, true, false]}>
      {/* Visual Mesh moved to z=0.1 to sit ON TOP of enzymes */}
      <mesh position={[0, 0, 0.1]}>
        <circleGeometry args={[0.22, 32]} />
        <meshToonMaterial color="#ff6b6b" />
      </mesh>
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
  // Made shape slightly smaller (0.4 -> 0.3)
  const shape = useMemo(() => {
    const s = new THREE.Shape(); 
    s.moveTo(0, 0.3); 
    s.lineTo(0.3, -0.3); 
    s.lineTo(-0.3, -0.3); 
    s.lineTo(0, 0.3); 
    return s
  }, [])
  
  return (
    <RigidBody ref={rigidBody} position={position} restitution={0.8} friction={0} linearDamping={0.5} colliders="hull" lockTranslations={[false,false,true]} enabledTranslations={[true, true, false]}>
      {/* Visual Mesh moved to z=0.1 to sit ON TOP of enzymes */}
      <mesh position={[0, 0, 0.1]}>
        <shapeGeometry args={[shape]} />
        <meshToonMaterial color="#868e96" />
      </mesh>
    </RigidBody>
  )
}

function Enzyme({ position, onReaction }) {
  const [active, setActive] = useState(false)
  const groupRef = useRef()
  
  const handleCollision = ({ other }) => { 
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
        {/* Visual Mesh moved to z=-0.2 to sit BEHIND particles */}
        <mesh position={[0, 0, -0.2]}>
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

  // ENZYME POSITIONS
  // We define these here so the spawn logic knows where to avoid
  const enzymePos1 = [-3, 0, 0]
  const enzymePos2 = [3, 1.5, 0]

  useEffect(() => { const interval = setInterval(() => setReactions(0), 5000); return () => clearInterval(interval) }, [])
  
  const handleNextStage = () => { 
      setStage(2)
      setInhibitorCount(8) 
  }

  // --- SAFE SPAWN LOGIC ---
  // Generates positions but retries if they are too close to enzymes
  const getSafePosition = () => {
      let pos, valid = false;
      let attempts = 0;
      while(!valid && attempts < 20) {
          pos = [(Math.random()-0.5)*14, (Math.random()-0.5)*8, 0]
          // Check distance to Enzyme 1
          const d1 = Math.hypot(pos[0] - enzymePos1[0], pos[1] - enzymePos1[1])
          // Check distance to Enzyme 2
          const d2 = Math.hypot(pos[0] - enzymePos2[0], pos[1] - enzymePos2[1])
          
          // If we are at least 2.5 units away from both, it's a valid spawn
          if (d1 > 2.5 && d2 > 2.5) {
              valid = true
          }
          attempts++
      }
      return pos
  }

  // Pre-calculate items using safe logic
  const items = useMemo(() => {
    const subs = new Array(50).fill(0).map((_, i) => ({ id: `sub-${i}`, pos: getSafePosition() }))
    const inhibs = new Array(20).fill(0).map((_, i) => ({ id: `inh-${i}`, pos: getSafePosition() }))
    return { subs, inhibs }
  }, []) // Empty dependency array = calculate ONCE on load

  // CONTROLS UI
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

  return (
    <SimulationLayout
      title="Enzyme Kinetics"
      description="Collision Theory"
      topic="TOPIC 1"
      color="#1971c2"
      controls={MyControls}
    >
        {/* Zoom reduced from 45 -> 35 to fit more on mobile screens */}
        <OrthographicCamera makeDefault position={[0, 0, 20]} zoom={35} />
        <ambientLight intensity={0.9} />
        <directionalLight position={[5, 10, 10]} intensity={0.5} />
        
        <Physics gravity={[0, 0, 0]}>
            <PetriDish />
            <Enzyme position={enzymePos1} onReaction={() => setReactions(r => r + 1)} />
            <Enzyme position={enzymePos2} onReaction={() => setReactions(r => r + 1)} />
            
            {items.subs.slice(0, substrateCount).map(s => <Substrate key={s.id} position={s.pos} />)}
            {items.inhibs.slice(0, inhibitorCount).map(s => <Inhibitor key={s.id} position={s.pos} />)}
        </Physics>
    </SimulationLayout>
  )
}