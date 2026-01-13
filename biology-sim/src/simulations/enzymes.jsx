import { Canvas, useFrame } from '@react-three/fiber'
import { OrthographicCamera } from '@react-three/drei'
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier'
import { useState, useRef, useMemo, useEffect } from 'react'
import * as THREE from 'three'

// --- 1. THE ACTORS ---

function Substrate({ position }) {
  const rigidBody = useRef()
  useFrame(() => {
    if (rigidBody.current) {
      rigidBody.current.applyImpulse({ 
        x: (Math.random() - 0.5) * 0.15, 
        y: (Math.random() - 0.5) * 0.15, 
        z: 0 
      }, true)
    }
  })

  return (
    <RigidBody ref={rigidBody} position={position} restitution={1} friction={0} linearDamping={0.5} colliders="ball" lockTranslations={[false,false,true]} enabledTranslations={[true, true, false]}>
      <mesh>
        <circleGeometry args={[0.3, 32]} />
        <meshToonMaterial color="#ff6b6b" />
      </mesh>
    </RigidBody>
  )
}

function Inhibitor({ position }) {
  const rigidBody = useRef()
  
  useFrame(() => {
    if (rigidBody.current) {
      rigidBody.current.applyImpulse({ 
        x: (Math.random() - 0.5) * 0.1, 
        y: (Math.random() - 0.5) * 0.1, 
        z: 0 
      }, true)
    }
  })

  const shape = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(0, 0.4)
    s.lineTo(0.4, -0.4)
    s.lineTo(-0.4, -0.4)
    s.lineTo(0, 0.4)
    return s
  }, [])

  return (
    <RigidBody ref={rigidBody} position={position} restitution={0.8} friction={0} linearDamping={0.5} colliders="hull" lockTranslations={[false,false,true]} enabledTranslations={[true, true, false]}>
      <mesh>
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
    setActive(true)
    onReaction()
    setTimeout(() => setActive(false), 200)
  }

  const enzymeShape = useMemo(() => {
    const shape = new THREE.Shape()
    const angle = 0.8 
    const radius = 1.2
    shape.absarc(0, 0, radius, angle, Math.PI * 2 - angle, false)
    shape.lineTo(0, 0) 
    return shape
  }, [])

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (groupRef.current) groupRef.current.rotation.z = Math.sin(t * 0.5) * 0.1 + (Math.PI / 4)
  })

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

