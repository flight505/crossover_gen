/**
 * Intermediate Geometry Specification (IGS)
 * 
 * IGS is the standardized data structure that bridges the UI state
 * and the 3D model generation. It provides a clear contract for
 * what data is needed to generate a complete 3D model.
 */

import { PlacedComponent } from '@/types'

export interface MountingHole {
  x: number
  y: number
  diameter: number
  depth?: number // Optional, defaults to through-hole
  countersink?: boolean
  countersinkDiameter?: number
  countersinkAngle?: number // degrees, typically 82 or 90
}

export interface Label {
  id: string
  text: string
  x: number
  y: number
  z?: number // For positioning on top/bottom
  fontSize: number
  fontDepth: number // Positive for embossed, negative for engraved
  rotation?: number
  side: 'top' | 'bottom'
  type: 'component-id' | 'component-value' | 'node' | 'custom'
}

export interface WireChannel {
  id: string
  startX: number
  startY: number
  endX: number
  endY: number
  width: number
  depth: number
  side: 'bottom'
}

export interface BoardFeature {
  type: 'zip-tie-slot' | 'standoff' | 'edge-fillet' | 'edge-chamfer'
  parameters: Record<string, unknown>
}

export interface NodeConnection {
  nodeId: string // e.g., 'A', 'B', 'C'
  componentIds: string[] // Components connected to this node
  x: number // Node center position
  y: number
  raised?: boolean // For raised pads on bottom
  padDiameter?: number
}

export interface IGSBoard {
  width: number
  height: number
  thickness: number
  cornerRadius?: number
  mountingHoles?: MountingHole[]
  edgeTreatment?: {
    type: 'none' | 'fillet' | 'chamfer'
    radius?: number
  }
}

export interface IGS {
  version: string // IGS version for compatibility
  board: IGSBoard
  components: PlacedComponent[]
  labels: Label[]
  features: BoardFeature[]
  wireChannels?: WireChannel[]
  nodeConnections?: NodeConnection[]
  metadata?: {
    generatedAt: string
    projectName?: string
    author?: string
    notes?: string
  }
}

export interface IGSValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Validates an IGS structure for 3D generation
 */
export function validateIGS(igs: IGS): IGSValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Validate board dimensions
  if (igs.board.width <= 0 || igs.board.height <= 0) {
    errors.push('Board dimensions must be positive')
  }
  if (igs.board.thickness <= 0) {
    errors.push('Board thickness must be positive')
  }
  if (igs.board.thickness < 3) {
    warnings.push('Board thickness < 3mm may be too thin for components')
  }

  // Validate components
  const componentIds = new Set<string>()
  igs.components.forEach((comp, idx) => {
    if (!comp.component.id) {
      errors.push(`Component at index ${idx} has no ID`)
    } else {
      if (componentIds.has(comp.component.id)) {
        errors.push(`Duplicate component ID: ${comp.component.id}`)
      }
      componentIds.add(comp.component.id)
    }

    // Check if component is within board bounds
    const halfWidth = (comp.component.dimensions.diameter || comp.component.dimensions.length || 0) / 2
    const halfHeight = (comp.component.dimensions.diameter || comp.component.dimensions.width || 0) / 2
    
    if (comp.x - halfWidth < 0 || comp.x + halfWidth > igs.board.width) {
      warnings.push(`Component ${comp.component.id} may extend beyond board width`)
    }
    if (comp.y - halfHeight < 0 || comp.y + halfHeight > igs.board.height) {
      warnings.push(`Component ${comp.component.id} may extend beyond board height`)
    }

    // Check for lead holes near edge (minimum 2mm clearance)
    const minEdgeClearance = 2
    if (comp.component.lead_config) {
      const leadRadius = comp.component.lead_config.diameter / 2
      const clearance = leadRadius + minEdgeClearance
      
      if (comp.x < clearance || comp.x > igs.board.width - clearance ||
          comp.y < clearance || comp.y > igs.board.height - clearance) {
        warnings.push(`Component ${comp.component.id} lead holes may be too close to board edge`)
      }
    }
  })

  // Check for component overlaps
  for (let i = 0; i < igs.components.length; i++) {
    for (let j = i + 1; j < igs.components.length; j++) {
      const comp1 = igs.components[i]
      const comp2 = igs.components[j]
      
      const dist = Math.sqrt(
        Math.pow(comp1.x - comp2.x, 2) + 
        Math.pow(comp1.y - comp2.y, 2)
      )
      
      const minDist = 3 // 3mm minimum clearance
      const comp1Size = Math.max(
        comp1.component.dimensions.diameter || 0,
        comp1.component.dimensions.length || 0,
        comp1.component.dimensions.width || 0
      )
      const comp2Size = Math.max(
        comp2.component.dimensions.diameter || 0,
        comp2.component.dimensions.length || 0,
        comp2.component.dimensions.width || 0
      )
      
      if (dist < (comp1Size + comp2Size) / 2 + minDist) {
        warnings.push(`Components ${comp1.component.id} and ${comp2.component.id} may be too close`)
      }
    }
  }

  // Validate mounting holes
  igs.board.mountingHoles?.forEach((hole, idx) => {
    if (hole.diameter <= 0) {
      errors.push(`Mounting hole ${idx} has invalid diameter`)
    }
    if (hole.x < 0 || hole.x > igs.board.width || 
        hole.y < 0 || hole.y > igs.board.height) {
      errors.push(`Mounting hole ${idx} is outside board bounds`)
    }
  })

  // Validate labels
  igs.labels.forEach((label, idx) => {
    if (!label.text || label.text.trim() === '') {
      warnings.push(`Label ${idx} has no text`)
    }
    if (label.fontSize <= 0) {
      errors.push(`Label ${idx} has invalid font size`)
    }
  })

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Generates IGS from current canvas state
 */
