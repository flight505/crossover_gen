'use client'

import { useRef } from 'react'
import { Mesh } from 'three'
import { RoundedBox } from '@react-three/drei'

interface Board3DProps {
  width: number
  height: number
  thickness: number
  cornerRadius: number
  mountingHoles?: {
    enabled: boolean
    diameter: number
    positions: 'corners' | 'custom'
  }
}

export function Board3D({ 
  width, 
  height, 
  thickness, 
  cornerRadius,
  mountingHoles 
}: Board3DProps) {
  const meshRef = useRef<Mesh>(null)
  
  // Board is centered at origin
  return (
    <group>
      {/* Main board */}
      <RoundedBox
        ref={meshRef}
        args={[width, thickness, height]}
        radius={cornerRadius}
        smoothness={4}
        position={[0, -thickness/2, 0]}
        receiveShadow
        castShadow
      >
        <meshStandardMaterial 
          color="#8B7355"
          roughness={0.8}
          metalness={0.1}
        />
      </RoundedBox>
      
      {/* Mounting holes (visual only for now) */}
      {mountingHoles?.enabled && mountingHoles.positions === 'corners' && (
        <>
          {[
            [-width/2 + 5, 0, -height/2 + 5],
            [width/2 - 5, 0, -height/2 + 5],
            [-width/2 + 5, 0, height/2 - 5],
            [width/2 - 5, 0, height/2 - 5],
          ].map((pos, i) => (
            <mesh key={i} position={pos as [number, number, number]}>
              <cylinderGeometry args={[mountingHoles.diameter/2, mountingHoles.diameter/2, thickness * 1.1]} />
              <meshStandardMaterial color="#000000" opacity={0.8} transparent />
            </mesh>
          ))}
        </>
      )}
    </group>
  )
}