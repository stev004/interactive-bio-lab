import { Canvas, useFrame } from '@react-three/fiber'
import { OrthographicCamera, Text, RoundedBox } from '@react-three/drei'
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier'
import { useState, useMemo, useRef, useEffect } from 'react'
import * as THREE from 'three'

// --- 1. THE ACTORS ---

function Lipid({ position, isTop }) {
  const meshRef = useRef()
  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    const yOffset = Math.sin(t * 2 + position[0] * 0.5) * 0.1
    if (meshRef.current) {
        meshRef.current.position.y = position[1] + yOffset
    }
  })

  return (
    <group ref={meshRef} position={position}>
      <mesh>
        <circleGeometry args={[0.4, 16]} />
        <meshToonMaterial color="#74c0fc" />
      </mesh>
    </group>
  )
}

function Ion({ position, isOpen }) {
  const rigidBody = useRef()
  
  useFrame(() => {
    if (rigidBody.current) {
      // 1. Physics Jitter (Heat)
      rigidBody.current.applyImpulse({ 
        x: (Math.random() - 0.5) * 0.4, 
        y: (Math.random() - 0.5) * 0.4, 
        z: 0 
      }, true)

      // 2. THE SAFETY NET (Logic Fix)
      // If gate is closed (!isOpen) and this ball somehow leaked to the bottom (y < 0)
      // We catch it and teleport it back to the top immediately.
      const currentPos = rigidBody.current.translation()
      if (!isOpen && currentPos.y < -1) {
        rigidBody.current.setTranslation({ x: currentPos.x, y: 6, z: 0 }, true)
        rigidBody.current.setLinvel({ x: 0, y: 0, z: 0 }, true)
      }
    }
  })

  return (
    <RigidBody ref={rigidBody} position={position} restitution={0.9} friction={0} colliders="ball" ccd={true} lockTranslations={[false,false,true]} enabledTranslations={[true, true, false]}>
      <mesh>
        <circleGeometry args={[0.15, 16]} />
        <meshToonMaterial color="#ff6b6b" />
      </mesh>
    </RigidBody>
  )
}

function ChannelProtein({ isOpen }) {
  return (
    <group>
        {/* Left Green Block */}
        <RigidBody type="fixed" position={[isOpen ? -1.6 : -0.7, 0, 0]}> 
            <RoundedBox args={[1.2, 3.2, 0.5]} radius={0.2} smoothness={4}>
                <meshToonMaterial color="#63e6be" />
            </RoundedBox>
            {/* Physics for the block itself */}
            <CuboidCollider args={[0.6, 1.6, 1]} /> 
        </RigidBody>

        {/* Right Green Block */}
        <RigidBody type="fixed" position={[isOpen ? 1.6 : 0.7, 0, 0]}> 
            <RoundedBox args={[1.2, 3.2, 0.5]} radius={0.2} smoothness={4}>
                <meshToonMaterial color="#63e6be" />
            </RoundedBox>
            <CuboidCollider args={[0.6, 1.6, 1]} />
        </RigidBody>

        {/* THE PLUG: This fills the gap perfectly when closed */}
        {!isOpen && (
            <RigidBody type="fixed" position={[0, 0, 0]}>
                {/* Width 2.4 ensures it overlaps with the side walls (Gap is ~2.0) */}
                <CuboidCollider args={[1.2, 1.6, 1]} /> 
            </RigidBody>
        )}
    </group>
  )
}

// --- 2. THE SCENE ---
export default function Membrane() {
  const [isOpen, setIsOpen] = useState(false)
  const [ionCount, setIonCount] = useState(20)
  const [resetKey, setResetKey] = useState(0)

  useEffect(() => {
    setResetKey(r => r + 1)
  }, [ionCount])

  const lipids = useMemo(() => {
    const items = []
    for (let x = -9; x <= 9; x += 0.85) {
      if (x > -2 && x < 2) continue; 
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

  return (
    <>
      <div className="canvas-container">
        <Canvas>
          <OrthographicCamera makeDefault position={[0, 0, 20]} zoom={35} />
          <ambientLight intensity={1} />
          
          <Physics gravity={[0, 0, 0]}>
            
            <Text position={[-8, 6, -5]} fontSize={0.6} color="#adb5bd" anchorX="left">EXTRACELLULAR</Text>
            <Text position={[-8, -6, -5]} fontSize={0.6} color="#adb5bd" anchorX="left">INTRACELLULAR</Text>

            <mesh position={[0, 0, -1]}>
                <planeGeometry args={[20, 2.8]} />
                <meshBasicMaterial color={isOpen ? "#fff9db" : "#fff3bf"} transparent opacity={0.8} />
            </mesh>

            {/* --- INVISIBLE WALLS (Recalculated for Overlap) --- */}
            <RigidBody type="fixed">
                 {/* Left Wall: Center -7. Width 12. Extends from -13 to -1. */}
                 <CuboidCollider args={[6, 1.4, 5]} position={[-7, 0, 0]} />
                 
                 {/* Right Wall: Center 7. Width 12. Extends from 1 to 13. */}
                 {/* Gap between walls is -1 to 1 (Width 2). The "Plug" is Width 2.4. Perfect Seal. */}
                 <CuboidCollider args={[6, 1.4, 5]} position={[7, 0, 0]} />
            </RigidBody>

            {lipids.map((l, i) => <Lipid key={i} position={l.pos} isTop={l.isTop} />)}
            <ChannelProtein isOpen={isOpen} />

            <group key={resetKey}>
                {/* We pass 'isOpen' to Ion now so it can self-correct if it leaks */}
                {ions.slice(0, ionCount).map(ion => <Ion key={ion.id} position={ion.pos} isOpen={isOpen} />)}
            </group>

            {/* Container Boundaries */}
            <RigidBody type="fixed">
               <CuboidCollider args={[10, 1, 1]} position={[0, 8, 0]} />
               <CuboidCollider args={[10, 1, 1]} position={[0, -8, 0]} />
               <CuboidCollider args={[1, 10, 1]} position={[-10, 0, 0]} />
               <CuboidCollider args={[1, 10, 1]} position={[10, 0, 0]} />
            </RigidBody>

          </Physics>
        </Canvas>
      </div>

      <div className="sidebar">
        <div>
           <span style={{ background: '#e3fafc', color: '#1098ad', padding: '4px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 'bold' }}>
            TOPIC 2
          </span>
          <h1>Membrane Transport</h1>
          <p>Diffusion & Gradients</p>
        </div>

        <div className="control-group">
          <h2>Experimental Controls</h2>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label>Extracellular Ions</label>
            <input type="range" min="1" max="50" value={ionCount} onChange={(e) => setIonCount(parseInt(e.target.value))} />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
             <label>Protein Channel Status</label>
             <button 
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '100%',
                    padding: '12px',
                    background: isOpen ? '#51cf66' : '#fa5252',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
             >
                {isOpen ? "OPEN (Allow Flow)" : "CLOSED (Impermeable)"}
             </button>
             <p style={{fontSize: '0.8rem', marginTop: '10px', color: '#868e96'}}>
                {isOpen ? "Gradient will equalize." : "Membrane is sealed. No transport."}
             </p>
          </div>
        </div>

        <div className="control-group">
             <h3>The Science</h3>
             <p>
                When the channel is <strong>Closed</strong>, the lipid bilayer acts as a perfect insulator. Ions cannot cross the hydrophobic (yellow) core.
             </p>
             <p>
                When <strong>Open</strong>, ions rush down their concentration gradient (from Top to Bottom) until equilibrium is reached.
             </p>
        </div>
      </div>
    </>
  )
}