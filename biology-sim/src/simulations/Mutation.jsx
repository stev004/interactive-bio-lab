import { useFrame } from '@react-three/fiber'
import { OrthographicCamera, Text, RoundedBox } from '@react-three/drei'
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier'
import { useState, useRef, useEffect, useMemo } from 'react'
import * as THREE from 'three'
import SimulationLayout from '../components/SimulationLayout'

// --- CONSTANTS ---
const COLORS = {
    A: "#339af0", // Blue
    T: "#fab005", // Yellow
    C: "#51cf66", // Green
    G: "#fa5252", // Red
}
const PAIRS = { A: 'T', T: 'A', C: 'G', G: 'C' }
const BASES = ['A', 'T', 'C', 'G']

// --- ACTORS ---

function BaseBlock({ type, position, isTemplate, isError }) {
    return (
        <group position={position}>
            <RoundedBox args={[0.8, 0.8, 0.2]} radius={0.1} smoothness={4}>
                <meshToonMaterial 
                    color={COLORS[type]} 
                    emissive={isError ? "white" : "black"}
                    emissiveIntensity={isError ? 0.8 : 0}
                />
            </RoundedBox>
            <Text position={[0, 0, 0.11]} fontSize={0.5} color="white" anchorX="center" anchorY="middle">
                {type}
            </Text>
            {isError && <Text position={[0, 0.7, 0]} fontSize={0.3} color="#fa5252">MUTATION!</Text>}
        </group>
    )
}

function Polymerase({ onHit, onStep }) {
    const ref = useRef()
    const xPos = useRef(-8)

    // SMOOTH MOVEMENT: Updated every frame for fluid animation
    useFrame((state, delta) => {
        if (!ref.current) return
        
        // Move right smoothly
        xPos.current += delta * 2.0 
        
        // Loop back
        if (xPos.current > 8) {
            xPos.current = -8
            onStep('reset')
        }

        // Apply movement
        ref.current.setTranslation({ x: xPos.current, y: 0, z: 0 }, true)
        
        // Send exact position to parent for building logic
        onStep(xPos.current)
    })

    return (
        <RigidBody ref={ref} type="kinematicPosition" position={[-8, 0, 0]} colliders="cuboid">
             <RoundedBox args={[2.5, 2, 1]} radius={0.5}>
                <meshToonMaterial color="#ff922b" transparent opacity={0.8} />
             </RoundedBox>
             <Text position={[0, 0.2, 0.6]} fontSize={0.3} color="white">POLYMERASE</Text>
             
             {/* SENSOR: Detects Radiation Intersection */}
             <CuboidCollider 
                args={[1.3, 1.1, 0.6]} 
                sensor 
                onIntersectionEnter={({ other }) => {
                    if (other.rigidBodyObject?.userData?.tag === 'mutagen') {
                        onHit()
                    }
                }} 
             />
        </RigidBody>
    )
}

function RadiationParticle({ type }) {
    const ref = useRef()
    
    // Physics properties
    const props = useMemo(() => ({
        alpha: { color: '#ff6b6b', size: 0.4, speed: -4, shape: 'sphere' },   
        beta:  { color: '#22b8cf', size: 0.15, speed: -8, shape: 'sphere' },  
        gamma: { color: '#be4bdb', size: 0.1, speed: -15, shape: 'capsule' }  
    }[type]), [type])

    // Spawn randomly above screen
    const startPos = useMemo(() => [
        (Math.random() - 0.5) * 14, 
        10 + Math.random() * 5, 
        0
    ], [])

    useFrame(() => {
        if (!ref.current) return
        const cur = ref.current.translation()
        
        // VISIBILITY FIX: Lowered floor to -12 so they cross the entire screen
        if (cur.y < -12) {
             ref.current.setTranslation({ x: (Math.random()-0.5)*14, y: 12, z: 0 }, true)
             ref.current.setLinvel({ x: (Math.random()-0.5), y: props.speed, z: 0 }, true)
        }
    })

    return (
        <RigidBody 
            ref={ref} 
            position={startPos} 
            linearVelocity={[(Math.random()-0.5), props.speed, 0]} 
            userData={{ tag: 'mutagen' }} 
            colliders={props.shape === 'sphere' ? "ball" : "hull"}
            gravityScale={0} 
            lockTranslations={[false, false, true]} // Stay in 2D plane
            ccd={true} // Don't tunnel through polymerase
        >
            <mesh>
                {props.shape === 'sphere' ? (
                    <sphereGeometry args={[props.size]} />
                ) : (
                    <capsuleGeometry args={[0.1, 1.5, 4, 8]} />
                )}
                <meshToonMaterial color={props.color} emissive={props.color} emissiveIntensity={2} />
            </mesh>
        </RigidBody>
    )
}

