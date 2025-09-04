import { primitives, booleans, transforms } from '@jscad/modeling'
import { serialize as serializeSTL } from '@jscad/stl-serializer'
import { IGS } from '@/lib/igs-generator'

const { cuboid, cylinder } = primitives
const { translate, rotateZ, rotateX } = transforms
const { subtract, union } = booleans

type JscadGeometry = object // JSCAD geometry type

/**
 * Generate 3D model from IGS
 */
export function generateJSCADModel(igs: IGS): JscadGeometry {
  // Create base board centered at origin
  // In JSCAD: X = width, Y = depth, Z = thickness (vertical)
  let board = cuboid({
    size: [igs.board.width, igs.board.height, igs.board.thickness]
  })
  
  const cutouts: JscadGeometry[] = []
  
  // Generate component recesses and lead holes
  igs.components.forEach(comp => {
    // Create recess based on shape
    let recess: JscadGeometry | null = null
    
    if (comp.recess.shape === 'cylinder') {
      // Cylindrical recess for capacitors/resistors - PROPER horizontal orientation
      const diameter = comp.recess.dimensions.diameter || 10
      const radius = diameter / 2 + 0.5 // 0.5mm clearance
      // Use actual body length for axial components
      const length = comp.recess.dimensions.width || comp.recess.dimensions.depth || 20
      
      // Create a horizontal cradle-shaped recess
      // We create a cylinder and position it so only the top part cuts into the board
      recess = cylinder({
        radius: radius,
        height: length,
        segments: 32,
        center: [0, length/2, 0] // Center along Y axis
      })
      
      // Rotate 90° around X-axis to lay it horizontal (along Y-axis)
      recess = rotateX(Math.PI / 2, recess)
      
      // Position so the cylinder cuts into the top of the board
      // The cylinder center should be above the board surface
      const recessY = igs.board.thickness/2 - comp.recess.depth + radius
      recess = translate([0, 0, recessY], recess)
      
    } else if (comp.recess.shape === 'toroidal') {
      // Ring-shaped recess for coils
      const outerRadius = (comp.recess.dimensions.outerDiameter || 30) / 2 + 0.5
      const innerRadius = (comp.recess.dimensions.innerDiameter || 15) / 2 - 0.5
      
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
      const width = (comp.recess.dimensions.width || 20) + 1 // 0.5mm clearance on each side
      const length = (comp.recess.dimensions.depth || 30) + 1
      
      recess = cuboid({
        size: [width, length, comp.recess.depth * 2]
      })
      
      recess = translate([0, 0, igs.board.thickness / 2 - comp.recess.depth / 2], recess)
    }
    
    // Position and rotate the recess
    if (recess) {
      const rotatedRecess = rotateZ(comp.rotation * Math.PI / 180, recess)
      // In JSCAD coordinates: X stays X, Z from UI becomes Y in JSCAD
      const positionedRecess = translate([comp.position.x, comp.position.z, 0], rotatedRecess)
      cutouts.push(positionedRecess)
    }
    
    // Create lead holes
    comp.leadHoles.forEach(hole => {
      // Calculate absolute position with rotation
      const rotRad = comp.rotation * Math.PI / 180
      const cos = Math.cos(rotRad)
      const sin = Math.sin(rotRad)
      // Rotate hole position around component center
      const holeX = comp.position.x + hole.position.x * cos - hole.position.z * sin
      const holeY = comp.position.z + hole.position.x * sin + hole.position.z * cos
      
      let leadHole = cylinder({
        radius: hole.diameter / 2,
        height: igs.board.thickness + 2, // Ensure through-hole
        segments: 16
      })
      
      // Position hole in JSCAD coordinates (X, Y, Z)
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
    if (hole.countersink) {
      const countersink = cylinder({
        radius: hole.diameter, // Countersink is typically 2x the hole diameter
        height: 2,
        segments: 16
      })
      
      const countersinkCutout = translate(
        [hole.position.x, hole.position.z, igs.board.thickness / 2 - 1],
        countersink
      )
      cutouts.push(countersinkCutout)
    }
    
    mountingHole = translate([hole.position.x, hole.position.z, 0], mountingHole)
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
    
    // Handle the return value - JSCAD returns an array of data chunks
    if (Array.isArray(rawData) && rawData.length > 0) {
      // For binary STL, concatenate all array buffer chunks
      if (rawData[0] instanceof ArrayBuffer) {
        // If there's only one chunk, return it
        if (rawData.length === 1) {
          return rawData[0]
        }
        
        // Multiple chunks - concatenate them
        const totalLength = rawData.reduce((sum, chunk) => sum + chunk.byteLength, 0)
        const result = new ArrayBuffer(totalLength)
        const view = new Uint8Array(result)
        let offset = 0
        
        for (const chunk of rawData) {
          view.set(new Uint8Array(chunk), offset)
          offset += chunk.byteLength
        }
        
        return result
      } else if (typeof rawData[0] === 'string') {
        // ASCII STL - join strings and convert to ArrayBuffer
        const stlString = rawData.join('')
        const encoder = new TextEncoder()
        return encoder.encode(stlString).buffer
      }
    }
    
    throw new Error('Failed to serialize STL data - no data returned')
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