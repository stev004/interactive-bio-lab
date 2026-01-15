import { useFrame } from '@react-three/fiber'
import { Text, RoundedBox, Float, OrthographicCamera } from '@react-three/drei'
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier'
import { useState, useMemo, useRef } from 'react'
import SimulationLayout from '../components/SimulationLayout'

// --- ACTORS ---

function DNA() {
  return (
    <group position={[0, -2, 0]}>
       {/* Main backbone */}
       <mesh rotation={[0, 0, Math.PI / 2]}>
         <cylinderGeometry args={[0.3, 0.3, 18, 32]} />
         <meshToonMaterial color="#dee2e6" />
       </mesh>
       
       {/* Base pairs (The little rungs) */}
       {Array.from({ length: 20 }).map((_, i) => (
         <mesh key={i} position={[(i - 10) * 0.8 + 0.4, 0, 0]}>
           <boxGeometry args={[0.2, 1.2, 0.2]} />
           <meshToonMaterial color="#adb5bd" />
         </mesh>
       ))}
       
       {/* TEXT FIX: Smaller font and better positioning for mobile */}
       <Text position={[-6, -1.2, 0]} fontSize={0.45} color="#868e96">PROMOTER</Text>
       <Text position={[0, -1.2, 0]} fontSize={0.45} color="#e03131">OPERATOR</Text>
       <Text position={[6, -1.2, 0]} fontSize={0.45} color="#51cf66">GENE (LacZ)</Text>
    </group>
  )
}

function Polymerase({ isBlocked, onFinish }) {
  const ref = useRef()
  const speed = 0.08
  
  useFrame(() => {
    if (!ref.current) return
    // Logic: If blocked by repressor, shake in frustration. Else, move forward.
    if (isBlocked && ref.current.position.x > -2 && ref.current.position.x < -1) {
       ref.current.position.x = -1.5 + (Math.random() - 0.5) * 0.1
    } else {
       ref.current.position.x += speed
    }
    // Loop back to start
    if (ref.current.position.x > 8) {
      ref.current.position.x = -8
      onFinish() 
    }
  })

  return (
    <group ref={ref} position={[-8, -1.2, 0]}>
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.2}>
        <mesh rotation={[0,0,Math.PI/2]}>
            <capsuleGeometry args={[0.8, 1.5, 4, 16]} />
            <meshToonMaterial color="#ff922b" />
        </mesh>
        {/* TEXT FIX: Moved up to 1.5 (was 1.2) so it doesn't overlap the Repressor */}
        <Text position={[0, 1.5, 0]} fontSize={0.4} color="#fd7e14">POLYMERASE</Text>
      </Float>
    </group>
  )
}

function Repressor({ hasLactose }) {
  const ref = useRef()
  useFrame(() => {
    if (!ref.current) return
    // Animation: If lactose is present, float away. If not, clamp down.
    const targetY = hasLactose ? 4 : -1
    const targetRot = hasLactose ? 1 : 0
    ref.current.position.y += (targetY - ref.current.position.y) * 0.1
    ref.current.rotation.z += (targetRot - ref.current.rotation.z) * 0.1
  })
  return (
    <group ref={ref} position={[-0.5, -1, 0]}>
       <RoundedBox args={[2, 2, 1]} radius={0.2}>
         <meshToonMaterial color="#fa5252" />
       </RoundedBox>
       <Text position={[0, 0, 0.6]} fontSize={0.4} color="white">REPRESSOR</Text>
    </group>
  )
}

function Lactose({ position }) {
  const ref = useRef()
  useFrame(() => { 
    if(ref.current) ref.current.applyImpulse({ x: (Math.random()-0.5)*0.01, y: (Math.random()-0.5)*0.01, z: 0 }) 
  })
  return (
    <RigidBody ref={ref} position={position} gravityScale={0.1} linearDamping={2}>
      <mesh>
        <octahedronGeometry args={[0.3]} />
        <meshToonMaterial color="#fcc419" />
      </mesh>
    </RigidBody>
  )
}

