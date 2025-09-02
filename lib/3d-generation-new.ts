import { booleans, primitives, transforms } from '@jscad/modeling'
import { serialize as serializeSTL } from '@jscad/stl-serializer'

const { cuboid, cylinder } = primitives
const { translate, rotateZ } = transforms
const { subtract } = booleans

// Type for JSCAD 3D model
type JscadGeometry = object

export interface Board3DSettings {
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

export interface Component3DData {
  id: string
  position: [number, number, number]
  rotation: [number, number, number]
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
  lead_configuration: 'axial' | 'radial'
  suggested_hole_diameter_mm: number
  end_inset_mm?: number
  lead_pattern?: 'adjacent' | 'opposite'
  lead_spacing_mm?: number
}

/**
 * Generate STL from board and components using enriched data
 */
export async function generateSTL({
  board,
  components
}: {
  board: Board3DSettings
  components: Component3DData[]
}): Promise<ArrayBuffer> {
  const model = generate3DModel(board, components)
  
  // Serialize to STL
  const rawData = serializeSTL({ binary: true }, model)
  
  // Handle the return value which could be ArrayBuffer[] or string[]
  if (Array.isArray(rawData) && rawData.length > 0) {
    const data = rawData[0]
    if (data instanceof ArrayBuffer) {
      return data
    } else if (typeof data === 'string') {
      // Convert string to ArrayBuffer
      const encoder = new TextEncoder()
      return encoder.encode(data).buffer
    }
  }
  
  throw new Error('Failed to generate STL data')
}

/**
 * Generate 3D model from board and enriched components
 */
export function generate3DModel(board: Board3DSettings, components: Component3DData[]): JscadGeometry {
  // Create base board
  let baseBoard = cuboid({
    size: [board.width, board.height, board.thickness]
  })
  
  // Center board at origin
  baseBoard = translate([0, 0, -board.thickness / 2], baseBoard)
  
  const cutouts: JscadGeometry[] = []
  
  // Add mounting holes if enabled
  if (board.mountingHoles?.enabled && board.mountingHoles.positions === 'corners') {
    const inset = 5 // 5mm from edge
    const positions = [
      [-board.width/2 + inset, -board.height/2 + inset],
      [board.width/2 - inset, -board.height/2 + inset],
      [-board.width/2 + inset, board.height/2 - inset],
      [board.width/2 - inset, board.height/2 - inset],
    ]
    
    positions.forEach(([x, y]) => {
      const hole = cylinder({
        radius: board.mountingHoles!.diameter / 2,
        height: board.thickness + 2,
        segments: 32
      })
      cutouts.push(translate([x, y, -board.thickness/2 - 1], hole))
    })
  }
  
  // Process each component
  components.forEach(comp => {
    // Component position is relative to board center
    const [x, y] = comp.position
    const rotation = comp.rotation[1] * Math.PI / 180 // Y-axis rotation in radians
    
    // Calculate recess based on component shape
    if (comp.body_shape === 'cylinder') {
      const radius = (comp.dimensions.diameter || 10) / 2
      const length = comp.dimensions.length || 20
      const recessDepth = Math.min(3, board.thickness - 0.5)
      
      // Cylindrical recess
      let recess = cylinder({
        radius: radius + 0.5, // 0.5mm clearance
        height: recessDepth,
        segments: 32
      })
      recess = rotateZ(rotation, recess)
      recess = translate([x, y, -recessDepth/2], recess)
      cutouts.push(recess)
      
      // Lead holes for axial component
      if (comp.lead_configuration === 'axial') {
        const endInset = comp.end_inset_mm || 2.5
        const holeRadius = comp.suggested_hole_diameter_mm / 2
        
        // Calculate hole positions
        const hole1X = -length/2 + endInset
        const hole2X = length/2 - endInset
        
        // Apply rotation to hole positions
        const cos = Math.cos(rotation)
        const sin = Math.sin(rotation)
        
        const h1X = x + hole1X * cos
        const h1Y = y + hole1X * sin
        const h2X = x + hole2X * cos
        const h2Y = y + hole2X * sin
        
        // Create holes
        const hole1 = cylinder({
          radius: holeRadius,
          height: board.thickness + 2,
          segments: 16
        })
        const hole2 = cylinder({
          radius: holeRadius,
          height: board.thickness + 2,
          segments: 16
        })
        
        cutouts.push(translate([h1X, h1Y, -board.thickness/2 - 1], hole1))
        cutouts.push(translate([h2X, h2Y, -board.thickness/2 - 1], hole2))
      }
    } else if (comp.body_shape === 'coil') {
      const outerRadius = (comp.dimensions.outer_diameter || 30) / 2
      const innerRadius = (comp.dimensions.inner_diameter || 15) / 2
      const recessDepth = Math.min(3, board.thickness - 0.5)
      
      // Ring-shaped recess
      const outerCyl = cylinder({
        radius: outerRadius + 0.5,
        height: recessDepth,
        segments: 32
      })
      const innerCyl = cylinder({
        radius: innerRadius - 0.5,
        height: recessDepth + 2,
        segments: 32
      })
      
      let recess = subtract(outerCyl, innerCyl)
      recess = rotateZ(rotation, recess)
      recess = translate([x, y, -recessDepth/2], recess)
      cutouts.push(recess)
      
      // Lead holes for coil
      const holeRadius = comp.suggested_hole_diameter_mm / 2
      const pattern = comp.lead_pattern || 'adjacent'
      
      let angle1: number, angle2: number
      if (pattern === 'adjacent') {
        angle1 = -15 * Math.PI / 180
        angle2 = 15 * Math.PI / 180
      } else {
        angle1 = 0
        angle2 = Math.PI
      }
      
      // Apply component rotation
      angle1 += rotation
      angle2 += rotation
      
      const h1X = x + innerRadius * Math.cos(angle1)
      const h1Y = y + innerRadius * Math.sin(angle1)
      const h2X = x + innerRadius * Math.cos(angle2)
      const h2Y = y + innerRadius * Math.sin(angle2)
      
      const hole1 = cylinder({
        radius: holeRadius,
        height: board.thickness + 2,
        segments: 16
      })
      const hole2 = cylinder({
        radius: holeRadius,
        height: board.thickness + 2,
        segments: 16
      })
      
      cutouts.push(translate([h1X, h1Y, -board.thickness/2 - 1], hole1))
      cutouts.push(translate([h2X, h2Y, -board.thickness/2 - 1], hole2))
    } else {
      // Rectangular component
      const width = comp.dimensions.width || 20
      const depth = comp.dimensions.depth || comp.dimensions.length || 15
      const recessDepth = Math.min(3, board.thickness - 0.5)
      
      // Rectangular recess
      let recess = cuboid({
        size: [width + 1, depth + 1, recessDepth]
      })
      recess = rotateZ(rotation, recess)
      recess = translate([x, y, -recessDepth/2], recess)
      cutouts.push(recess)
      
      // Lead holes for radial component
      if (comp.lead_configuration === 'radial' && comp.lead_spacing_mm) {
        const spacing = comp.lead_spacing_mm
        const holeRadius = comp.suggested_hole_diameter_mm / 2
        
        const hole1X = -spacing/2
        const hole2X = spacing/2
        
        // Apply rotation
        const cos = Math.cos(rotation)
        const sin = Math.sin(rotation)
        
        const h1X = x + hole1X * cos
        const h1Y = y + hole1X * sin
        const h2X = x + hole2X * cos
        const h2Y = y + hole2X * sin
        
        const hole1 = cylinder({
          radius: holeRadius,
          height: board.thickness + 2,
          segments: 16
        })
        const hole2 = cylinder({
          radius: holeRadius,
          height: board.thickness + 2,
          segments: 16
        })
        
        cutouts.push(translate([h1X, h1Y, -board.thickness/2 - 1], hole1))
        cutouts.push(translate([h2X, h2Y, -board.thickness/2 - 1], hole2))
      }
    }
  })
  
  // Subtract all cutouts from base board
  if (cutouts.length > 0) {
    return subtract(baseBoard, ...cutouts)
  }
  
  return baseBoard
}