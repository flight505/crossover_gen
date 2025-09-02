import { booleans, primitives, transforms } from '@jscad/modeling'
import { serialize as serializeSTL } from '@jscad/stl-serializer'
import { PlacedComponent } from '@/types'
import { IGS, generateIGS } from './igs'
import { createPositionedText } from './text-generator'

const { cuboid, cylinder } = primitives
const { translate, rotateZ } = transforms
const { subtract, union } = booleans

export interface BoardDimensions {
  width: number
  height: number
  thickness: number
}

/**
 * Generate 3D model from IGS specification
 */
// Type for JSCAD 3D model
type JscadGeometry = object

export function generate3DModelFromIGS(igs: IGS): JscadGeometry {
  // Create the base board with optional corner radius
  let baseBoard = igs.board.cornerRadius && igs.board.cornerRadius > 0
    ? createRoundedBoard(igs.board.width, igs.board.height, igs.board.thickness, igs.board.cornerRadius)
    : cuboid({
        size: [igs.board.width, igs.board.height, igs.board.thickness]
      })

  // Move board to center on origin
  baseBoard = translate(
    [0, 0, igs.board.thickness / 2],
    baseBoard
  )

  const cutouts: JscadGeometry[] = []
  
  // Add mounting holes
  if (igs.board.mountingHoles) {
    igs.board.mountingHoles.forEach(hole => {
      const holeDepth = hole.depth || igs.board.thickness + 1
      let holeCutout = cylinder({
        radius: hole.diameter / 2,
        height: holeDepth,
        segments: 16
      })
      
      // Position hole
      const centerX = hole.x - igs.board.width / 2
      const centerY = hole.y - igs.board.height / 2
      holeCutout = translate([centerX, centerY, igs.board.thickness / 2], holeCutout)
      
      // Add countersink if specified
      if (hole.countersink) {
        const countersinkDia = hole.countersinkDiameter || hole.diameter * 1.8
        const countersinkDepth = countersinkDia * 0.5
        let countersinkCutout = cylinder({
          radius: countersinkDia / 2,
          height: countersinkDepth,
          segments: 16
        })
        countersinkCutout = translate(
          [centerX, centerY, igs.board.thickness - countersinkDepth / 2],
          countersinkCutout
        )
        cutouts.push(countersinkCutout)
      }
      
      cutouts.push(holeCutout)
    })
  }

  // Process components (same logic as before, but from IGS)
  processComponentCutouts(igs.components, igs.board, cutouts)

  // Subtract all cutouts from the base board
  let finalModel = baseBoard
  if (cutouts.length > 0) {
    finalModel = subtract(finalModel, ...cutouts)
  }

  // Add labels if specified
  if (igs.labels && igs.labels.length > 0) {
    const labelGeometries: JscadGeometry[] = []
    
    for (const label of igs.labels) {
      // Convert from board coordinates to centered coordinates
      const centerX = label.x - igs.board.width / 2
      const centerY = label.y - igs.board.height / 2
      const z = label.side === 'top' 
        ? igs.board.thickness + (label.fontDepth > 0 ? 0 : Math.abs(label.fontDepth))
        : -(label.fontDepth > 0 ? 0 : Math.abs(label.fontDepth))
      
      const textGeom = createPositionedText(
        label.text,
        centerX,
        centerY,
        z,
        label.rotation || 0,
        label.fontSize || 3,
        Math.abs(label.fontDepth || 0.5)
      )
      
      if (textGeom) {
        if (label.fontDepth > 0) {
          // Embossed - add to the model
          labelGeometries.push(textGeom)
        } else {
          // Engraved - subtract from the model
          cutouts.push(textGeom)
        }
      }
    }
    
    // Apply embossed labels
    if (labelGeometries.length > 0) {
      finalModel = union(finalModel, ...labelGeometries)
    }
    
    // Apply engraved labels
    if (cutouts.length > 0) {
      finalModel = subtract(finalModel, ...cutouts)
    }
  }

  return finalModel
}

/**
 * Create a board with rounded corners
 */