// --- MAIN COMPONENT ---
export default function GeneRegulation() {
  const [lactoseLevel, setLactoseLevel] = useState(0)
  const [mrnaCount, setMrnaCount] = useState(0)
  const isRepressorActive = lactoseLevel < 50
  const target = 10
  const isComplete = mrnaCount >= target

  // CONTROLS UI
  const MyControls = (
    <>
      <div className="control-group">
        <h3 style={{marginTop: 0}}>Experimental Controls</h3>
        <div style={{ marginBottom: '1.5rem' }}>
            <label style={{display:'block', marginBottom: 10, fontWeight:'bold', color:'#495057'}}>Lactose Level</label>
            <input 
              type="range" 
              min="0" max="100" 
              style={{width: '100%'}}
              value={lactoseLevel} 
              onChange={(e) => setLactoseLevel(parseInt(e.target.value))} 
            />
        </div>
        
        <div style={{ 
            padding: '12px', 
            background: isRepressorActive ? '#fff5f5' : '#f3f9f4', 
            borderRadius: '8px', 
            borderLeft: `4px solid ${isRepressorActive ? '#ff8787' : '#69db7c'}`
        }}>
            <strong style={{display: 'block', fontSize: '0.8rem', color: '#868e96', marginBottom: '4px'}}>GENE STATUS</strong>
            {isRepressorActive ? (
                <span style={{color: '#e03131', fontWeight: '600'}}>BLOCKED (Repressed)</span>
            ) : (
                <span style={{color: '#2b8a3e', fontWeight: '600'}}>TRANSCRIBING (Expressing)</span>
            )}
        </div>
      </div>

      <div className="control-group" style={{marginTop: '2rem'}}>
           <h3 style={{marginTop: 0}}>Mission</h3>
           <p style={{lineHeight: 1.6, color: '#495057'}}>
              The cell needs proteins! Increase the <strong>Lactose Level</strong> to remove the Repressor block.
           </p>
           <div style={{marginTop: '10px', padding: '10px', background: isComplete ? '#d3f9d8' : '#e9ecef', borderRadius: 6, fontWeight: 'bold', color: isComplete ? '#2b8a3e' : '#495057'}}>
              Goal: {mrnaCount} / {target} mRNA strands
           </div>
      </div>
    </>
  )

  // SCENE
  const lactoseMolecules = useMemo(() => {
    if (lactoseLevel < 10) return []
    return new Array(Math.floor(lactoseLevel / 1.5)).fill(0).map((_, i) => ({
      id: i,
      pos: [(Math.random()-0.5)*14, 3 + (Math.random()*5), 0]
    }))
  }, [lactoseLevel])

  return (
    <SimulationLayout
      title="Gene Regulation"
      description="The Lac Operon Model"
      topic="TOPIC 3"
      color="#e8590c"
      controls={MyControls}
    >
        {/* ZOOM FIX: Reduced from 40 to 26 to fit DNA on mobile */}
        <OrthographicCamera makeDefault position={[0, 0, 20]} zoom={26} />
        
        <ambientLight intensity={1} />
        <directionalLight position={[5, 10, 10]} intensity={1} />
        
        <Physics gravity={[0, -1, 0]}>
            <DNA />
            <Polymerase isBlocked={isRepressorActive} onFinish={() => setMrnaCount(c => c + 1)} />
            <Repressor hasLactose={!isRepressorActive} />
            
            {lactoseMolecules.map(l => <Lactose key={l.id} position={l.pos} />)}
            
            {/* Boundaries */}
            <RigidBody type="fixed">
                    <CuboidCollider args={[10, 1, 1]} position={[0, 8, 0]} />
                    <CuboidCollider args={[1, 10, 1]} position={[-9, 0, 0]} />
                    <CuboidCollider args={[1, 10, 1]} position={[9, 0, 0]} />
                    <CuboidCollider args={[10, 1, 1]} position={[0, -5, 0]} /> 
            </RigidBody>
        </Physics>
    </SimulationLayout>
  )
}