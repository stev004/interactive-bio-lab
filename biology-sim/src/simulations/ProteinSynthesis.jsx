import { useFrame } from '@react-three/fiber'
import { OrthographicCamera, Text, RoundedBox } from '@react-three/drei'
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier'
import { useState, useMemo, useRef, useEffect } from 'react'
import * as THREE from 'three'
import SimulationLayout from '../components/SimulationLayout'

// --- SHARED ACTORS ---

function MRNAStrand({ position }) {
    return (
        <RigidBody position={position} colliders="hull" restitution={0.2}>
             <mesh rotation={[0, 0, Math.PI / 2]}>
                <capsuleGeometry args={[0.15, 2.5, 4, 8]} />
                <meshToonMaterial color="#ff6b6b" />
            </mesh>
        </RigidBody>
    )
}

// --- STAGE 1 ACTORS (Nucleus) ---

function DNAHelix() {
  return (
    <group position={[0, 2, 0]}>
       <mesh rotation={[0, 0, Math.PI / 2]}>
         <cylinderGeometry args={[0.3, 0.3, 16, 16]} />
         <meshToonMaterial color="#e9ecef" />
       </mesh>
       {Array.from({ length: 20 }).map((_, i) => (
          <mesh key={i} position={[(i - 10) * 0.7, 0, 0]} rotation={[i * 0.5, 0, 0]}>
             <boxGeometry args={[0.2, 2.5, 0.2]} />
             <meshToonMaterial color={i % 2 === 0 ? "#339af0" : "#fab005"} />
          </mesh>
       ))}
       <Text position={[-6, 2.5, 0]} fontSize={0.6} color="#adb5bd">DNA TEMPLATE</Text>
    </group>
  )
}

function Polymerase({ speed, onComplete }) {
    const ref = useRef()
    const progress = useRef(-8)

    useFrame((state, delta) => {
        if (!ref.current) return
        
        // Speed controlled by slider (0 to 5)
        const currentSpeed = speed * 2 
        
        if (currentSpeed > 0) {
            progress.current += delta * currentSpeed
            ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 10) * 0.1
        }
        
        if (progress.current > 8) {
            progress.current = -8
            onComplete() 
        }

        ref.current.setTranslation({ x: progress.current, y: 2, z: 0.5 }, true)
    })

    return (
        <RigidBody ref={ref} type="kinematicPosition" colliders={false}>
            <RoundedBox args={[2.5, 2, 2]} radius={0.5} smoothness={4}>
                <meshToonMaterial color="#ff922b" transparent opacity={0.9} />
            </RoundedBox>
            <Text position={[0, 0, 1.1]} fontSize={0.35} color="white">POLYMERASE</Text>
        </RigidBody>
    )
}

// --- STAGE 2 ACTORS (Cytoplasm) ---

function TranslationSource({ rate, onSpawn }) {
    // This invisible helper rains down mRNA based on the slider
    const time = useRef(0)
    useFrame((state, delta) => {
        time.current += delta
        // Higher rate = lower interval
        const interval = 2 / (rate || 0.1) 
        if (time.current > interval) {
            onSpawn()
            time.current = 0
        }
    })
    return null
}

function RibosomeMachine({ onBuild }) {
    return (
        <group position={[0, 2, 0]}>
            <RigidBody type="fixed" colliders="hull">
                {/* Large Subunit */}
                <mesh position={[0, 1, 0]}>
                    <sphereGeometry args={[2, 32, 16, 0, Math.PI * 2, 0, Math.PI/2]} />
                    <meshToonMaterial color="#51cf66" />
                </mesh>
                {/* Small Subunit */}
                <mesh position={[0, -0.5, 0]} rotation={[Math.PI, 0, 0]}>
                     <sphereGeometry args={[1.5, 32, 16, 0, Math.PI * 2, 0, Math.PI/2]} />
                     <meshToonMaterial color="#40c057" />
                </mesh>
                
                {/* SENSOR: Catches falling mRNA */}
                <CuboidCollider 
                    args={[3, 1, 1]} 
                    position={[0, 2, 0]} 
                    sensor 
                    onIntersectionEnter={({ other }) => {
                        // Trigger protein creation
                        onBuild()
                    }}
                />
            </RigidBody>
            <Text position={[0, -2.5, 0]} fontSize={0.6} color="#868e96">RIBOSOME</Text>
        </group>
    )
}

function ProteinBlob({ position }) {
    return (
        <RigidBody position={position} colliders="ball" restitution={0.2}>
             <mesh>
                <icosahedronGeometry args={[0.6, 0]} />
                <meshToonMaterial color="#be4bdb" />
            </mesh>
        </RigidBody>
    )
}

