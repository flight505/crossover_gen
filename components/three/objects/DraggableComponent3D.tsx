'use client'

import { useRef, useState, useEffect } from 'react'
import { Group } from 'three'
import { Box, Cylinder, Torus, Text, TransformControls } from '@react-three/drei'
import { useDesignerStore } from '@/lib/store/designer-store'
import { checkCollision, isWithinBounds } from '@/lib/collision-detection'
import { calculateLeadHolePositions } from '@/lib/component-data-loader'
import type { Component3D } from '@/lib/store/designer-store'

interface DraggableComponent3DProps {
  id: string
  position: [number, number, number]
  rotation: [number, number, number]
  selected: boolean
  part_type: 'capacitor' | 'resistor' | 'inductor'
  body_shape: 'cylinder' | 'coil' | 'rectangular'
  dimensions: {
    diameter?: number
    length?: number
    width?: number
    height?: number
    depth?: number
    outer_diameter?: number
    inner_diameter?: number
  }
  value: number
  value_unit: string
  brand: string
  series: string
}

const COMPONENT_COLORS = {
  capacitor: '#ef4444',  // red
  resistor: '#3b82f6',   // blue
  inductor: '#22c55e',   // green
}

export function DraggableComponent3D(props: DraggableComponent3DProps) {
  const meshRef = useRef<Group>(null)
  const [hovered, setHovered] = useState(false)
  const [hasCollision, setHasCollision] = useState(false)
  const selectComponent = useDesignerStore((state) => state.selectComponent)
  const moveComponent = useDesignerStore((state) => state.moveComponent)
  const snapToGrid = useDesignerStore((state) => state.snapToGrid)
  const gridSize = useDesignerStore((state) => state.gridSize)
  const selectedIds = useDesignerStore((state) => state.selectedIds)
  const components = useDesignerStore((state) => state.components)
  const board = useDesignerStore((state) => state.board)
  
  const {
    id,
    position,
    rotation,
    selected,
    part_type,
    body_shape,
    dimensions,
    value,
    value_unit,
    brand,
    series,
  } = props
  
  // Check for collisions
  useEffect(() => {
    const otherComponents = components.filter(c => c.id !== id)
    const collision = checkCollision(props, otherComponents)
    const withinBounds = isWithinBounds(props, board.width, board.height)
    setHasCollision(collision || !withinBounds)
  }, [position, components, id, props, board])
  
  const isSelected = selectedIds.includes(id)
  
  const color = hasCollision ? '#ff0000' : COMPONENT_COLORS[part_type]
  const emissive = hasCollision ? '#ff0000' : isSelected ? color : hovered ? '#666666' : '#000000'
  const emissiveIntensity = hasCollision ? 0.5 : isSelected ? 0.4 : hovered ? 0.1 : 0
  
  // Snap position to grid if enabled
  const snapPosition = (pos: [number, number, number]): [number, number, number] => {
    if (!snapToGrid) return pos
    
    const snapSize = gridSize || 5
    return [
      Math.round(pos[0] / snapSize) * snapSize,
      pos[1], // Keep Y position (height above board)
      Math.round(pos[2] / snapSize) * snapSize,
    ]
  }
  
  // Handle transform changes
  const handleTransform = () => {
    if (meshRef.current && selected) {
      const newPosition = snapPosition([
        meshRef.current.position.x,
        meshRef.current.position.y,
        meshRef.current.position.z,
      ])
      moveComponent(id, newPosition)
    }
  }
  
  // Render based on body shape
  const renderBody = () => {
    if (body_shape === 'cylinder') {
      const radius = (dimensions.diameter || 10) / 2
      const height = dimensions.length || 20
      
      return (
        <Cylinder
          args={[radius, radius, height, 32]}
          rotation={[0, 0, Math.PI / 2]} // Rotate to horizontal
        >
          <meshStandardMaterial 
            color={color}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
            roughness={0.5}
            metalness={0.2}
          />
        </Cylinder>
      )
    } else if (body_shape === 'coil') {
      const outerRadius = (dimensions.outer_diameter || 30) / 2
      const innerRadius = (dimensions.inner_diameter || 15) / 2
      const tubeRadius = (outerRadius - innerRadius) / 2
      const torusRadius = innerRadius + tubeRadius
      
      return (
        <Torus
          args={[torusRadius, tubeRadius, 16, 32]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <meshStandardMaterial 
            color={color}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
            roughness={0.5}
            metalness={0.2}
          />
        </Torus>
      )
    } else {
      // Rectangular
      const width = dimensions.width || 20
      const height = dimensions.height || 10
      const depth = dimensions.depth || dimensions.length || 15
      
      return (
        <Box args={[width, height, depth]}>
          <meshStandardMaterial 
            color={color}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
            roughness={0.5}
            metalness={0.2}
          />
        </Box>
      )
    }
  }
  
  return (
    <>
      <group
        position={position}
        rotation={rotation}
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation()
          selectComponent(id, e.nativeEvent.shiftKey)
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={(e) => {
          e.stopPropagation()
          setHovered(false)
          document.body.style.cursor = 'default'
        }}
      >
        {renderBody()}
        
        {/* Value label - Always visible with better contrast */}
        <Text
          position={[0, dimensions.height ? dimensions.height/2 + 5 : 15, 0]}
          fontSize={4}
          color="black"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.2}
          outlineColor="white"
        >
          {`${value}${value_unit}`}
        </Text>
        
        {/* Component type label when selected */}
        {isSelected && (
          <Text
            position={[0, dimensions.height ? -dimensions.height/2 - 5 : -10, 0]}
            fontSize={3}
            color="#666666"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.15}
            outlineColor="white"
          >
            {`${brand} ${series}`}
          </Text>
        )}
        
        {/* Collision warning */}
        {hasCollision && (
          <Text
            position={[0, dimensions.height ? dimensions.height/2 + 10 : 20, 0]}
            fontSize={3}
            color="red"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.2}
            outlineColor="white"
          >
            ⚠️ COLLISION
          </Text>
        )}
        
        {/* Lead holes visualization */}
        <LeadHoles {...props} />
      </group>
      
      {/* Transform controls for selected component */}
      {isSelected && meshRef.current && (
        <TransformControls
          object={meshRef.current}
          mode="translate"
          translationSnap={snapToGrid ? gridSize : undefined}
          showY={false} // Only allow XZ movement (on board surface)
          onObjectChange={handleTransform}
          onMouseUp={handleTransform}
        />
      )}
    </>
  )
}

function LeadHoles(props: DraggableComponent3DProps) {
  // Calculate actual lead hole positions based on component data
  const holes = calculateLeadHolePositions(props as Component3D)
  
  return (
    <>
      {holes.map((hole, index) => (
        <mesh key={index} position={[hole.x, -3, hole.z]}>
          <cylinderGeometry args={[hole.diameter / 2, hole.diameter / 2, 6]} />
          <meshStandardMaterial 
            color="#FFD700" 
            emissive="#FFD700" 
            emissiveIntensity={0.3} 
          />
        </mesh>
      ))}
    </>
  )
}