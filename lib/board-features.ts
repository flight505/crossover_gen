/**
 * Additional board features like standoffs and zip-tie slots
 */

import { primitives, transforms, booleans } from '@jscad/modeling'

const { cuboid, cylinder, cylinderElliptic } = primitives
const { translate, rotateZ, rotateY } = transforms
const { union } = booleans

// Type for JSCAD geometry
type JscadGeometry = object

/**
 * Create a standoff (raised mounting post)
 */
export function createStandoff(
  x: number,
  y: number,
  height: number = 5,
  outerDiameter: number = 8,
  holeDiameter: number = 3.2, // M3 clearance
  threadDepth: number = 10
): { standoff: JscadGeometry; hole: JscadGeometry } {
  // Create the standoff cylinder
  const standoff = cylinder({
    radius: outerDiameter / 2,
    height,
    segments: 32
  })
  
  // Create the screw hole (extends into the board)
  const hole = cylinder({
    radius: holeDiameter / 2,
    height: height + threadDepth,
    segments: 16
  })
  
  return {
    standoff: translate([x, y, height / 2], standoff),
    hole: translate([x, y, (height + threadDepth) / 2 - threadDepth], hole)
  }
}

/**
 * Create a zip-tie slot
 */
export function createZipTieSlot(
  x: number,
  y: number,
  width: number = 3,
  length: number = 8,
  depth: number = 2,
  rotation: number = 0
): JscadGeometry {
  // Create an elongated slot for zip-ties
  let slot = cuboid({
    size: [length, width, depth]
  })
  
  // Add rounded ends for easier zip-tie insertion
  const endRadius = width / 2
  const leftEnd = cylinder({
    radius: endRadius,
    height: depth,
    segments: 16
  })
  const rightEnd = cylinder({
    radius: endRadius,
    height: depth,
    segments: 16
  })
  
  slot = union(
    slot,
    translate([-(length / 2 - endRadius), 0, 0], leftEnd),
    translate([(length / 2 - endRadius), 0, 0], rightEnd)
  )
  
  // Apply rotation if needed
  if (rotation !== 0) {
    slot = rotateZ((rotation * Math.PI) / 180, slot)
  }
  
  // Position the slot
  return translate([x, y, depth / 2], slot)
}

/**
 * Create cable management channels
 */
export function createCableChannel(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  width: number = 3,
  depth: number = 2
): JscadGeometry {
  const length = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2))
  const angle = Math.atan2(endY - startY, endX - startX)
  
  let channel = cuboid({
    size: [length, width, depth]
  })
  
  // Rotate to align with the path
  channel = rotateZ(angle, channel)
  
  // Position at the midpoint
  const midX = (startX + endX) / 2
  const midY = (startY + endY) / 2
  
  return translate([midX, midY, depth / 2], channel)
}

/**
 * Create edge filleting for smoother board edges
 */
export function createEdgeFillet(
  boardWidth: number,
  boardHeight: number,
  boardThickness: number,
  radius: number = 1
): JscadGeometry[] {
  const fillets: JscadGeometry[] = []
  
  // Create quarter-cylinder fillets for each edge
  const edgeLength = Math.max(boardWidth, boardHeight)
  
  // Top edges
  const topEdgeFillet = cylinderElliptic({
    height: edgeLength,
    startRadius: [radius, radius],
    endRadius: [radius, radius],
    segments: 16
  })
  
  // Top edge fillets
  fillets.push(
    translate(
      [-boardWidth / 2, -boardHeight / 2 + radius, boardThickness - radius],
      rotateY(Math.PI / 2, topEdgeFillet)
    )
  )
  fillets.push(
    translate(
      [-boardWidth / 2, boardHeight / 2 - radius, boardThickness - radius],
      rotateY(Math.PI / 2, topEdgeFillet)
    )
  )
  fillets.push(
    translate(
      [-boardWidth / 2 + radius, -boardHeight / 2, boardThickness - radius],
      rotateY(Math.PI / 2, rotateZ(Math.PI / 2, topEdgeFillet))
    )
  )
  fillets.push(
    translate(
      [boardWidth / 2 - radius, -boardHeight / 2, boardThickness - radius],
      rotateY(Math.PI / 2, rotateZ(Math.PI / 2, topEdgeFillet))
    )
  )
  
  return fillets
}

/**
 * Create ventilation holes pattern
 */
