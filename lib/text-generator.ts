/**
 * Simple text generation for 3D models
 * Creates basic letter shapes for labels
 */

import { primitives, transforms, booleans } from '@jscad/modeling'

const { cuboid } = primitives
const { translate, rotateZ } = transforms
const { union } = booleans

// Type for JSCAD geometry
type JscadGeometry = object

/**
 * Simple letter definitions using basic shapes
 * Each letter is defined as a series of rectangles
 */
const letterShapes: Record<string, Array<[number, number, number, number]>> = {
  // x, y, width, height for each rectangle that makes up the letter
  'A': [
    [-0.3, 0, 0.15, 1],      // Left vertical
    [0.15, 0, 0.15, 1],      // Right vertical
    [-0.15, 0.35, 0.3, 0.15] // Horizontal bar
  ],
  'B': [
    [-0.3, 0, 0.15, 1],       // Left vertical
    [-0.15, 0.35, 0.3, 0.15], // Top horizontal
    [-0.15, -0.35, 0.3, 0.15], // Bottom horizontal
    [-0.15, 0, 0.3, 0.15],    // Middle horizontal
    [0.15, 0.2, 0.15, 0.3],   // Top right vertical
    [0.15, -0.2, 0.15, 0.3]   // Bottom right vertical
  ],
  'C': [
    [-0.3, 0, 0.15, 1],       // Left vertical
    [-0.15, 0.35, 0.3, 0.15], // Top horizontal
    [-0.15, -0.35, 0.3, 0.15] // Bottom horizontal
  ],
  'D': [
    [-0.3, 0, 0.15, 1],       // Left vertical
    [-0.15, 0.35, 0.25, 0.15], // Top horizontal
    [-0.15, -0.35, 0.25, 0.15], // Bottom horizontal
    [0.1, 0, 0.15, 0.7]       // Right vertical
  ],
  'E': [
    [-0.3, 0, 0.15, 1],       // Left vertical
    [-0.15, 0.35, 0.3, 0.15], // Top horizontal
    [-0.15, -0.35, 0.3, 0.15], // Bottom horizontal
    [-0.15, 0, 0.25, 0.15]    // Middle horizontal
  ],
  'F': [
    [-0.3, 0, 0.15, 1],       // Left vertical
    [-0.15, 0.35, 0.3, 0.15], // Top horizontal
    [-0.15, 0, 0.25, 0.15]    // Middle horizontal
  ],
  'G': [
    [-0.3, 0, 0.15, 1],       // Left vertical
    [-0.15, 0.35, 0.3, 0.15], // Top horizontal
    [-0.15, -0.35, 0.3, 0.15], // Bottom horizontal
    [0.15, -0.15, 0.15, 0.4], // Right vertical
    [0, -0.05, 0.15, 0.15]    // Inner horizontal
  ],
  'H': [
    [-0.3, 0, 0.15, 1],       // Left vertical
    [0.15, 0, 0.15, 1],       // Right vertical
    [-0.15, 0, 0.3, 0.15]     // Middle horizontal
  ],
  'I': [
    [0, 0, 0.15, 1],          // Center vertical
    [-0.2, 0.35, 0.4, 0.15],  // Top horizontal
    [-0.2, -0.35, 0.4, 0.15]  // Bottom horizontal
  ],
  'J': [
    [0.15, 0.1, 0.15, 0.8],   // Right vertical
    [-0.3, -0.25, 0.15, 0.3], // Left bottom
    [-0.15, -0.35, 0.3, 0.15] // Bottom horizontal
  ],
  'K': [
    [-0.3, 0, 0.15, 1],       // Left vertical
    [0.1, 0.25, 0.15, 0.4],   // Top diagonal
    [0.1, -0.25, 0.15, 0.4]   // Bottom diagonal
  ],
  'L': [
    [-0.3, 0, 0.15, 1],       // Left vertical
    [-0.15, -0.35, 0.4, 0.15] // Bottom horizontal
  ],
  'M': [
    [-0.3, 0, 0.15, 1],       // Left vertical
    [0.3, 0, 0.15, 1],        // Right vertical
    [-0.1, 0.2, 0.1, 0.4],    // Left diagonal
    [0.1, 0.2, 0.1, 0.4]      // Right diagonal
  ],
  'N': [
    [-0.3, 0, 0.15, 1],       // Left vertical
    [0.3, 0, 0.15, 1],        // Right vertical
    [0, 0, 0.2, 0.8]          // Diagonal
  ],
  'O': [
    [-0.3, 0, 0.15, 1],       // Left vertical
    [0.3, 0, 0.15, 1],        // Right vertical
    [-0.15, 0.35, 0.3, 0.15], // Top horizontal
    [-0.15, -0.35, 0.3, 0.15] // Bottom horizontal
  ],
  'P': [
    [-0.3, 0, 0.15, 1],       // Left vertical
    [-0.15, 0.35, 0.3, 0.15], // Top horizontal
    [-0.15, 0, 0.3, 0.15],    // Middle horizontal
    [0.15, 0.175, 0.15, 0.35] // Right top vertical
  ],
  'Q': [
    [-0.3, 0, 0.15, 0.9],     // Left vertical
    [0.3, 0, 0.15, 0.9],      // Right vertical
    [-0.15, 0.35, 0.3, 0.15], // Top horizontal
    [-0.15, -0.3, 0.3, 0.15], // Bottom horizontal
    [0.2, -0.4, 0.2, 0.1]     // Tail
  ],
  'R': [
    [-0.3, 0, 0.15, 1],       // Left vertical
    [-0.15, 0.35, 0.3, 0.15], // Top horizontal
    [-0.15, 0, 0.3, 0.15],    // Middle horizontal
    [0.15, 0.175, 0.15, 0.35], // Right top vertical
    [0.15, -0.2, 0.15, 0.4]   // Right bottom diagonal
  ],
  'S': [
    [-0.15, 0.35, 0.4, 0.15], // Top horizontal
    [-0.3, 0.15, 0.15, 0.3],  // Top left vertical
    [-0.15, 0, 0.3, 0.15],    // Middle horizontal
    [0.15, -0.15, 0.15, 0.3], // Bottom right vertical
    [-0.15, -0.35, 0.4, 0.15] // Bottom horizontal
  ],
  'T': [
    [0, 0, 0.15, 1],          // Center vertical
    [-0.3, 0.35, 0.6, 0.15]   // Top horizontal
  ],
  'U': [
    [-0.3, 0.05, 0.15, 0.9],  // Left vertical
    [0.3, 0.05, 0.15, 0.9],   // Right vertical
    [-0.15, -0.35, 0.3, 0.15] // Bottom horizontal
  ],
  'V': [
    [-0.3, 0.1, 0.15, 0.8],   // Left diagonal
    [0.3, 0.1, 0.15, 0.8],    // Right diagonal
    [0, -0.3, 0.15, 0.2]      // Bottom point
  ],
  'W': [
    [-0.4, 0.05, 0.12, 0.9],  // Left vertical
    [-0.15, -0.1, 0.12, 0.6], // Left middle
    [0.15, -0.1, 0.12, 0.6],  // Right middle
    [0.4, 0.05, 0.12, 0.9],   // Right vertical
    [0, -0.35, 0.3, 0.12]     // Bottom connector
  ],
  'X': [
    [-0.2, 0.2, 0.15, 0.5],   // Top left diagonal
    [0.2, 0.2, 0.15, 0.5],    // Top right diagonal
    [-0.2, -0.2, 0.15, 0.5],  // Bottom left diagonal
    [0.2, -0.2, 0.15, 0.5]    // Bottom right diagonal
  ],
  'Y': [
    [-0.3, 0.2, 0.15, 0.5],   // Top left diagonal
    [0.3, 0.2, 0.15, 0.5],    // Top right diagonal
    [0, -0.15, 0.15, 0.5]     // Bottom vertical
  ],
  'Z': [
    [-0.25, 0.35, 0.5, 0.15], // Top horizontal
    [-0.25, -0.35, 0.5, 0.15], // Bottom horizontal
    [0, 0, 0.3, 0.7]          // Diagonal
  ],
  // Numbers
  '0': [
    [-0.25, 0, 0.15, 0.9],    // Left vertical
    [0.25, 0, 0.15, 0.9],     // Right vertical
    [-0.1, 0.35, 0.2, 0.15],  // Top horizontal
    [-0.1, -0.35, 0.2, 0.15]  // Bottom horizontal
  ],
  '1': [
    [0, 0, 0.15, 1],          // Center vertical
    [-0.15, 0.25, 0.15, 0.15] // Top serif
  ],
  '2': [
    [-0.2, 0.35, 0.4, 0.15],  // Top horizontal
    [0.15, 0.15, 0.15, 0.3],  // Right top vertical
    [-0.15, 0, 0.3, 0.15],    // Middle horizontal
    [-0.2, -0.15, 0.15, 0.3], // Left bottom vertical
    [-0.2, -0.35, 0.4, 0.15]  // Bottom horizontal
  ],
  '3': [
    [-0.2, 0.35, 0.4, 0.15],  // Top horizontal
    [0.15, 0.1, 0.15, 0.4],   // Right top vertical
    [-0.1, 0, 0.25, 0.15],    // Middle horizontal
    [0.15, -0.1, 0.15, 0.4],  // Right bottom vertical
    [-0.2, -0.35, 0.4, 0.15]  // Bottom horizontal
  ],
  '4': [
    [-0.2, 0.2, 0.15, 0.5],   // Left vertical top
    [0.2, 0, 0.15, 1],        // Right vertical full
    [-0.2, -0.05, 0.4, 0.15]  // Horizontal bar
  ],
  '5': [
    [-0.2, 0.35, 0.4, 0.15],  // Top horizontal
    [-0.2, 0.15, 0.15, 0.3],  // Left top vertical
    [-0.2, 0, 0.35, 0.15],    // Middle horizontal
    [0.15, -0.15, 0.15, 0.3], // Right bottom vertical
    [-0.2, -0.35, 0.4, 0.15]  // Bottom horizontal
  ],
  '6': [
    [-0.2, 0, 0.15, 0.9],     // Left vertical
    [-0.05, 0.35, 0.25, 0.15], // Top horizontal
    [-0.05, 0, 0.25, 0.15],   // Middle horizontal
    [0.15, -0.175, 0.15, 0.35], // Right bottom vertical
    [-0.05, -0.35, 0.2, 0.15] // Bottom horizontal
  ],
  '7': [
    [-0.25, 0.35, 0.5, 0.15], // Top horizontal
    [0.1, -0.05, 0.15, 0.8]   // Diagonal
  ],
  '8': [
    [-0.2, 0.1, 0.15, 0.4],   // Left top vertical
    [-0.2, -0.1, 0.15, 0.4],  // Left bottom vertical
    [0.2, 0.1, 0.15, 0.4],    // Right top vertical
    [0.2, -0.1, 0.15, 0.4],   // Right bottom vertical
    [-0.05, 0.35, 0.1, 0.15], // Top horizontal
    [-0.05, 0, 0.1, 0.15],    // Middle horizontal
    [-0.05, -0.35, 0.1, 0.15] // Bottom horizontal
  ],
  '9': [
    [0.2, 0, 0.15, 0.9],      // Right vertical
    [-0.05, 0.35, 0.25, 0.15], // Top horizontal
    [-0.05, 0, 0.25, 0.15],   // Middle horizontal
    [-0.2, 0.175, 0.15, 0.35], // Left top vertical
    [-0.05, -0.35, 0.25, 0.15] // Bottom horizontal
  ],
  // Special characters
  '.': [
    [0, -0.35, 0.15, 0.15]    // Period
  ],
  '-': [
    [-0.2, 0, 0.4, 0.15]      // Hyphen
  ],
  '+': [
    [0, 0, 0.15, 0.6],        // Vertical
    [-0.3, 0, 0.6, 0.15]      // Horizontal
  ],
  '/': [
    [0, 0, 0.15, 1]           // Diagonal (simplified)
  ],
  '_': [
    [-0.3, -0.35, 0.6, 0.15]  // Underscore
  ],
  ' ': []                      // Space (no geometry)
}

