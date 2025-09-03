import { Component3D, BoardSettings } from '@/lib/store/designer-store'
import { calculateLeadHolePositions } from '@/lib/component-data-loader'
// Define types locally since they're not exported from a separate file
export interface PlacedComponent {
  id: string
  type: 'capacitor' | 'resistor' | 'inductor'
  value: string
  position: { x: number; z: number }
  rotation: number
  recess: {
    shape: 'cylinder' | 'rectangular' | 'toroidal'
    dimensions: {
      width?: number
      depth?: number
      diameter?: number
      outerDiameter?: number
      innerDiameter?: number
    }
    depth: number
  }
  leadHoles: Array<{
    position: { x: number; z: number }
    diameter: number
  }>
}

export interface Label {
  text: string
  position: { x: number; z: number }
  size: number
  depth: number
  type: 'embossed' | 'engraved'
}

export interface MountingHole {
  position: { x: number; z: number }
  diameter: number
  countersink?: boolean
}

export interface IGS {
  board: {
    width: number
    height: number
    thickness: number
    cornerRadius?: number
    mountingHoles?: MountingHole[]
  }
  components: PlacedComponent[]
  labels: Label[]
  features: object[]
}

export function generateIGS(
  board: BoardSettings,
  components: Component3D[]
): IGS {
  // Convert Component3D to PlacedComponent with all necessary data
  const placedComponents: PlacedComponent[] = components.map(comp => {
    const leadHoles = calculateLeadHolePositions(comp)
    
    // Calculate recess depth based on component height
    const componentHeight = comp.dimensions.height || 
                           comp.dimensions.diameter || 
                           comp.dimensions.outer_diameter || 10
    const recessDepth = Math.min(
      componentHeight * 0.5,  // 50% of component height
      board.thickness - 1,     // Leave at least 1mm base
      3                        // Maximum 3mm deep
    )
    
    return {
      id: comp.id,
      type: comp.part_type,
      value: `${comp.value}${comp.value_unit}`,
      position: {
        x: comp.position[0],
        z: comp.position[2]  // Z in 3D space
      },
      rotation: comp.rotation[1], // Y rotation in degrees
      recess: {
        shape: comp.body_shape === 'cylinder' ? 'cylinder' : 
               comp.body_shape === 'coil' ? 'toroidal' : 'rectangular',
        dimensions: {
          // For cylindrical components, width is the body length
          width: comp.dimensions.length || comp.dimensions.width,
          depth: comp.dimensions.height || comp.dimensions.depth,
          diameter: comp.dimensions.diameter,
          outerDiameter: comp.dimensions.outer_diameter,
          innerDiameter: comp.dimensions.inner_diameter
        },
        depth: recessDepth
      },
      leadHoles: leadHoles.map(hole => ({
        position: {
          x: hole.x,
          z: hole.z
        },
        diameter: hole.diameter
      }))
    }
  })
  
  // Generate labels for components
  const labels: Label[] = components.map(comp => ({
    text: `${comp.value}${comp.value_unit}`,
    position: {
      x: comp.position[0],
      z: comp.position[2]
    },
    size: 3,
    depth: 0.5,
    type: 'embossed'
  }))
  
  // Generate mounting holes if enabled
  const mountingHoles: MountingHole[] = []
  if (board.mountingHoles.enabled) {
    const inset = 5 // 5mm from edge
    const positions = [
      { x: inset, y: inset },
      { x: board.width - inset, y: inset },
      { x: board.width - inset, y: board.height - inset },
      { x: inset, y: board.height - inset }
    ]
    
    positions.forEach(pos => {
      mountingHoles.push({
        position: {
          x: pos.x - board.width / 2, // Convert to centered coordinates
          z: pos.y - board.height / 2
        },
        diameter: board.mountingHoles.diameter,
        countersink: true
      })
    })
  }
  
  // Create the IGS
  const igs: IGS = {
    board: {
      width: board.width,
      height: board.height, 
      thickness: board.thickness,
      cornerRadius: board.cornerRadius,
      mountingHoles
    },
    components: placedComponents,
    labels,
    features: [] // Additional features can be added here
  }
  
  return igs
}

// Validate IGS for printability
export function validateIGS(igs: IGS): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Check board dimensions
  if (igs.board.thickness < 3) {
    errors.push('Board thickness must be at least 3mm')
  }
  
  // Check component positions
  igs.components.forEach(comp => {
    const halfWidth = igs.board.width / 2
    const halfHeight = igs.board.height / 2
    
    // Check if component is within board bounds
    if (Math.abs(comp.position.x) > halfWidth - 5 ||
        Math.abs(comp.position.z) > halfHeight - 5) {
      errors.push(`Component ${comp.id} is too close to board edge`)
    }
    
    // Check lead holes
    comp.leadHoles.forEach(hole => {
      const rotationRad = comp.rotation * Math.PI / 180
      const holeX = comp.position.x + hole.position.x * Math.cos(rotationRad) - hole.position.z * Math.sin(rotationRad)
      const holeZ = comp.position.z + hole.position.x * Math.sin(rotationRad) + hole.position.z * Math.cos(rotationRad)
      
      if (Math.abs(holeX) > halfWidth - 2 ||
          Math.abs(holeZ) > halfHeight - 2) {
        errors.push(`Lead hole for component ${comp.id} is too close to board edge`)
      }
    })
    
    // Check recess depth
    if (comp.recess.depth > igs.board.thickness - 1) {
      errors.push(`Recess for component ${comp.id} is too deep`)
    }
  })
  
  // Check for component collisions
  for (let i = 0; i < igs.components.length; i++) {
    for (let j = i + 1; j < igs.components.length; j++) {
      const comp1 = igs.components[i]
      const comp2 = igs.components[j]
      
      const dx = comp1.position.x - comp2.position.x
      const dy = comp1.position.z - comp2.position.z
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      // Simple collision check (can be improved)
      const minDistance = 5 // 5mm minimum spacing
      if (distance < minDistance) {
        errors.push(`Components ${comp1.id} and ${comp2.id} are too close`)
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}