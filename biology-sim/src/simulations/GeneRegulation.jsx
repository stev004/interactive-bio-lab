import { Canvas, useFrame } from '@react-three/fiber'
import { OrthographicCamera, Text, RoundedBox, Float } from '@react-three/drei'
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier'
import { useState, useMemo, useRef, useEffect } from 'react'
import * as THREE from 'three'

// --- ACTORS (Same as before) ---
function DNA() {
  return (
    <group position={[0, -2, 0]}>
       <mesh rotation={[0, 0, Math.PI / 2]}>
         <cylinderGeometry args={[0.3, 0.3, 18, 32]} />
         <meshToonMaterial color="#dee2e6" />
       </mesh>
       {Array.from({ length: 20 }).map((_, i) => (
         <mesh key={i} position={[(i - 10) * 0.8 + 0.4, 0, 0]}>
           <boxGeometry args={[0.2, 1.2, 0.2]} />
           <meshToonMaterial color="#adb5bd" />
         </mesh>
       ))}
       <Text position={[-6, -1.5, 0]} fontSize={0.5} color="#868e96">PROMOTER</Text>
       <Text position={[0, -1.5, 0]} fontSize={0.5} color="#e03131">OPERATOR</Text>
       <Text position={[6, -1.5, 0]} fontSize={0.5} color="#51cf66">GENE (LacZ)</Text>
    </group>
  )
}

function Polymerase({ isBlocked, onFinish }) {
  const ref = useRef()
  const speed = 0.08
  useFrame(() => {
    if (!ref.current) return
    if (isBlocked && ref.current.position.x > -2 && ref.current.position.x < -1) {
       ref.current.position.x = -1.5 + (Math.random() - 0.5) * 0.1
    } else {
       ref.current.position.x += speed
    }
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
        <Text position={[0, 1.2, 0]} fontSize={0.4} color="#fd7e14">POLYMERASE</Text>
      </Float>
    </group>
  )
}

function Repressor({ hasLactose }) {
  const ref = useRef()
  useFrame(() => {
    if (!ref.current) return
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

  const lactoseMolecules = useMemo(() => {
    if (lactoseLevel < 10) return []
    return new Array(Math.floor(lactoseLevel / 1.5)).fill(0).map((_, i) => ({
      id: i,
      pos: [(Math.random()-0.5)*14, 3 + (Math.random()*5), 0]
    }))
  }, [lactoseLevel])

  return (
    <>
      <div className="canvas-container">
        <div style={{ position: 'absolute', top: 20, right: 20, textAlign: 'right', pointerEvents: 'none' }}>
            <h3 style={{ margin: 0, color: '#868e96', fontSize: '0.8rem' }}>mRNA PRODUCED</h3>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: isComplete ? '#51cf66' : '#212529' }}>
                {mrnaCount} <span style={{fontSize: '1rem', color: '#adb5bd'}}> / {target}</span>
            </div>
            {isComplete && <div style={{color: '#51cf66', fontWeight: 'bold'}}>TARGET REACHED!</div>}
        </div>

        <Canvas>
          <OrthographicCamera makeDefault position={[0, 0, 20]} zoom={40} />
          <ambientLight intensity={1} />
          <directionalLight position={[5, 10, 10]} intensity={1} />
          <Physics gravity={[0, -1, 0]}>
            <DNA />
            <Polymerase isBlocked={isRepressorActive} onFinish={() => setMrnaCount(c => c + 1)} />
            <Repressor hasLactose={!isRepressorActive} />
            {lactoseMolecules.map(l => <Lactose key={l.id} position={l.pos} />)}
            <RigidBody type="fixed">
                 <CuboidCollider args={[10, 1, 1]} position={[0, 8, 0]} />
                 <CuboidCollider args={[1, 10, 1]} position={[-9, 0, 0]} />
                 <CuboidCollider args={[1, 10, 1]} position={[9, 0, 0]} />
                 <CuboidCollider args={[10, 1, 1]} position={[0, -5, 0]} /> 
            </RigidBody>
          </Physics>
        </Canvas>
      </div>

      <div className="sidebar">
        <div>
           <span style={{ background: '#fff4e6', color: '#e8590c', padding: '4px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 'bold' }}>
            TOPIC 3
          </span>
          <h1 style={{ marginTop: '0.5rem' }}>Gene Regulation</h1>
          <p>The Lac Operon Model</p>
        </div>

        <div className="control-group">
          <h2>Experimental Controls</h2>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label>Lactose Level (Inducer)</label>
            <input type="range" min="0" max="100" value={lactoseLevel} onChange={(e) => setLactoseLevel(parseInt(e.target.value))} />
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

        <div className="control-group">
             <h2>The Science</h2>
             <p>
                <strong>No Lactose:</strong> The Repressor (Red) sits on the Operator, physically blocking the RNA Polymerase. The gene is turned off.
             </p>
             <p>
                <strong>With Lactose:</strong> The sugar binds to the Repressor, changing its shape. It falls off the DNA. The Polymerase is now free to create mRNA.
             </p>
        </div>
      </div>
    </>
  )
}