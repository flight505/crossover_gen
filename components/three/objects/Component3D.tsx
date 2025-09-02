'use client'

import { useRef, useState } from 'react'
import { Group } from 'three'
import { Box, Cylinder, Torus, Text } from '@react-three/drei'
import { useDesignerStore } from '@/lib/store/designer-store'

interface Component3DProps {
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

export function Component3D(props: Component3DProps) {
  const meshRef = useRef<Group>(null)
  const [hovered, setHovered] = useState(false)
  const { selectComponent } = useDesignerStore()
  
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
  } = props
  
  const color = COMPONENT_COLORS[part_type]
  const emissive = selected ? color : hovered ? '#666666' : '#000000'
  const emissiveIntensity = selected ? 0.3 : hovered ? 0.1 : 0
  
  // Render based on body shape
  const renderBody = () => {
    if (body_shape === 'cylinder') {
      const radius = (dimensions.diameter || 10) / 2
      const height = dimensions.length || dimensions.height || 20
      
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
      
      {/* Value label */}
      {(selected || hovered) && (
        <Text
          position={[0, 15, 0]}
          fontSize={4}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {`${value}${value_unit}`}
        </Text>
      )}
      
      {/* Lead holes visualization */}
      <LeadHoles {...props} />
    </group>
  )
}

function LeadHoles(props: Component3DProps) {
  const { body_shape, dimensions } = props
  
  if (body_shape === 'cylinder') {
    // Axial leads at ends
    const length = dimensions.length || 20
    return (
      <>
        <mesh position={[-length/2 - 2, -3, 0]}>
          <cylinderGeometry args={[0.5, 0.5, 6]} />
          <meshStandardMaterial color="#FFD700" />
        </mesh>
        <mesh position={[length/2 + 2, -3, 0]}>
          <cylinderGeometry args={[0.5, 0.5, 6]} />
          <meshStandardMaterial color="#FFD700" />
        </mesh>
      </>
    )
  } else if (body_shape === 'coil') {
    // Leads at inner edge
    const innerRadius = (dimensions.inner_diameter || 15) / 2
    return (
      <>
        <mesh position={[innerRadius * 0.9, -3, -innerRadius * 0.3]}>
          <cylinderGeometry args={[0.5, 0.5, 6]} />
          <meshStandardMaterial color="#FFD700" />
        </mesh>
        <mesh position={[innerRadius * 0.9, -3, innerRadius * 0.3]}>
          <cylinderGeometry args={[0.5, 0.5, 6]} />
          <meshStandardMaterial color="#FFD700" />
        </mesh>
      </>
    )
  }
  
  return null
}