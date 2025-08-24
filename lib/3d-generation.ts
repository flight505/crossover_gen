import { booleans, primitives, transforms } from '@jscad/modeling'
import { serialize as serializeSTL } from '@jscad/stl-serializer'
import { PlacedComponent } from '@/types'

const { cube, cylinder } = primitives
const { translate, rotateZ } = transforms
const { subtract } = booleans

export interface BoardDimensions {
  width: number
  height: number
  thickness: number
}

export function generate3DModel(
  placedComponents: PlacedComponent[],
  boardDimensions: BoardDimensions
): any {
  // Create the base board
  let baseBoard = cube({
    size: [boardDimensions.width, boardDimensions.height, boardDimensions.thickness]
  })

  // Move board to center on origin
  baseBoard = translate(
    [boardDimensions.width / 2, boardDimensions.height / 2, boardDimensions.thickness / 2],
    baseBoard
  )

  const cutouts: any[] = []

  for (const placed of placedComponents) {
    const { component, x, y, rotation } = placed
    const dims = component.dimensions

    // Calculate component dimensions based on actual data format
    const width = component.body_diameter_mm || component.body_length_mm || dims.length || 10
    const height = component.body_diameter_mm || dims.width || 10

    // Create component recess (2-3mm deep)
    const recessDepth = Math.min(2.5, boardDimensions.thickness - 0.5)
    let recess: any

    if (component.body_diameter_mm) {
      // Cylindrical component
      recess = cylinder({
        radius: component.body_diameter_mm / 2 + 0.5, // Add 0.5mm clearance
        height: recessDepth
      })
    } else {
      // Rectangular component
      recess = cube({
        size: [width + 1, height + 1, recessDepth] // Add 1mm clearance
      })
      recess = translate([width / 2 + 0.5, height / 2 + 0.5, 0], recess)
    }

    // Position the recess
    recess = translate([x + width / 2, y + height / 2, boardDimensions.thickness - recessDepth], recess)

    // Apply rotation if any
    if (rotation !== 0) {
      recess = rotateZ((rotation * Math.PI) / 180, recess)
    }

    cutouts.push(recess)

    // Add lead holes for components with lead information
    if (component.lead_diameter_mm && component.body_diameter_mm) {
      const leadDiameter = component.lead_diameter_mm
      const holeRadius = (leadDiameter + 0.2) / 2 // Add 0.2mm clearance
      const spacing = component.body_diameter_mm * 0.8 // Estimate spacing

      // Create two lead holes
      const hole1 = cylinder({
        radius: holeRadius,
        height: boardDimensions.thickness + 1 // Through-hole
      })
      const hole2 = cylinder({
        radius: holeRadius,
        height: boardDimensions.thickness + 1
      })

      // Position lead holes relative to component center
      let leadHole1 = translate([x + width / 2 - spacing / 2, y + height / 2, -0.5], hole1)
      let leadHole2 = translate([x + width / 2 + spacing / 2, y + height / 2, -0.5], hole2)

      // Apply rotation to lead holes
      if (rotation !== 0) {
        const centerX = x + width / 2
        const centerY = y + height / 2
        leadHole1 = translate([-centerX, -centerY, 0], leadHole1)
        leadHole1 = rotateZ((rotation * Math.PI) / 180, leadHole1)
        leadHole1 = translate([centerX, centerY, 0], leadHole1)

        leadHole2 = translate([-centerX, -centerY, 0], leadHole2)
        leadHole2 = rotateZ((rotation * Math.PI) / 180, leadHole2)
        leadHole2 = translate([centerX, centerY, 0], leadHole2)
      }

      cutouts.push(leadHole1, leadHole2)
    }
  }

  // Subtract all cutouts from the base board
  let finalModel = baseBoard
  if (cutouts.length > 0) {
    finalModel = subtract(finalModel, ...cutouts)
  }

  return finalModel
}

export function exportSTL(model: any): string {
  const stlData = serializeSTL({}, model)
  return stlData
}

export function downloadSTL(model: any, filename: string = 'crossover-plate.stl'): void {
  const stlContent = exportSTL(model)
  
  const blob = new Blob([stlContent], { type: 'application/sla' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}