function createRoundedBoard(width: number, height: number, thickness: number, radius: number): JscadGeometry {
  // Create main board
  const mainWidth = width - 2 * radius
  const mainHeight = height - 2 * radius
  
  let board = cuboid({ size: [mainWidth, height, thickness] })
  const sideBoard = cuboid({ size: [width, mainHeight, thickness] })
  board = union(board, sideBoard)
  
  // Add corner cylinders
  const corners = [
    [-mainWidth/2, -mainHeight/2],
    [mainWidth/2, -mainHeight/2],
    [-mainWidth/2, mainHeight/2],
    [mainWidth/2, mainHeight/2]
  ]
  
  corners.forEach(([x, y]) => {
    const corner = cylinder({ radius, height: thickness, segments: 32 })
    board = union(board, translate([x, y, 0], corner))
  })
  
  return board
}

/**
 * Process component cutouts
 */
function processComponentCutouts(
  components: PlacedComponent[],
  board: { width: number; height: number; thickness: number },
  cutouts: JscadGeometry[]
): void {
  for (const placed of components) {
    const { component, x, y, rotation } = placed
    const dims = component.dimensions

    // Calculate component dimensions
    const isCircular = dims.diameter !== undefined
    const width = dims.diameter || dims.length || 10
    const height = dims.diameter || dims.width || 10
    const componentHeight = dims.height || 10

    // Create component recess
    const recessDepth = Math.min(componentHeight * 0.7, board.thickness - 0.5, 3)
    let recess: JscadGeometry

    if (isCircular) {
      recess = cylinder({
        radius: (dims.diameter! / 2) + 0.5,
        height: recessDepth,
        segments: 32
      })
    } else {
      recess = cuboid({
        size: [width + 1, height + 1, recessDepth]
      })
    }

    // Position the recess
    const centerX = x - board.width / 2
    const centerY = y - board.height / 2
    
    if (rotation !== 0) {
      recess = rotateZ((rotation * Math.PI) / 180, recess)
    }
    
    recess = translate([centerX, centerY, board.thickness - recessDepth / 2], recess)
    cutouts.push(recess)

    // Add lead holes
    if (component.lead_config) {
      addLeadHoles(component, placed, board, cutouts)
    }
  }
}

/**
 * Add lead holes for a component
 */
