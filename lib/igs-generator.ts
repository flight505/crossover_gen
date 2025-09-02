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
  features: any[]
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
      componentId: comp.componentId,
      type: comp.part_type,
      position: {
        x: comp.position[0],
        y: comp.position[2], // Z in 3D space is Y in 2D board space
        rotation: comp.rotation[1] // Y rotation in radians
      },
      body: {
        shape: comp.body_shape,
        dimensions: {
          diameter: comp.dimensions.diameter,
          length: comp.dimensions.length,
          width: comp.dimensions.width,
          height: comp.dimensions.height,
          outerDiameter: comp.dimensions.outer_diameter,
          innerDiameter: comp.dimensions.inner_diameter
        }
      },
      recess: {
        shape: comp.body_shape === 'cylinder' ? 'cylindrical' : 
               comp.body_shape === 'coil' ? 'ring' : 'rectangular',
        depth: recessDepth,
        clearance: 0.5 // 0.5mm clearance for easy fit
      },
      leadHoles: leadHoles.map(hole => ({
        x: hole.x,
        y: hole.z,
        diameter: hole.diameter,
        plated: false
      })),
      metadata: {
        brand: comp.brand,
        series: comp.series,
        value: comp.value,
        valueUnit: comp.value_unit,
        partNumber: comp.componentId
      }
    }
  })
  
  // Generate labels for components
  const labels: Label[] = components.map(comp => ({
    id: `label-${comp.id}`,
    text: `${comp.value}${comp.value_unit}`,
    x: comp.position[0],
    y: comp.position[2],
    z: board.thickness + 0.5, // On top of board
    fontSize: 3,
    fontDepth: 0.3, // Embossed
    rotation: comp.rotation[1],
    side: 'top',
    type: 'component-value'
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
        x: pos.x - board.width / 2, // Convert to centered coordinates
        y: pos.y - board.height / 2,
        diameter: board.mountingHoles.diameter,
        countersink: true,
        countersinkDiameter: board.mountingHoles.diameter * 2,
        countersinkAngle: 82
      })
    })
  }
  
  // Create the IGS
  const igs: IGS = {
    version: '1.0.0',
    board: {
      width: board.width,
      height: board.height, 
      thickness: board.thickness,
      cornerRadius: board.cornerRadius,
      mountingHoles
    },
    components: placedComponents,
    labels,
    features: [], // Additional features can be added here
    validation: {
      minimumWallThickness: 2,
      minimumHoleDiameter: 0.5,
      maximumRecessDepth: 3,
      edgeClearance: 2
    }
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
        Math.abs(comp.position.y) > halfHeight - 5) {
      errors.push(`Component ${comp.id} is too close to board edge`)
    }
    
    // Check lead holes
    comp.leadHoles.forEach(hole => {
      const holeX = comp.position.x + hole.x * Math.cos(comp.position.rotation) - hole.y * Math.sin(comp.position.rotation)
      const holeY = comp.position.y + hole.x * Math.sin(comp.position.rotation) + hole.y * Math.cos(comp.position.rotation)
      
      if (Math.abs(holeX) > halfWidth - 2 ||
          Math.abs(holeY) > halfHeight - 2) {
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
      const dy = comp1.position.y - comp2.position.y
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