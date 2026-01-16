import { useFrame } from '@react-three/fiber'
import { OrthographicCamera, Text } from '@react-three/drei'
import { Physics, RigidBody, CuboidCollider, CylinderCollider } from '@react-three/rapier'
import { useState, useMemo, useRef, useEffect } from 'react'
import SimulationLayout from '../components/SimulationLayout'

// --- ACTORS ---

function Proton({ position }) {
  const rigidBody = useRef()
  useFrame(() => {
    if (rigidBody.current && rigidBody.current.translation().y < -10) {
        rigidBody.current.setTranslation({ x: 0, y: 15, z: 0 }, true)
        rigidBody.current.setLinvel({ x: (Math.random()-0.5)*2, y: -2, z: 0 }, true)
    }
  })
  
  return (
    <RigidBody 
        ref={rigidBody} 
        position={position} 
        colliders="ball" 
        restitution={0.5} 
        friction={0.1}
        linearDamping={2} 
        lockTranslations={[false, false, true]}
        enabledTranslations={[true, true, false]}
    >
      <mesh>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshToonMaterial color="#ffec99" />
      </mesh>
    </RigidBody>
  )
}

function Rotor({ onSpeedChange }) {
  const rigidBody = useRef()
  
  useFrame(() => {
      if (rigidBody.current) {
          const vel = rigidBody.current.angvel()
          const rpm = Math.abs(vel.z) * 9.55 
          onSpeedChange(rpm)
      }
  })

  const blades = Array.from({ length: 6 }).map((_, i) => {
      const angle = (i / 6) * Math.PI * 2
      return (
          <group key={i} rotation={[0, 0, angle]}>
              <mesh position={[1.4, 0, 0]}>
                  <boxGeometry args={[1.6, 0.3, 0.5]} />
                  <meshToonMaterial color="#ff922b" />
              </mesh>
              <CuboidCollider args={[0.8, 0.15, 0.25]} position={[1.4, 0, 0]} />
          </group>
      )
  })

  return (
    <RigidBody 
        ref={rigidBody} 
        position={[0, 0, 0]} 
        colliders={false} 
        lockTranslations 
        lockRotations={[true, true, false]} 
        linearDamping={0.5} 
        angularDamping={0.02} 
    >
        <mesh>
            <cylinderGeometry args={[0.8, 0.8, 1]} />
            <meshToonMaterial color="#e8590c" />
        </mesh>
        <CylinderCollider args={[0.5, 0.8]} rotation={[Math.PI/2, 0, 0]} />
        {blades}
    </RigidBody>
  )
}

function Stator() {
  return (
    <RigidBody type="fixed">
        <CuboidCollider args={[0.5, 3, 1]} position={[-3.2, 4, 0]} rotation={[0,0, -0.2]} />
        <mesh position={[-3.2, 4, 0]} rotation={[0,0, -0.2]}>
            <boxGeometry args={[1, 6, 1]} />
            <meshToonMaterial color="#868e96" transparent opacity={0.5} />
        </mesh>

        <CuboidCollider args={[0.5, 3, 1]} position={[3.2, 4, 0]} rotation={[0,0, 0.2]} />
        <mesh position={[3.2, 4, 0]} rotation={[0,0, 0.2]}>
            <boxGeometry args={[1, 6, 1]} />
            <meshToonMaterial color="#868e96" transparent opacity={0.5} />
        </mesh>
    </RigidBody>
  )
}

