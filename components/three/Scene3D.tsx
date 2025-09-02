'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid, Environment, PerspectiveCamera } from '@react-three/drei'
import { Suspense } from 'react'
import { Board3D } from './objects/Board3D'
import { Component3D } from './objects/Component3D'
import { useDesignerStore } from '@/lib/store/designer-store'

export function Scene3D() {
  const { 
    board, 
    components, 
    showGrid, 
    gridSize,
    cameraPosition,
    cameraTarget
  } = useDesignerStore()

  return (
    <div className="w-full h-full">
      <Canvas shadows>
        <PerspectiveCamera
          makeDefault
          position={cameraPosition}
          fov={50}
        />
        
        <OrbitControls 
          target={cameraTarget}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={50}
          maxDistance={500}
        />
        
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[100, 100, 50]}
          intensity={1}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        
        <Suspense fallback={null}>
          {/* Board */}
          <Board3D {...board} />
          
          {/* Components */}
          {components.map((component) => (
            <Component3D
              key={component.id}
              {...component}
            />
          ))}
          
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
            />
          )}
        </Suspense>
        
        <Environment preset="studio" />
      </Canvas>
    </div>
  )
}