function addLeadHoles(
  component: PlacedComponent['component'],
  placed: PlacedComponent,
  board: { width: number; height: number; thickness: number },
  cutouts: JscadGeometry[]
): void {
  const leadDiameter = component.lead_config.diameter
  const holeRadius = (leadDiameter + 0.3) / 2
  const spacing = component.lead_config.spacing
  const centerX = placed.x - board.width / 2
  const centerY = placed.y - board.height / 2
  const hasCountersink = component.lead_config.countersink === true
  const countersinkDia = component.lead_config.countersinkDiameter || leadDiameter * 1.8
  const countersinkDepth = countersinkDia * 0.5 // Standard depth for 82° countersink

  if (component.lead_config.configuration === 'radial') {
    // Radial component lead holes
    const hole1 = cylinder({
      radius: holeRadius,
      height: board.thickness + 1,
      segments: 16
    })
    const hole2 = cylinder({
      radius: holeRadius,
      height: board.thickness + 1,
      segments: 16
    })

    if (placed.rotation !== 0) {
      const rotRad = (placed.rotation * Math.PI) / 180
      
      const dx1 = -spacing / 2
      const rotX1 = dx1 * Math.cos(rotRad)
      const rotY1 = dx1 * Math.sin(rotRad)
      
      const dx2 = spacing / 2
      const rotX2 = dx2 * Math.cos(rotRad)
      const rotY2 = dx2 * Math.sin(rotRad)
      
      cutouts.push(
        translate([centerX + rotX1, centerY + rotY1, board.thickness / 2], hole1),
        translate([centerX + rotX2, centerY + rotY2, board.thickness / 2], hole2)
      )
      
      // Add countersinks if specified
      if (hasCountersink) {
        const countersink1 = cylinder({
          radius: countersinkDia / 2,
          height: countersinkDepth,
          segments: 16
        })
        const countersink2 = cylinder({
          radius: countersinkDia / 2,
          height: countersinkDepth,
          segments: 16
        })
        cutouts.push(
          translate([centerX + rotX1, centerY + rotY1, board.thickness - countersinkDepth / 2], countersink1),
          translate([centerX + rotX2, centerY + rotY2, board.thickness - countersinkDepth / 2], countersink2)
        )
      }
    } else {
      cutouts.push(
        translate([centerX - spacing / 2, centerY, board.thickness / 2], hole1),
        translate([centerX + spacing / 2, centerY, board.thickness / 2], hole2)
      )
      
      // Add countersinks if specified
      if (hasCountersink) {
        const countersink1 = cylinder({
          radius: countersinkDia / 2,
          height: countersinkDepth,
          segments: 16
        })
        const countersink2 = cylinder({
          radius: countersinkDia / 2,
          height: countersinkDepth,
          segments: 16
        })
        cutouts.push(
          translate([centerX - spacing / 2, centerY, board.thickness - countersinkDepth / 2], countersink1),
          translate([centerX + spacing / 2, centerY, board.thickness - countersinkDepth / 2], countersink2)
        )
      }
    }
  } else if (component.lead_config.configuration === 'axial') {
    // Axial component lead holes
    const hole1 = cylinder({
      radius: holeRadius,
      height: board.thickness + 1,
      segments: 16
    })
    const hole2 = cylinder({
      radius: holeRadius,
      height: board.thickness + 1,
      segments: 16
    })

    const width = component.dimensions.length || 10
    const halfLength = width / 2 - 2

    if (placed.rotation !== 0) {
      const rotRad = (placed.rotation * Math.PI) / 180
      const dx1 = -halfLength
      const rotX1 = dx1 * Math.cos(rotRad)
      const rotY1 = dx1 * Math.sin(rotRad)
      const dx2 = halfLength
      const rotX2 = dx2 * Math.cos(rotRad)
      const rotY2 = dx2 * Math.sin(rotRad)
      
      cutouts.push(
        translate([centerX + rotX1, centerY + rotY1, board.thickness / 2], hole1),
        translate([centerX + rotX2, centerY + rotY2, board.thickness / 2], hole2)
      )
      
      // Add countersinks if specified
      if (hasCountersink) {
        const countersink1 = cylinder({
          radius: countersinkDia / 2,
          height: countersinkDepth,
          segments: 16
        })
        const countersink2 = cylinder({
          radius: countersinkDia / 2,
          height: countersinkDepth,
          segments: 16
        })
        cutouts.push(
          translate([centerX + rotX1, centerY + rotY1, board.thickness - countersinkDepth / 2], countersink1),
          translate([centerX + rotX2, centerY + rotY2, board.thickness - countersinkDepth / 2], countersink2)
        )
      }
    } else {
      cutouts.push(
        translate([centerX - halfLength, centerY, board.thickness / 2], hole1),
        translate([centerX + halfLength, centerY, board.thickness / 2], hole2)
      )
      
      // Add countersinks if specified
      if (hasCountersink) {
        const countersink1 = cylinder({
          radius: countersinkDia / 2,
          height: countersinkDepth,
          segments: 16
        })
        const countersink2 = cylinder({
          radius: countersinkDia / 2,
          height: countersinkDepth,
          segments: 16
        })
        cutouts.push(
          translate([centerX - halfLength, centerY, board.thickness - countersinkDepth / 2], countersink1),
          translate([centerX + halfLength, centerY, board.thickness - countersinkDepth / 2], countersink2)
        )
      }
    }
  }
}

/**
 * Legacy function - converts to IGS and generates model
 */
export function generate3DModel(
  placedComponents: PlacedComponent[],
  boardDimensions: BoardDimensions,
  options?: {
    cornerRadius?: number
    mountingHoles?: boolean
    addLabels?: boolean
  }
): JscadGeometry {
  // Generate IGS and use the new function
  const igs = generateIGS(
    placedComponents,
    boardDimensions.width,
    boardDimensions.height,
    boardDimensions.thickness,
    options
  )
  
  return generate3DModelFromIGS(igs)
}

export function exportSTL(model: JscadGeometry): ArrayBuffer | string {
  // Serialize as binary STL for better compatibility and smaller file size
  const stlData = serializeSTL({ binary: true }, model)
  // serializeSTL returns an array when binary is true
  return Array.isArray(stlData) ? stlData[0] : stlData
}

export function downloadSTL(model: JscadGeometry, filename: string = 'crossover-plate.stl'): void {
  try {
    const stlContent = exportSTL(model)
    
    // Create blob from ArrayBuffer
    const blob = new Blob([stlContent], { type: 'model/stl' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error generating STL:', error)
    throw error
  }
}