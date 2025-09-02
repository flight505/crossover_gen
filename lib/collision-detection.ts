interface BoundingBox {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

interface ComponentData {
  id: string
  position: [number, number, number]
  dimensions: {
    diameter?: number
    length?: number
    width?: number
    height?: number
    depth?: number
    outer_diameter?: number
    inner_diameter?: number
  }
  body_shape: 'cylinder' | 'coil' | 'rectangular'
}

/**
 * Calculate bounding box for a component
 */
export function getComponentBoundingBox(component: ComponentData): BoundingBox {
  const [x, , z] = component.position
  const { dimensions, body_shape } = component
  
  let width = 0
  let depth = 0
  
  if (body_shape === 'cylinder') {
    // For cylinders, use diameter as width and length as depth
    width = dimensions.diameter || 10
    depth = dimensions.length || 20
  } else if (body_shape === 'coil') {
    // For coils, use outer diameter for both width and depth
    const outerDiameter = dimensions.outer_diameter || 30
    width = outerDiameter
    depth = outerDiameter
  } else {
    // Rectangular
    width = dimensions.width || 20
    depth = dimensions.depth || dimensions.length || 15
  }
  
  // Add 3mm clearance on all sides
  const clearance = 3
  const halfWidth = width / 2 + clearance
  const halfDepth = depth / 2 + clearance
  
  return {
    minX: x - halfWidth,
    maxX: x + halfWidth,
    minZ: z - halfDepth,
    maxZ: z + halfDepth,
  }
}

/**
 * Check if two bounding boxes overlap
 */
export function boxesOverlap(box1: BoundingBox, box2: BoundingBox): boolean {
  return !(
    box1.maxX < box2.minX ||
    box1.minX > box2.maxX ||
    box1.maxZ < box2.minZ ||
    box1.minZ > box2.maxZ
  )
}

/**
 * Check if a component collides with any other components
 */
export function checkCollision(
  component: ComponentData,
  otherComponents: ComponentData[]
): boolean {
  const box = getComponentBoundingBox(component)
  
  for (const other of otherComponents) {
    if (other.id === component.id) continue
    
    const otherBox = getComponentBoundingBox(other)
    if (boxesOverlap(box, otherBox)) {
      return true
    }
  }
  
  return false
}

/**
 * Check if component is within board bounds
 */
export function isWithinBounds(
  component: ComponentData,
  boardWidth: number,
  boardHeight: number
): boolean {
  const box = getComponentBoundingBox(component)
  
  const halfWidth = boardWidth / 2
  const halfHeight = boardHeight / 2
  
  return (
    box.minX >= -halfWidth &&
    box.maxX <= halfWidth &&
    box.minZ >= -halfHeight &&
    box.maxZ <= halfHeight
  )
}

/**
 * Find nearest valid position if current position has collision
 */
export function findNearestValidPosition(
  component: ComponentData,
  otherComponents: ComponentData[],
  boardWidth: number,
  boardHeight: number,
  gridSize: number = 5
): [number, number, number] | null {
  const originalPosition = component.position
  const searchRadius = 50 // Search within 50mm radius
  
  // Try positions in a spiral pattern
  for (let radius = gridSize; radius <= searchRadius; radius += gridSize) {
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
      const x = originalPosition[0] + Math.cos(angle) * radius
      const z = originalPosition[2] + Math.sin(angle) * radius
      
      // Snap to grid
      const snappedX = Math.round(x / gridSize) * gridSize
      const snappedZ = Math.round(z / gridSize) * gridSize
      
      const testComponent = {
        ...component,
        position: [snappedX, originalPosition[1], snappedZ] as [number, number, number]
      }
      
      if (
        !checkCollision(testComponent, otherComponents) &&
        isWithinBounds(testComponent, boardWidth, boardHeight)
      ) {
        return testComponent.position
      }
    }
  }
  
  return null
}