export function generateIGS(
  components: PlacedComponent[],
  boardWidth: number,
  boardHeight: number,
  boardThickness: number,
  options?: {
    cornerRadius?: number
    mountingHoles?: boolean
    addLabels?: boolean
  }
): IGS {
  const igs: IGS = {
    version: '1.0.0',
    board: {
      width: boardWidth,
      height: boardHeight,
      thickness: boardThickness,
      cornerRadius: options?.cornerRadius || 0
    },
    components: components,
    labels: [],
    features: [],
    metadata: {
      generatedAt: new Date().toISOString()
    }
  }

  // Add default mounting holes if requested
  if (options?.mountingHoles) {
    const holeOffset = 5 // 5mm from corners
    const holeDiameter = 3.2 // Standard M3 clearance hole
    
    igs.board.mountingHoles = [
      { x: holeOffset, y: holeOffset, diameter: holeDiameter, countersink: true },
      { x: boardWidth - holeOffset, y: holeOffset, diameter: holeDiameter, countersink: true },
      { x: holeOffset, y: boardHeight - holeOffset, diameter: holeDiameter, countersink: true },
      { x: boardWidth - holeOffset, y: boardHeight - holeOffset, diameter: holeDiameter, countersink: true }
    ]
  }

  // Add component labels if requested
  if (options?.addLabels) {
    components.forEach((placed, idx) => {
      const comp = placed.component
      
      // Add component ID label
      igs.labels.push({
        id: `label-id-${comp.id}`,
        text: `${comp.part_type[0].toUpperCase()}${idx + 1}`,
        x: placed.x,
        y: placed.y - 10, // Position above component
        fontSize: 3,
        fontDepth: 0.5, // Embossed
        rotation: placed.rotation,
        side: 'top',
        type: 'component-id'
      })
      
      // Add component value label
      igs.labels.push({
        id: `label-value-${comp.id}`,
        text: comp.value,
        x: placed.x,
        y: placed.y + 10, // Position below component
        fontSize: 2.5,
        fontDepth: 0.5,
        rotation: placed.rotation,
        side: 'top',
        type: 'component-value'
      })
    })
  }

  return igs
}

/**
 * Serializes IGS to JSON string
 */
export function serializeIGS(igs: IGS): string {
  return JSON.stringify(igs, null, 2)
}

/**
 * Deserializes IGS from JSON string
 */
export function deserializeIGS(json: string): IGS {
  const igs = JSON.parse(json)
  
  // Validate version compatibility
  if (!igs.version) {
    throw new Error('IGS version not specified')
  }
  
  // Future version migration logic would go here
  
  return igs as IGS
}

/**
 * Checks if two IGS structures are compatible for merging
 */
export function areIGSCompatible(igs1: IGS, igs2: IGS): boolean {
  // Check version compatibility
  const [major1] = igs1.version.split('.')
  const [major2] = igs2.version.split('.')
  
  return major1 === major2
}