/**
 * Create a single letter as 3D geometry
 */
function createLetter(
  letter: string, 
  fontSize: number, 
  depth: number
): JscadGeometry | null {
  const upperLetter = letter.toUpperCase()
  const shapes = letterShapes[upperLetter]
  
  if (!shapes || shapes.length === 0) {
    return null
  }
  
  const parts: JscadGeometry[] = shapes.map(([x, y, w, h]) => {
    const cube = cuboid({
      size: [w * fontSize, h * fontSize, Math.abs(depth)]
    })
    return translate([x * fontSize, y * fontSize, 0], cube)
  })
  
  return parts.length === 1 ? parts[0] : union(...parts)
}

/**
 * Create text as 3D geometry
 */
export function createText(
  text: string,
  fontSize: number = 3,
  depth: number = 0.5,
  spacing: number = 0.7
): JscadGeometry | null {
  const letters: JscadGeometry[] = []
  let xOffset = 0
  
  for (const char of text) {
    const letter = createLetter(char, fontSize, depth)
    if (letter) {
      const positioned = translate([xOffset, 0, 0], letter)
      letters.push(positioned)
    }
    xOffset += fontSize * spacing
  }
  
  if (letters.length === 0) {
    return null
  }
  
  return letters.length === 1 ? letters[0] : union(...letters)
}

