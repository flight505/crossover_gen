import enrichedComponents from '@/data/crossover_parts_verified_enriched.json'
import { Component3D } from '@/lib/store/designer-store'

export interface EnrichedComponentData {
  brand: string
  series: string
  part_type: 'capacitor' | 'resistor' | 'inductor'
  value: number
  value_unit: string
  voltage_or_power: number | null
  body_shape: 'cylinder' | 'coil' | 'rectangular'
  body_diameter_mm: number | null
  body_length_mm: number | null
  outer_diameter_mm: number | null
  inner_diameter_mm: number | null
  height_mm: number | null
  body_width_mm: number | null
  body_height_mm: number | null
  lead_diameter_mm: number | null
  lead_length_mm: number | null
  wire_diameter_mm: number | null
  wire_awg: number | null
  lead_exit: 'axial' | 'radial' | 'tangential' | null
  lead_configuration: 'axial' | 'radial'
  suggested_hole_diameter_mm: number
  end_inset_mm: number | null
  lead_pattern?: 'adjacent' | 'opposite'
  lead_angle_center_deg?: number
  lead_angle_outer_deg?: number
  hole_edge_offset_mm?: number
  lead_spacing_mm?: number
  tolerance: string | null
  notes: string | null
  source_url: string | null
}

// Create a map for quick lookup
const componentMap = new Map<string, EnrichedComponentData>()

enrichedComponents.forEach((comp) => {
  const typedComp = comp as unknown as EnrichedComponentData
  const key = `${typedComp.brand}-${typedComp.series}-${typedComp.value}${typedComp.value_unit}`
  componentMap.set(key, typedComp)
})

export function getComponentData(brand: string, series: string, value: number, valueUnit: string): EnrichedComponentData | undefined {
  const key = `${brand}-${series}-${value}${valueUnit}`
  return componentMap.get(key)
}

export function getAllComponents(): EnrichedComponentData[] {
  return enrichedComponents as EnrichedComponentData[]
}

export function getComponentsByType(type: 'capacitor' | 'resistor' | 'inductor'): EnrichedComponentData[] {
  return enrichedComponents.filter((comp) => (comp as unknown as EnrichedComponentData).part_type === type) as unknown as EnrichedComponentData[]
}

export function createComponent3D(componentData: EnrichedComponentData, position: [number, number, number] = [0, 5, 0]): Partial<Component3D> {
  // Calculate dimensions based on body shape
  let dimensions: Component3D['dimensions'] = {}
  
  if (componentData.body_shape === 'cylinder') {
    dimensions = {
      diameter: componentData.body_diameter_mm || 10,
      length: componentData.body_length_mm || 20,
      height: componentData.body_diameter_mm || 10
    }
  } else if (componentData.body_shape === 'coil') {
    dimensions = {
      outer_diameter: componentData.outer_diameter_mm || 30,
      inner_diameter: componentData.inner_diameter_mm || 15,
      height: componentData.height_mm || 20
    }
  } else if (componentData.body_shape === 'rectangular') {
    dimensions = {
      width: componentData.body_width_mm || 20,
      height: componentData.body_height_mm || 10,
      length: componentData.body_length_mm || 30,
      depth: componentData.body_length_mm || 30
    }
  }
  
  return {
    componentId: `${componentData.brand}-${componentData.series}-${componentData.value}${componentData.value_unit}`,
    position,
    rotation: [0, 0, 0],
    selected: false,
    brand: componentData.brand,
    series: componentData.series,
    part_type: componentData.part_type,
    value: componentData.value,
    value_unit: componentData.value_unit,
    body_shape: componentData.body_shape,
    dimensions,
    lead_configuration: componentData.lead_configuration,
    suggested_hole_diameter_mm: componentData.suggested_hole_diameter_mm,
    end_inset_mm: componentData.end_inset_mm || undefined,
    lead_pattern: componentData.lead_pattern,
    lead_spacing_mm: componentData.lead_spacing_mm,
  }
}

// Calculate lead hole positions based on component data
export function calculateLeadHolePositions(
  component: Component3D
): Array<{ x: number; z: number; diameter: number }> {
  const holes: Array<{ x: number; z: number; diameter: number }> = []
  const holeDiameter = component.suggested_hole_diameter_mm || 1.5
  
  if (component.lead_configuration === 'axial') {
    // Axial components have leads at both ends
    // For axial components, the length is the actual body length
    const bodyLength = component.dimensions.length || 20
    const inset = component.end_inset_mm || 2
    
    // Lead holes are positioned at the ends of the component body, minus the inset
    holes.push(
      { x: -(bodyLength / 2 - inset), z: 0, diameter: holeDiameter },
      { x: bodyLength / 2 - inset, z: 0, diameter: holeDiameter }
    )
  } else if (component.lead_configuration === 'radial') {
    // Radial components (like coils) have different lead patterns
    if (component.body_shape === 'coil') {
      const innerRadius = (component.dimensions.inner_diameter || 15) / 2
      
      if (component.lead_pattern === 'adjacent') {
        // Leads exit at adjacent positions
        const angle1 = 0
        const angle2 = Math.PI / 4 // 45 degrees
        holes.push(
          { 
            x: innerRadius * Math.cos(angle1), 
            z: innerRadius * Math.sin(angle1), 
            diameter: holeDiameter 
          },
          { 
            x: innerRadius * Math.cos(angle2), 
            z: innerRadius * Math.sin(angle2), 
            diameter: holeDiameter 
          }
        )
      } else {
        // Default: opposite sides
        holes.push(
          { x: innerRadius, z: 0, diameter: holeDiameter },
          { x: -innerRadius, z: 0, diameter: holeDiameter }
        )
      }
    } else {
      // Other radial components
      const spacing = component.lead_spacing_mm || 5
      holes.push(
        { x: -spacing / 2, z: 0, diameter: holeDiameter },
        { x: spacing / 2, z: 0, diameter: holeDiameter }
      )
    }
  }
  
  return holes
}