'use client'

import { useState, useEffect } from 'react'
import { Box, Cylinder, Torus } from '@react-three/drei'
import { useDesignerStore } from '@/lib/store/designer-store'
import { generateIGS, validateIGS } from '@/lib/igs-generator'
import { generateJSCADModel } from '@/lib/jscad-generator'
import { getComponentData, calculateLeadHolePositions } from '@/lib/component-data-loader'
import { getMountingHolePositions } from '@/lib/3d-generation-new'

interface Preview3DBoardProps {
  showPreview: boolean
}

// Simplified preview that shows the board with cutout representations
export function Preview3DBoard({ showPreview }: Preview3DBoardProps) {
  const board = useDesignerStore((state) => state.board)
  const components = useDesignerStore((state) => state.components)
  const [, setPreviewGeometry] = useState<object | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  
  useEffect(() => {
    if (!showPreview) {
      setPreviewGeometry(null)
      return
    }
    
    const generatePreview = async () => {
      setIsGenerating(true)
      try {
        // Generate IGS from current state
        const igs = generateIGS(board, components)
        
        // Validate IGS
        const validation = validateIGS(igs)
        if (!validation.valid) {
          console.warn('Preview validation errors:', validation.errors)
        }
        
        // Generate JSCAD model
        const jscadModel = generateJSCADModel(igs)
        
        // Convert JSCAD to Three.js geometry
        // For now, we'll use a simplified representation
        // In production, we'd convert the JSCAD CSG to Three.js BufferGeometry
        setPreviewGeometry(jscadModel)
      } catch (error) {
        console.error('Error generating preview:', error)
      } finally {
        setIsGenerating(false)
      }
    }
    
    // Debounce preview generation
    const timer = setTimeout(generatePreview, 500)
    return () => clearTimeout(timer)
  }, [showPreview, board, components])
  
  if (!showPreview) return null
  
  if (isGenerating) {
    return (
      <group>
        <Box args={[board.width, board.thickness, board.height]} position={[0, -board.thickness/2, 0]}>
          <meshStandardMaterial color="#8B7355" roughness={0.8} metalness={0.1} opacity={0.5} transparent />
        </Box>
      </group>
    )
  }
  
  // Render simplified preview based on IGS data
  // This shows the actual recesses and holes that will be in the STL
  return (
    <group>
      {/* Main board */}
      <Box 
        args={[board.width, board.thickness, board.height]}
        position={[0, -board.thickness/2, 0]}
      >
        <meshStandardMaterial 
          color="#8B7355"
          roughness={0.8}
          metalness={0.1}
        />
      </Box>
      
      {/* Component recesses based on actual IGS data */}
      {components.map((comp) => {
        const componentData = getComponentData(comp.brand, comp.series, comp.value, comp.value_unit)
        if (!componentData) return null
        
        const [x, , z] = comp.position
        const leadHoles = calculateLeadHolePositions(comp)
        const recessDepth = Math.min(
          (componentData.body_height_mm || 5) * 0.7,
          board.thickness - 0.5,
          3
        )
        const recessY = -recessDepth / 2
        
        return (
          <group key={comp.id}>
            {/* Component recess */}
            {componentData.body_shape === 'cylinder' ? (
              <Cylinder
                args={[
                  (componentData.body_diameter_mm || 10) / 2 + 0.5,
                  (componentData.body_diameter_mm || 10) / 2 + 0.5,
                  recessDepth,
                  32
                ]}
                position={[x, recessY, z]}
                rotation={[0, 0, 0]}
              >
                <meshStandardMaterial 
                  color="#5A4A3A"
                  roughness={0.9}
                  opacity={0.8}
                  transparent
                />
              </Cylinder>
            ) : componentData.body_shape === 'coil' ? (
              <Torus
                args={[
                  (componentData.outer_diameter_mm || 30) / 2,
                  ((componentData.outer_diameter_mm || 30) - (componentData.inner_diameter_mm || 15)) / 4,
                  16,
                  32
                ]}
                position={[x, recessY, z]}
                rotation={[Math.PI / 2, 0, comp.rotation[1] * Math.PI / 180]}
              >
                <meshStandardMaterial 
                  color="#5A4A3A"
                  roughness={0.9}
                  opacity={0.8}
                  transparent
                />
              </Torus>
            ) : (
              <Box
                args={[
                  (componentData.body_width_mm || componentData.body_length_mm || 20) + 1,
                  recessDepth,
                  (componentData.body_height_mm || componentData.body_diameter_mm || 15) + 1
                ]}
                position={[x, recessY, z]}
                rotation={[0, comp.rotation[1] * Math.PI / 180, 0]}
              >
                <meshStandardMaterial 
                  color="#5A4A3A"
                  roughness={0.9}
                  opacity={0.8}
                  transparent
                />
              </Box>
            )}
            
            {/* Lead holes based on actual calculated positions */}
            {leadHoles.map((hole, index) => (
              <Cylinder
                key={`hole-${index}`}
                args={[hole.diameter / 2, hole.diameter / 2, board.thickness + 2, 16]}
                position={[hole.x, -board.thickness/2, hole.z]}
                rotation={[0, 0, 0]}
              >
                <meshBasicMaterial color="#000000" />
              </Cylinder>
            ))}
          </group>
        )
      })}
      
      {/* Mounting holes if enabled */}
      {board.mountingHoles?.enabled && (
        <>
          {getMountingHolePositions({
            ...board,
            mountingHoles: {
              ...board.mountingHoles,
              positions: board.mountingHoles?.positions || 'corners'
            }
          }).map((pos, i) => (
            <Cylinder
              key={`mounting-${i}`}
              args={[
                board.mountingHoles!.diameter / 2,
                board.mountingHoles!.diameter / 2,
                board.thickness + 2,
                16
              ]}
              position={[pos.x, -board.thickness/2, pos.z]}
              rotation={[0, 0, 0]}
            >
              <meshBasicMaterial color="#000000" />
            </Cylinder>
          ))}
        </>
      )}
      
      {/* Zip tie slots - not yet implemented in BoardSettings */}
    </group>
  )
}