/**
 * Create text at a specific position with rotation
 */
export function createPositionedText(
  text: string,
  x: number,
  y: number,
  z: number,
  rotation: number = 0,
  fontSize: number = 3,
  depth: number = 0.5
): JscadGeometry | null {
  const textGeometry = createText(text, fontSize, depth)
  
  if (!textGeometry) {
    return null
  }
  
  // Apply rotation and position
  let positioned = textGeometry
  if (rotation !== 0) {
    positioned = rotateZ((rotation * Math.PI) / 180, positioned)
  }
  positioned = translate([x, y, z], positioned)
  
  return positioned
}

/**
 * Create multiple labels for a board
 */
export function createLabels(
  labels: Array<{
    text: string
    x: number
    y: number
    z: number
    fontSize?: number
    depth?: number
    rotation?: number
  }>,
  boardWidth: number,
  boardHeight: number
): JscadGeometry[] {
  const labelGeometries: JscadGeometry[] = []
  
  for (const label of labels) {
    // Convert from board coordinates (top-left origin) to centered coordinates
    const centerX = label.x - boardWidth / 2
    const centerY = label.y - boardHeight / 2
    
    const textGeom = createPositionedText(
      label.text,
      centerX,
      centerY,
      label.z,
      label.rotation || 0,
      label.fontSize || 3,
      label.depth || 0.5
    )
    
    if (textGeom) {
      labelGeometries.push(textGeom)
    }
  }
  
  return labelGeometries
}