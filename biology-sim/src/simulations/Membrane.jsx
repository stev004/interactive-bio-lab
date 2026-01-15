import { useFrame } from '@react-three/fiber'
import { OrthographicCamera, Text, RoundedBox } from '@react-three/drei'
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier'
import { useState, useMemo, useRef, useEffect } from 'react'
import SimulationLayout from '../components/SimulationLayout'

// --- ACTORS (Static Definitions) ---

function Lipid({ position, isTop }) {
  const meshRef = useRef()
  // Gentle wave animation
  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    const yOffset = Math.sin(t * 2 + position[0] * 0.5) * 0.1
    if (meshRef.current) meshRef.current.position.y = position[1] + yOffset
  })
  return (
    <group ref={meshRef} position={position}>
      <mesh><circleGeometry args={[0.4, 16]} /><meshToonMaterial color="#74c0fc" /></mesh>
    </group>
  )
}

function Ion({ position, isOpen }) {
  const rigidBody = useRef()
  useFrame(() => {
    if (rigidBody.current) {
      // Brownian motion
      rigidBody.current.applyImpulse({ x: (Math.random() - 0.5) * 0.4, y: (Math.random() - 0.5) * 0.4, z: 0 }, true)
      
      // Safety Net: If closed, and an ion magically glitches through, teleport it back up
      const currentPos = rigidBody.current.translation()
      if (!isOpen && currentPos.y < -1) {
        rigidBody.current.setTranslation({ x: currentPos.x, y: 6, z: 0 }, true)
        rigidBody.current.setLinvel({ x: 0, y: 0, z: 0 }, true)
      }
    }
  })
  return (
    <RigidBody ref={rigidBody} position={position} restitution={0.9} friction={0} colliders="ball" ccd={true} lockTranslations={[false,false,true]} enabledTranslations={[true, true, false]}>
      <mesh><circleGeometry args={[0.15, 16]} /><meshToonMaterial color="#ff6b6b" /></mesh>
    </RigidBody>
  )
}

function ChannelProtein({ isOpen }) {
  // Two sliding doors
  return (
    <group>
        <RigidBody type="fixed" position={[isOpen ? -1.6 : -0.7, 0, 0]}> 
            <RoundedBox args={[1.2, 3.2, 0.5]} radius={0.2} smoothness={4}><meshToonMaterial color="#63e6be" /></RoundedBox>
            <CuboidCollider args={[0.6, 1.6, 1]} />
        </RigidBody>
        <RigidBody type="fixed" position={[isOpen ? 1.6 : 0.7, 0, 0]}> 
            <RoundedBox args={[1.2, 3.2, 0.5]} radius={0.2} smoothness={4}><meshToonMaterial color="#63e6be" /></RoundedBox>
            <CuboidCollider args={[0.6, 1.6, 1]} />
        </RigidBody>
        {/* Invisible blocker in the middle when closed */}
        {!isOpen && (<RigidBody type="fixed" position={[0, 0, 0]}><CuboidCollider args={[1.2, 1.6, 1]} /></RigidBody>)}
    </group>
  )
}