// --- MAIN COMPONENT ---
export default function ProteinSynthesis() {
  const [stage, setStage] = useState('transcription') 
  const [sliderValue, setSliderValue] = useState(2) // Shared slider state
  
  // Lists for objects
  const [items, setItems] = useState([]) 
  const [products, setProducts] = useState([]) // Proteins

  // Clear scene on tab switch
  useEffect(() => {
      setItems([])
      setProducts([])
  }, [stage])

  // --- ACTIONS ---

  // Stage 1: Add falling mRNA
  const spawnMRNA = () => {
      setItems(prev => [...prev.slice(-10), { id: Math.random(), pos: [(Math.random()-0.5)*2, 0, 0] }])
  }

  // Stage 2: Add falling mRNA from top
  const dropIncomingMRNA = () => {
      // Random X position to make it fun to catch
      setItems(prev => [...prev.slice(-15), { id: Math.random(), pos: [(Math.random()-0.5)*6, 12, 0] }])
  }

  // Stage 2: Ribosome catches mRNA -> Makes Protein
  const spawnProtein = () => {
      setProducts(prev => [...prev.slice(-20), { id: Math.random(), pos: [(Math.random()-0.5), 0, 0] }])
  }

  // --- CONTROLS UI ---
  const MyControls = (
    <>
      <div className="control-group">
        {/* TAB SWITCHER */}
        <div style={{ display: 'flex', background: '#e9ecef', padding: '4px', borderRadius: '8px', marginBottom: '1.5rem' }}>
            <button 
                onClick={() => setStage('transcription')}
                style={{ 
                    flex: 1, padding: '10px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem',
                    background: stage === 'transcription' ? 'white' : 'transparent',
                    color: stage === 'transcription' ? '#e67700' : '#868e96',
                    boxShadow: stage === 'transcription' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                }}
            >
                1. Transcription
            </button>
            <button 
                onClick={() => setStage('translation')}
                style={{ 
                    flex: 1, padding: '10px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem',
                    background: stage === 'translation' ? 'white' : 'transparent',
                    color: stage === 'translation' ? '#2b8a3e' : '#868e96',
                    boxShadow: stage === 'translation' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                }}
            >
                2. Translation
            </button>
        </div>

        {/* SHARED SLIDER (Changes meaning based on Tab) */}
        <div style={{ marginBottom: '1.5rem' }}>
             <label style={{display:'block', marginBottom: 6, fontWeight:'bold', color:'#495057', fontSize:'0.9rem'}}>
                {stage === 'transcription' ? 'Polymerase Speed' : 'mRNA Concentration'}
             </label>
             <input 
                type="range" min="0.5" max="5" step="0.5" 
                style={{width: '100%'}} 
                value={sliderValue} 
                onChange={(e) => setSliderValue(parseFloat(e.target.value))} 
             />
        </div>

        {/* INFO BOX */}
        {stage === 'transcription' ? (
            <div style={{animation: 'fadeIn 0.5s'}}>
                <p style={{color: '#495057', lineHeight: 1.5, fontSize: '0.9rem'}}>
                    Inside the <strong>Nucleus</strong>. Increase speed to make the Polymerase read DNA faster and produce more mRNA (Red).
                </p>
            </div>
        ) : (
            <div style={{animation: 'fadeIn 0.5s'}}>
                <p style={{color: '#495057', lineHeight: 1.5, fontSize: '0.9rem'}}>
                    Inside the <strong>Cytoplasm</strong>. Increase concentration to rain down more mRNA. The Ribosome (Green) catches them to build Proteins (Purple).
                </p>
                <div style={{marginTop: '10px', fontWeight: 'bold', color: '#868e96'}}>
                    Proteins Built: {products.length}
                </div>
            </div>
        )}
      </div>
    </>
  )

  return (
    <SimulationLayout
      title="Protein Synthesis"
      description="The Central Dogma"
      topic="TOPIC 5"
      color={stage === 'transcription' ? "#ff922b" : "#51cf66"}
      controls={MyControls}
    >
        <OrthographicCamera makeDefault position={[0, 0, 20]} zoom={28} />
        <ambientLight intensity={1} />
        <directionalLight position={[5, 10, 10]} intensity={1} />
        
        <Physics gravity={[0, -6, 0]}>
            
            {/* --- SCENE 1: TRANSCRIPTION --- */}
            {stage === 'transcription' && (
                <>
                    <DNAHelix />
                    <Polymerase speed={sliderValue} onComplete={spawnMRNA} />
                    
                    {/* Falling mRNA generated by Polymerase */}
                    {items.map(i => (
                        <MRNAStrand key={i.id} position={i.pos} />
                    ))}
                    
                    <RigidBody type="fixed" position={[0, -6, 0]}><CuboidCollider args={[10, 1, 1]} /></RigidBody>
                </>
            )}

            {/* --- SCENE 2: TRANSLATION --- */}
            {stage === 'translation' && (
                <>
                   {/* Invisible helper that rains down mRNA based on slider */}
                   <TranslationSource rate={sliderValue} onSpawn={dropIncomingMRNA} />
                   
                   <RibosomeMachine onBuild={spawnProtein} />
                   
                   {/* Incoming mRNA falling from top */}
                   {items.map(i => (
                        <MRNAStrand key={i.id} position={i.pos} />
                   ))}

                   {/* Generated Proteins */}
                   {products.map(p => <ProteinBlob key={p.id} position={p.pos} />)}
                   
                   {/* Container Walls */}
                   <RigidBody type="fixed">
                        <CuboidCollider args={[10, 1, 1]} position={[0, -6, 0]} />
                        <CuboidCollider args={[1, 10, 1]} position={[-8, 0, 0]} />
                        <CuboidCollider args={[1, 10, 1]} position={[8, 0, 0]} />
                   </RigidBody>
                </>
            )}

        </Physics>
    </SimulationLayout>
  )
}