// --- MAIN COMPONENT ---
export default function Mutation() {
  const [radLevel, setRadLevel] = useState(0) 
  const [radType, setRadType] = useState('alpha')
  
  const [template, setTemplate] = useState([])
  const [newStrand, setNewStrand] = useState([])
  const [isGlitching, setIsGlitching] = useState(false)
  
  // Initialize Template
  useEffect(() => {
      const temp = []
      for(let i=0; i<18; i++) temp.push(BASES[Math.floor(Math.random() * 4)])
      setTemplate(temp)
  }, [])

  // Handle Polymerase Steps
  const handleStep = (xPos) => {
      if (xPos === 'reset') {
          setNewStrand([])
          return
      }

      // Map xPos (-8 to 8) to array index
      const index = Math.floor(xPos + 7.5)
      
      // Build strand logic
      if (index >= 0 && index < template.length && newStrand.length <= index) {
          const correct = PAIRS[template[index]]
          let added = correct
          let error = false

          if (isGlitching) {
              const wrong = BASES.filter(b => b !== correct)
              added = wrong[Math.floor(Math.random() * wrong.length)]
              error = true
              setIsGlitching(false) // Consume glitch
          }
          
          setNewStrand(prev => [...prev, { type: added, isError: error }])
      }
  }

  // Controls UI
  const MyControls = (
    <>
      <div className="control-group">
        <h3 style={{marginTop: 0}}>Radiation Source</h3>
        
        <div style={{display: 'flex', gap: '8px', marginBottom: '1rem'}}>
            {['alpha', 'beta', 'gamma'].map(t => (
                <button 
                    key={t}
                    onClick={() => setRadType(t)}
                    style={{
                        flex: 1, padding: '8px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                        background: radType === t ? '#343a40' : '#e9ecef',
                        color: radType === t ? 'white' : '#495057',
                        textTransform: 'capitalize', fontWeight: 'bold'
                    }}
                >
                    {t === 'alpha' ? 'α Alpha' : t === 'beta' ? 'β Beta' : 'γ Gamma'}
                </button>
            ))}
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
            <label style={{display:'block', marginBottom: 6, fontWeight:'bold', color:'#495057', fontSize:'0.9rem'}}>
               Intensity (Particles/Sec)
            </label>
            <input 
                type="range" min="0" max="10" 
                style={{width: '100%'}} 
                value={radLevel} 
                onChange={(e) => setRadLevel(parseInt(e.target.value))} 
            />
        </div>

        <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #dee2e6' }}>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#868e96', lineHeight: 1.5 }}>
               <strong>Effect:</strong> High-energy particles strike the Polymerase, causing it to misread the DNA template and insert the wrong base (Mutation).
            </p>
        </div>
      </div>
    </>
  )

  return (
    <SimulationLayout
      title="DNA Mutation"
      description="Mutagens & Replication"
      topic="TOPIC 6"
      color="#e64980" // <--- NEW COLOR: "Mutagen Pink"
      controls={MyControls}
    >
        <OrthographicCamera makeDefault position={[0, 0, 20]} zoom={26} />
        <ambientLight intensity={1} />
        <directionalLight position={[5, 10, 10]} intensity={1} />
        
        <Physics gravity={[0, 0, 0]}>
            <group position={[-8, 2, 0]}>
                {template.map((base, i) => (
                    <BaseBlock key={`t-${i}`} type={base} position={[i, 0, 0]} isTemplate />
                ))}
            </group>

            <Polymerase onHit={() => setIsGlitching(true)} onStep={handleStep} />

            <group position={[-8, -2, 0]}>
                {newStrand.map((base, i) => (
                    <BaseBlock key={`n-${i}`} type={base.type} position={[i, 0, 0]} isError={base.isError} />
                ))}
            </group>

            {/* Radiation Particles */}
            {Array.from({ length: radLevel }).map((_, i) => (
                <RadiationParticle key={`${radType}-${radLevel}-${i}`} type={radType} />
            ))}

        </Physics>
    </SimulationLayout>
  )
}