// --- MAIN COMPONENT ---
export default function Membrane() {
  const [isOpen, setIsOpen] = useState(false)
  const [ionCount, setIonCount] = useState(20)
  const [resetKey, setResetKey] = useState(0)

  // Force re-render of ions when count changes
  useEffect(() => { setResetKey(r => r + 1) }, [ionCount])

  // Pre-calculate Scene Data
  const lipids = useMemo(() => {
    const items = []
    for (let x = -9; x <= 9; x += 0.85) {
      if (x > -2 && x < 2) continue; // Leave hole for protein
      items.push({ pos: [x, 1.6, 0], isTop: true })
      items.push({ pos: [x, -1.6, 0], isTop: false }) 
    }
    return items
  }, [])

  const ions = useMemo(() => {
    return new Array(50).fill(0).map((_, i) => ({
      id: i,
      pos: [(Math.random() - 0.5) * 16, 4 + Math.random() * 3, 0] 
    }))
  }, [])

  // 1. CONTROLS
  const MyControls = (
    <>
      <div className="control-group">
          <h3 style={{marginTop: 0}}>Controls</h3>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{display:'block', marginBottom: 6, fontWeight:'bold', color:'#495057', fontSize:'0.9rem'}}>Extracellular Ions</label>
            <input type="range" min="1" max="50" style={{width: '100%'}} value={ionCount} onChange={(e) => setIonCount(parseInt(e.target.value))} />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
             <label style={{display:'block', marginBottom: 6, fontWeight:'bold', color:'#495057', fontSize:'0.9rem'}}>Protein Channel</label>
             <button 
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '100%', padding: '12px', background: isOpen ? '#51cf66' : '#fa5252', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem'
                }}
             >
                {isOpen ? "OPEN (Allow Flow)" : "CLOSED (Impermeable)"}
             </button>
             <p style={{fontSize: '0.8rem', marginTop: '8px', color: '#868e96', margin: '8px 0 0 0'}}>
                {isOpen ? "Gradient will equalize." : "Membrane is sealed."}
             </p>
          </div>
      </div>

      <div className="control-group" style={{marginTop: '1.5rem'}}>
             <h3 style={{marginTop: 0, fontSize: '1.1rem'}}>The Science</h3>
             <p style={{lineHeight: 1.5, color: '#495057', fontSize: '0.9rem'}}>
                Molecules move from <strong>High</strong> to <strong>Low Concentration</strong>. The lipid bilayer (yellow) acts as a barrier.
             </p>
      </div>
    </>
  )

  // 2. RENDER (No wrapper function!)
  return (
    <SimulationLayout
      title="Membrane Transport"
      description="Fluid Mosaic & Diffusion"
      topic="TOPIC 2"
      color="#1098ad"
      controls={MyControls}
    >
        <OrthographicCamera makeDefault position={[0, 0, 20]} zoom={35} />
        <ambientLight intensity={1} />
        
        <Physics gravity={[0, 0, 0]}>
            <Text position={[-8, 6, -5]} fontSize={0.6} color="#adb5bd" anchorX="left">EXTRACELLULAR</Text>
            <Text position={[-8, -6, -5]} fontSize={0.6} color="#adb5bd" anchorX="left">INTRACELLULAR</Text>
            
            {/* Background water */}
            <mesh position={[0, 0, -1]}>
                <planeGeometry args={[20, 2.8]} />
                <meshBasicMaterial color={isOpen ? "#fff9db" : "#fff3bf"} transparent opacity={0.8} />
            </mesh>

            {/* Invisible Walls to prevent leaking out of bounds */}
            <RigidBody type="fixed">
                 <CuboidCollider args={[6, 1.4, 5]} position={[-7, 0, 0]} />
                 <CuboidCollider args={[6, 1.4, 5]} position={[7, 0, 0]} />
            </RigidBody>

            {/* The Actors */}
            {lipids.map((l, i) => <Lipid key={i} position={l.pos} isTop={l.isTop} />)}
            
            <ChannelProtein isOpen={isOpen} />
            
            {/* We key the group to force a reset when slider changes */}
            <group key={resetKey}>
                {ions.slice(0, ionCount).map(ion => <Ion key={ion.id} position={ion.pos} isOpen={isOpen} />)}
            </group>

            {/* Box Borders */}
            <RigidBody type="fixed">
               <CuboidCollider args={[10, 1, 1]} position={[0, 8, 0]} />
               <CuboidCollider args={[10, 1, 1]} position={[0, -8, 0]} />
               <CuboidCollider args={[1, 10, 1]} position={[-10, 0, 0]} />
               <CuboidCollider args={[1, 10, 1]} position={[10, 0, 0]} />
            </RigidBody>
        </Physics>
    </SimulationLayout>
  )
}