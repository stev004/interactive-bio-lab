// src/components/SimulationLayout.jsx
import { Canvas } from '@react-three/fiber'
import './SimulationLayout.css'

export default function SimulationLayout({ 
  title, 
  description, 
  topic, 
  color, 
  children, // This is where the 3D Scene goes
  controls  // This is where the Sliders/Buttons go
}) {
  return (
    <div className="layout-container">
      
      {/* SLOT 1: THE 3D WORLD */}
      <div className="canvas-section">
        {/* We move the Canvas HERE so you don't have to write it every time */}
        <Canvas>
          {children}
        </Canvas>
      </div>

      {/* SLOT 2: THE UI DASHBOARD */}
      <div className="ui-section">
        <div className="header">
          <span className="topic-tag" style={{ color: color, background: `${color}20` }}>
            {topic}
          </span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>

        <div className="controls-scroll-area">
          {controls}
        </div>
      </div>

    </div>
  )
}