// --- MAIN COMPONENT ---
export default function ATPSynthase() {
  const [protonCount, setProtonCount] = useState(15)
  const [rpm, setRpm] = useState(0)
  const [atpProduced, setAtpProduced] = useState(0)
  
  // LOGIC FIX: Threshold lowered from 20 -> 5 RPM
  useEffect(() => {
      if (rpm > 5) {
         // Production rate increases with speed
         const interval = setInterval(() => setAtpProduced(c => c + 1), 5000 / rpm)
         return () => clearInterval(interval)
      }
  }, [rpm])

  const protons = useMemo(() => {
      return new Array(60).fill(0).map((_, i) => ({
          id: i,
          pos: [(Math.random()-0.5)*4, 6 + (i * 1.5), 0]
      }))
  }, [])

  const MyControls = (
    <>
      <div className="control-group">
        <div style={{display: 'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem'}}>
             <h3 style={{margin: 0}}>Turbine Status</h3>
             {/* THRESHOLD FIX: Green if > 5 (was > 50) */}
             <div style={{ background: rpm > 5 ? '#d3f9d8' : '#fff5f5', padding: '4px 12px', borderRadius: '20px', color: rpm > 5 ? '#2b8a3e' : '#e03131', fontWeight: 'bold', fontSize: '0.9rem' }}>
                {Math.round(rpm)} RPM
             </div>
        </div>

        <div style={{marginBottom: '1rem'}}>
             <label style={{display:'block', marginBottom: 6, fontWeight:'bold', color:'#495057', fontSize:'0.9rem'}}>Proton Gradient (H+)</label>
             <input type="range" min="0" max="60" style={{width: '100%'}} value={protonCount} onChange={(e) => setProtonCount(parseInt(e.target.value))} />
        </div>

        <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', textAlign: 'center', border: '1px solid #dee2e6' }}>
            <span style={{ display: 'block', fontSize: '0.8rem', color: '#868e96', fontWeight: 'bold', marginBottom: '5px' }}>ENERGY GENERATED</span>
            <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#e8590c' }}>{atpProduced}</span>
            <span style={{ fontSize: '1rem', color: '#868e96' }}> ATP</span>
        </div>
      </div>

      <div className="control-group" style={{marginTop: '1.5rem'}}>
             <h3 style={{marginTop: 0, fontSize: '1.1rem'}}>The Science</h3>
             <p style={{lineHeight: 1.5, color: '#495057', fontSize: '0.9rem'}}>
                This is a literal motor. H+ ions flow down their gradient, physically pushing the rotor. This rotation forces ADP + P together to make ATP.
             </p>
      </div>
    </>
  )

  return (
    <SimulationLayout
      title="ATP Synthase"
      description="The Molecular Motor"
      topic="TOPIC 4"
      color="#e8590c"
      controls={MyControls}
    >
        {/* ZOOM FIX: Changed from 30 -> 22 to zoom out */}
        <OrthographicCamera makeDefault position={[0, 0, 20]} zoom={22} />
        
        <ambientLight intensity={1} />
        <directionalLight position={[5, 10, 10]} intensity={1} />
        
        <Physics gravity={[0, -2, 0]}>
            {/* TEXT FIX: Moved Intermembrane Space down from 7.5 to 6.5 */}
            <Text position={[0, 6.5, -5]} fontSize={0.7} color="#adb5bd" anchorX="center">INTERMEMBRANE SPACE (High H+)</Text>
            <Text position={[0, -5, -5]} fontSize={0.7} color="#adb5bd" anchorX="center">MATRIX (Low H+)</Text>

            <mesh position={[0, -2, -1]}>
                <planeGeometry args={[20, 4]} />
                <meshBasicMaterial color="#ffe8cc" transparent opacity={0.5} />
            </mesh>

            <Stator />
            <Rotor onSpeedChange={setRpm} />
            
            {protons.slice(0, protonCount).map(p => <Proton key={p.id} position={p.pos} />)}
            
            <RigidBody type="fixed">
               <CuboidCollider args={[10, 1, 1]} position={[0, -8, 0]} />
               <CuboidCollider args={[1, 10, 1]} position={[-10, 0, 0]} />
               <CuboidCollider args={[1, 10, 1]} position={[10, 0, 0]} />
               <CuboidCollider args={[16, 10, 1]} position={[0, 0, -2]} />
               <CuboidCollider args={[16, 10, 1]} position={[0, 0, 2]} />
            </RigidBody>
        </Physics>
    </SimulationLayout>
  )
}