export function createVentilationHoles(
  centerX: number,
  centerY: number,
  pattern: 'grid' | 'hexagon' = 'grid',
  holeDiameter: number = 3,
  spacing: number = 8,
  rows: number = 3,
  cols: number = 3
): JscadGeometry[] {
  const holes: JscadGeometry[] = []
  
  if (pattern === 'grid') {
    const startX = centerX - (cols - 1) * spacing / 2
    const startY = centerY - (rows - 1) * spacing / 2
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const hole = cylinder({
          radius: holeDiameter / 2,
          height: 20, // Make it tall enough to go through
          segments: 16
        })
        holes.push(
          translate([
            startX + col * spacing,
            startY + row * spacing,
            0
          ], hole)
        )
      }
    }
  } else if (pattern === 'hexagon') {
    // Hexagonal pattern for better airflow
    const hexRadius = spacing
    for (let i = 0; i < 7; i++) {
      const angle = (i * 60 * Math.PI) / 180
      const x = i === 0 ? centerX : centerX + hexRadius * Math.cos(angle)
      const y = i === 0 ? centerY : centerY + hexRadius * Math.sin(angle)
      
      const hole = cylinder({
        radius: holeDiameter / 2,
        height: 20,
        segments: 16
      })
      holes.push(translate([x, y, 0], hole))
    }
  }
  
  return holes
}

/**
 * Add all board features to the IGS
 */
export interface BoardFeatureOptions {
  standoffs?: Array<{
    x: number
    y: number
    height?: number
    outerDiameter?: number
    holeDiameter?: number
  }>
  zipTieSlots?: Array<{
    x: number
    y: number
    width?: number
    length?: number
    rotation?: number
  }>
  cableChannels?: Array<{
    startX: number
    startY: number
    endX: number
    endY: number
    width?: number
    depth?: number
  }>
  ventilationPatterns?: Array<{
    centerX: number
    centerY: number
    pattern?: 'grid' | 'hexagon'
    holeDiameter?: number
    spacing?: number
    rows?: number
    cols?: number
  }>
  edgeFillet?: {
    enabled: boolean
    radius?: number
  }
}

/**
 * Process all board features
 */
export function processBoardFeatures(
  boardWidth: number,
  boardHeight: number,
  boardThickness: number,
  features: BoardFeatureOptions
): {
  additions: JscadGeometry[]
  subtractions: JscadGeometry[]
} {
  const additions: JscadGeometry[] = []
  const subtractions: JscadGeometry[] = []
  
  // Process standoffs
  if (features.standoffs) {
    for (const standoffConfig of features.standoffs) {
      const { standoff, hole } = createStandoff(
        standoffConfig.x - boardWidth / 2,
        standoffConfig.y - boardHeight / 2,
        standoffConfig.height,
        standoffConfig.outerDiameter,
        standoffConfig.holeDiameter
      )
      additions.push(standoff)
      subtractions.push(hole)
    }
  }
  
  // Process zip-tie slots
  if (features.zipTieSlots) {
    for (const slotConfig of features.zipTieSlots) {
      const slot = createZipTieSlot(
        slotConfig.x - boardWidth / 2,
        slotConfig.y - boardHeight / 2,
        slotConfig.width,
        slotConfig.length,
        boardThickness, // Go through the board
        slotConfig.rotation
      )
      subtractions.push(slot)
    }
  }
  
  // Process cable channels  
  if (features.cableChannels) {
    for (const channelConfig of features.cableChannels) {
      const channel = createCableChannel(
        channelConfig.startX - boardWidth / 2,
        channelConfig.startY - boardHeight / 2,
        channelConfig.endX - boardWidth / 2,
        channelConfig.endY - boardHeight / 2,
        channelConfig.width,
        channelConfig.depth
      )
      subtractions.push(channel)
    }
  }
  
  // Process ventilation patterns
  if (features.ventilationPatterns) {
    for (const ventConfig of features.ventilationPatterns) {
      const holes = createVentilationHoles(
        ventConfig.centerX - boardWidth / 2,
        ventConfig.centerY - boardHeight / 2,
        ventConfig.pattern,
        ventConfig.holeDiameter,
        ventConfig.spacing,
        ventConfig.rows,
        ventConfig.cols
      )
      subtractions.push(...holes)
    }
  }
  
  // Process edge filleting
  if (features.edgeFillet?.enabled) {
    const fillets = createEdgeFillet(
      boardWidth,
      boardHeight,
      boardThickness,
      features.edgeFillet.radius
    )
    additions.push(...fillets)
  }
  
  return { additions, subtractions }
}