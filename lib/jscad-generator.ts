import { primitives, booleans, transforms } from '@jscad/modeling'
import { serialize as serializeSTL } from '@jscad/stl-serializer'
import { IGS } from '@/lib/igs-generator'

const { cuboid, cylinder } = primitives
const { translate, rotateZ, rotateY } = transforms
const { subtract, union } = booleans

type JscadGeometry = object // JSCAD geometry type

/**
 * Generate 3D model from IGS
 */
export function generateJSCADModel(igs: IGS): JscadGeometry {
  // Create base board centered at origin
  let board = cuboid({
    size: [igs.board.width, igs.board.height, igs.board.thickness]
  })
  
  const cutouts: JscadGeometry[] = []
  
  // Generate component recesses and lead holes
  igs.components.forEach(comp => {
    // Create recess based on shape
    let recess: JscadGeometry | null = null
    
    if (comp.recess.shape === 'cylindrical') {
      // Cylindrical recess for capacitors/resistors
      const radius = (comp.body.dimensions.diameter || 10) / 2 + comp.recess.clearance
      const length = comp.body.dimensions.length || 20
      
      // Create horizontal cylinder
      recess = cylinder({
        radius: radius,
        height: length,
        segments: 32
      })
      
      // Rotate to horizontal and position at correct depth
      recess = rotateY(Math.PI / 2, recess)
      recess = translate([0, 0, igs.board.thickness / 2 - comp.recess.depth / 2], recess)
      
    } else if (comp.recess.shape === 'ring') {
      // Ring-shaped recess for coils
      const outerRadius = (comp.body.dimensions.outerDiameter || 30) / 2 + comp.recess.clearance
      const innerRadius = (comp.body.dimensions.innerDiameter || 15) / 2 - comp.recess.clearance
      
      // Create ring by subtracting inner cylinder from outer
      const outer = cylinder({
        radius: outerRadius,
        height: comp.recess.depth * 2,
        segments: 32
      })
      
      const inner = cylinder({
        radius: innerRadius,
        height: comp.recess.depth * 2 + 1,
        segments: 32
      })
      
      recess = subtract(outer, inner)
      recess = translate([0, 0, igs.board.thickness / 2 - comp.recess.depth / 2], recess)
      
    } else if (comp.recess.shape === 'rectangular') {
      // Rectangular recess
      const width = (comp.body.dimensions.width || 20) + comp.recess.clearance * 2
      const length = (comp.body.dimensions.length || 30) + comp.recess.clearance * 2
      
      recess = cuboid({
        size: [width, length, comp.recess.depth * 2]
      })
      
      recess = translate([0, 0, igs.board.thickness / 2 - comp.recess.depth / 2], recess)
    }
    
    // Position and rotate the recess
    if (recess) {
      recess = rotateZ(comp.position.rotation, recess)
      recess = translate([comp.position.x, comp.position.y, 0], recess)
      cutouts.push(recess)
    }
    
    // Create lead holes
    comp.leadHoles.forEach(hole => {
      // Calculate absolute position with rotation
      const cos = Math.cos(comp.position.rotation)
      const sin = Math.sin(comp.position.rotation)
      const holeX = comp.position.x + hole.x * cos - hole.y * sin
      const holeY = comp.position.y + hole.x * sin + hole.y * cos
      
      let leadHole = cylinder({
        radius: hole.diameter / 2,
        height: igs.board.thickness + 2, // Ensure through-hole
        segments: 16
      })
      
      leadHole = translate([holeX, holeY, 0], leadHole)
      cutouts.push(leadHole)
    })
  })
  
  // Add mounting holes
  igs.board.mountingHoles?.forEach(hole => {
    let mountingHole = cylinder({
      radius: hole.diameter / 2,
      height: igs.board.thickness + 2,
      segments: 16
    })
    
    // Add countersink if specified
    if (hole.countersink && hole.countersinkDiameter) {
      const countersink = cylinder({
        radius: hole.countersinkDiameter / 2,
        height: 2,
        segments: 16
      })
      
      const countersinkCutout = translate(
        [hole.x, hole.y, igs.board.thickness / 2 - 1],
        countersink
      )
      cutouts.push(countersinkCutout)
    }
    
    mountingHole = translate([hole.x, hole.y, 0], mountingHole)
    cutouts.push(mountingHole)
  })
  
  // Subtract all cutouts from the board
  if (cutouts.length > 0) {
    const allCutouts = cutouts.length === 1 ? cutouts[0] : union(...cutouts)
    board = subtract(board, allCutouts)
  }
  
  // TODO: Add labels (embossed/engraved text)
  // This requires text support in JSCAD which may need additional setup
  
  return board
}

/**
 * Generate STL from IGS
 */
export async function generateSTL(igs: IGS): Promise<ArrayBuffer> {
  try {
    // Generate the 3D model
    const model = generateJSCADModel(igs)
    
    // Serialize to STL (binary format)
    const rawData = serializeSTL({ binary: true }, model)
    
    // Handle the return value
    if (Array.isArray(rawData) && rawData.length > 0) {
      const data = rawData[0]
      if (data instanceof ArrayBuffer) {
        return data
      } else if (typeof data === 'string') {
        // Convert string to ArrayBuffer if needed
        const encoder = new TextEncoder()
        return encoder.encode(data).buffer
      }
    }
    
    throw new Error('Failed to serialize STL data')
  } catch (error) {
    console.error('Error generating STL:', error)
    throw new Error(`STL generation failed: ${error}`)
  }
}

/**
 * Generate a preview mesh for Three.js
 * This is a simplified version that doesn't include all details
 */
export function generatePreviewGeometry(igs: IGS): JscadGeometry {
  // For preview, we can use a simpler model with less detail
  return generateJSCADModel(igs)
}