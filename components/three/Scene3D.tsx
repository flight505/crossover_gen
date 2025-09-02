'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid, Environment, PerspectiveCamera } from '@react-three/drei'
import { Suspense, useState, useRef } from 'react'
import { Board3D } from './objects/Board3D'
import { DraggableComponent3D } from './objects/DraggableComponent3D'
import { Preview3DBoard } from './Preview3DBoard'
import { useDesignerStore } from '@/lib/store/designer-store'
import type { OrbitControls as OrbitControlsType } from 'three-stdlib'

export function Scene3D() {
  const { 
    board, 
    components, 
    showGrid, 
    gridSize,
    cameraPosition,
    cameraTarget,
    deselectAll
  } = useDesignerStore()
  
  const [showPreview, setShowPreview] = useState(false)
  const controlsRef = useRef<OrbitControlsType>(null)

  return (
    <div className="w-full h-full relative">
      {/* Preview Toggle Button */}
      <button
        onClick={() => setShowPreview(!showPreview)}
        className={`absolute top-4 right-4 z-10 px-4 py-2 rounded-lg font-medium transition-colors ${
          showPreview 
            ? 'bg-blue-600 text-white hover:bg-blue-700' 
            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
        }`}
      >
        {showPreview ? '🎨 Design View' : '👁️ Preview Board'}
      </button>
      
      <Canvas 
        shadows
        onPointerMissed={() => {
          // Deselect all when clicking empty space
          deselectAll()
        }}
      >
        <PerspectiveCamera
          makeDefault
          position={cameraPosition}
          fov={50}
        />
        
        <OrbitControls 
          ref={controlsRef}
          target={cameraTarget}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={50}
          maxDistance={500}
          mouseButtons={{
            LEFT: undefined,  // Disable left-click rotation
            MIDDLE: 1,       // Middle mouse for pan
            RIGHT: 0         // Right-click for rotate
          }}
        />
        
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[100, 100, 50]}
          intensity={1}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        
        <Suspense fallback={null}>
          {/* Show either preview or design view */}
          {showPreview ? (
            <Preview3DBoard showPreview={showPreview} />
          ) : (
            <>
              {/* Board */}
              <Board3D {...board} />
              
              {/* Components */}
              {components.map((component) => (
                <DraggableComponent3D
                  key={component.id}
                  {...component}
                />
              ))}
            </>
          )}
          
          {/* Grid */}
          {showGrid && (
            <Grid
              args={[Math.max(board.width, board.height) * 2, Math.max(board.width, board.height) * 2]}
              cellSize={gridSize}
              cellThickness={0.5}
              cellColor="#6b7280"
              sectionSize={gridSize * 5}
              sectionThickness={1}
              sectionColor="#374151"
              fadeDistance={500}
              fadeStrength={1}
              infiniteGrid={false}
              position={[0, -0.01, 0]} // Slight offset to prevent Z-fighting
            />
          )}
        </Suspense>
        
        <Environment preset="studio" />
      </Canvas>
    </div>
  )
}