// --- 2. THE CONTAINER ---
function PetriDish() {
  const width = 16
  const height = 10
  const thick = 1
  return (
    <group>
      <mesh position={[0, 0, -1]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color="#f8f9fa" />
      </mesh>
      <lineLoop>
        <bufferGeometry>
           <float32BufferAttribute attach="attributes-position" count={5} array={new Float32Array([-8, -5, 0, 8, -5, 0, 8, 5, 0, -8, 5, 0, -8, -5, 0])} itemSize={3} />
        </bufferGeometry>
        <lineBasicMaterial color="#adb5bd" linewidth={2} />
      </lineLoop>
      <RigidBody type="fixed" friction={0} restitution={1}>
        <CuboidCollider args={[thick, 5, 10]} position={[-9, 0, 0]} />
        <CuboidCollider args={[thick, 5, 10]} position={[9, 0, 0]} />
        <CuboidCollider args={[8, thick, 10]} position={[0, 6, 0]} />
        <CuboidCollider args={[8, thick, 10]} position={[0, -6, 0]} />
        <CuboidCollider args={[16, 10, 1]} position={[0, 0, -2]} />
        <CuboidCollider args={[16, 10, 1]} position={[0, 0, 2]} />
      </RigidBody>
    </group>
  )
}

// --- 3. THE APP & STATE ---
export default function Enzymes() {
  const [stage, setStage] = useState(1) 
  const [substrateCount, setSubstrateCount] = useState(15)
  const [inhibitorCount, setInhibitorCount] = useState(0)
  const [reactions, setReactions] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setReactions(0), 5000)
    return () => clearInterval(interval)
  }, [])

  const handleNextStage = () => {
    setStage(2)
    setInhibitorCount(8) 
  }

  const items = useMemo(() => {
    const subs = new Array(50).fill(0).map((_, i) => ({ id: `sub-${i}`, type: 'sub', pos: [(Math.random()-0.5)*14, (Math.random()-0.5)*8, 0] }))
    const inhibs = new Array(20).fill(0).map((_, i) => ({ id: `inh-${i}`, type: 'inh', pos: [(Math.random()-0.5)*14, (Math.random()-0.5)*8, 0] }))
    return { subs, inhibs }
  }, [])

  return (
    <>
      <div className="canvas-container">
        {/* MOVED TO TOP RIGHT (right: 20) to avoid overlap with Back Button */}
        <div style={{ position: 'absolute', top: 20, right: 20, textAlign: 'right', background: 'rgba(255,255,255,0.9)', padding: '10px 20px', borderRadius: 8, boxShadow: '0 2px 10px rgba(0,0,0,0.1)', pointerEvents: 'none' }}>
          <h3 style={{ margin: 0, fontSize: '0.9rem', color: '#868e96' }}>REACTION RATE</h3>
          <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#212529' }}>
            {Math.round(reactions / 5 * 10) / 10} <span style={{ fontSize: '0.8rem' }}>/sec</span>
          </p>
        </div>

        <Canvas>
          <OrthographicCamera makeDefault position={[0, 0, 20]} zoom={45} />
          <ambientLight intensity={0.9} />
          <directionalLight position={[5, 10, 10]} intensity={0.5} />
          <Physics gravity={[0, 0, 0]}>
            <PetriDish />
            <Enzyme position={[-3, 0, 0]} onReaction={() => setReactions(r => r + 1)} />
            <Enzyme position={[3, 1.5, 0]} onReaction={() => setReactions(r => r + 1)} />
            {items.subs.slice(0, substrateCount).map(s => <Substrate key={s.id} position={s.pos} />)}
            {items.inhibs.slice(0, inhibitorCount).map(s => <Inhibitor key={s.id} position={s.pos} />)}
          </Physics>
        </Canvas>
      </div>

      <div className="sidebar">
        <div>
          <span style={{ background: '#e7f5ff', color: '#1971c2', padding: '4px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 'bold' }}>
            TOPIC 1
          </span>
          <h1 style={{ marginTop: '0.5rem' }}>Enzyme Kinetics</h1>
          <p>Collision Theory & Inhibition</p>
        </div>

        <div className="control-group">
          <h2>Experimental Controls</h2>
          
          <div style={{marginBottom: '1.5rem'}}>
             <label>Substrate (Food)</label>
             <input type="range" min="1" max="50" value={substrateCount} onChange={(e) => setSubstrateCount(parseInt(e.target.value))} />
          </div>

          {stage === 2 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ color: '#e03131' }}>Inhibitor (Blockers)</label>
              <input type="range" min="0" max="20" value={inhibitorCount} onChange={(e) => setInhibitorCount(parseInt(e.target.value))} />
            </div>
          )}

          {stage === 1 && (
            <button 
                onClick={handleNextStage}
                style={{ width: '100%', padding: '10px', background: '#339af0', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            >
                Add Competitive Inhibitors +
            </button>
          )}
        </div>

        <div className="control-group">
            <h2>The Science</h2>
            <p>
               Enzymes depend on random collisions to find substrates. Increasing concentration increases the probability of a hit.
            </p>
            {stage === 2 && (
                <p style={{ marginTop: '10px', borderTop: '1px solid #eee', paddingTop: '10px'}}>
                   <strong>Inhibitors</strong> mimic the shape of the substrate. They bind to the active site and physically block the enzyme from working, slowing down the reaction rate.
                </p>
            )}
        </div>
      </div>
    </>
  )
}