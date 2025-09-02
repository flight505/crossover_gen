'use client'

import { Box, Cylinder, Torus } from '@react-three/drei'
import { useDesignerStore } from '@/lib/store/designer-store'

interface Preview3DBoardProps {
  showPreview: boolean
}

// Simplified preview that shows the board with cutout representations
export function Preview3DBoard({ showPreview }: Preview3DBoardProps) {
  const board = useDesignerStore((state) => state.board)
  const components = useDesignerStore((state) => state.components)
  
  if (!showPreview) return null
  
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
      
      {/* Component recesses (visual representation) */}
      {components.map((comp) => {
        const [x, , z] = comp.position
        const recessY = -1.5 // Recess depth visual
        
        if (comp.body_shape === 'cylinder') {
          const radius = (comp.dimensions.diameter || 10) / 2
          const length = comp.dimensions.length || 20
          
          return (
            <group key={comp.id}>
              {/* Recess */}
              <Box
                args={[length + 2, 2, radius * 2 + 2]}
                position={[x, recessY, z]}
                rotation={[0, comp.rotation[1] * Math.PI / 180, 0]}
              >
                <meshStandardMaterial 
                  color="#5A4A3A"
                  roughness={0.9}
                />
              </Box>
              
              {/* Lead holes */}
              <Cylinder
                args={[0.8, 0.8, board.thickness + 2, 16]}
                position={[x - length/2, -board.thickness/2, z]}
                rotation={[0, 0, 0]}
              >
                <meshBasicMaterial color="#000000" />
              </Cylinder>
              <Cylinder
                args={[0.8, 0.8, board.thickness + 2, 16]}
                position={[x + length/2, -board.thickness/2, z]}
                rotation={[0, 0, 0]}
              >
                <meshBasicMaterial color="#000000" />
              </Cylinder>
            </group>
          )
        } else if (comp.body_shape === 'coil') {
          const outerRadius = (comp.dimensions.outer_diameter || 30) / 2
          const innerRadius = (comp.dimensions.inner_diameter || 15) / 2
          
          return (
            <group key={comp.id}>
              {/* Ring recess */}
              <Torus
                args={[(outerRadius + innerRadius) / 2, (outerRadius - innerRadius) / 2, 8, 16]}
                position={[x, recessY, z]}
                rotation={[Math.PI / 2, 0, comp.rotation[1] * Math.PI / 180]}
              >
                <meshStandardMaterial 
                  color="#5A4A3A"
                  roughness={0.9}
                />
              </Torus>
              
              {/* Lead holes */}
              <Cylinder
                args={[0.8, 0.8, board.thickness + 2, 16]}
                position={[x + innerRadius * 0.9, -board.thickness/2, z]}
                rotation={[0, 0, 0]}
              >
                <meshBasicMaterial color="#000000" />
              </Cylinder>
              <Cylinder
                args={[0.8, 0.8, board.thickness + 2, 16]}
                position={[x - innerRadius * 0.9, -board.thickness/2, z]}
                rotation={[0, 0, 0]}
              >
                <meshBasicMaterial color="#000000" />
              </Cylinder>
            </group>
          )
        } else {
          // Rectangular
          const width = comp.dimensions.width || 20
          const depth = comp.dimensions.depth || comp.dimensions.length || 15
          
          return (
            <group key={comp.id}>
              {/* Recess */}
              <Box
                args={[width + 2, 2, depth + 2]}
                position={[x, recessY, z]}
                rotation={[0, comp.rotation[1] * Math.PI / 180, 0]}
              >
                <meshStandardMaterial 
                  color="#5A4A3A"
                  roughness={0.9}
                />
              </Box>
              
              {/* Lead holes (if radial) */}
              {comp.lead_spacing_mm && (
                <>
                  <Cylinder
                    args={[0.8, 0.8, board.thickness + 2, 16]}
                    position={[x - comp.lead_spacing_mm/2, -board.thickness/2, z]}
                    rotation={[0, 0, 0]}
                  >
                    <meshBasicMaterial color="#000000" />
                  </Cylinder>
                  <Cylinder
                    args={[0.8, 0.8, board.thickness + 2, 16]}
                    position={[x + comp.lead_spacing_mm/2, -board.thickness/2, z]}
                    rotation={[0, 0, 0]}
                  >
                    <meshBasicMaterial color="#000000" />
                  </Cylinder>
                </>
              )}
            </group>
          )
        }
      })}
      
      {/* Mounting holes if enabled */}
      {board.mountingHoles?.enabled && board.mountingHoles.positions === 'corners' && (
        <>
          {[
            [-board.width/2 + 5, 0, -board.height/2 + 5],
            [board.width/2 - 5, 0, -board.height/2 + 5],
            [-board.width/2 + 5, 0, board.height/2 - 5],
            [board.width/2 - 5, 0, board.height/2 - 5],
          ].map((pos, i) => (
            <Cylinder
              key={`hole-${i}`}
              args={[board.mountingHoles!.diameter/2, board.mountingHoles!.diameter/2, board.thickness + 2, 16]}
              position={[pos[0], -board.thickness/2, pos[2]]}
              rotation={[0, 0, 0]}
            >
              <meshBasicMaterial color="#000000" />
            </Cylinder>
          ))}
        </>
      )}
    </group>
  )
}

