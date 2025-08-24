import { CrossoverComponent } from '@/types/component'
import rawComponentsData from '@/data/crossover_parts_verified_seed.json'

interface RawComponent {
  brand: string
  series: string
  part_type: string
  value: number
  value_unit: string
  voltage_or_power: string | null
  body_shape: string
  body_diameter_mm: number | null
  body_length_mm: number | null
  outer_diameter_mm: number | null
  inner_diameter_mm: number | null
  height_mm: number | null
  lead_diameter_mm: number | null
  lead_length_mm: number | null
  wire_diameter_mm: number | null
  wire_awg: number | null
  lead_exit: string
  notes: string | null
  source_url: string
}

function convertRawToComponent(raw: RawComponent): CrossoverComponent {
  // Determine dimensions based on body shape
  const dimensions = {
    length: 0,
    width: 0,
    height: 0,
    diameter: undefined as number | undefined
  }

  if (raw.body_shape === 'cylinder' || raw.body_shape === 'toroid') {
    dimensions.diameter = raw.body_diameter_mm || raw.outer_diameter_mm || 20
    dimensions.length = raw.body_length_mm || dimensions.diameter
    dimensions.width = dimensions.diameter
    dimensions.height = raw.height_mm || raw.body_length_mm || 10
  } else {
    dimensions.length = raw.body_length_mm || 20
    dimensions.width = raw.body_diameter_mm || raw.outer_diameter_mm || 15
    dimensions.height = raw.height_mm || 10
  }

  // Determine lead configuration
  const leadConfig = {
    spacing: 5, // Default spacing
    diameter: raw.lead_diameter_mm || raw.wire_diameter_mm || 0.8,
    configuration: 'radial' as 'radial' | 'axial' | 'inline'
  }

  if (raw.lead_exit === 'axial') {
    leadConfig.configuration = 'axial'
    leadConfig.spacing = dimensions.length
  } else if (raw.lead_exit === 'radial') {
    leadConfig.configuration = 'radial'
    leadConfig.spacing = raw.part_type === 'capacitor' ? 5 : 7.5
  }

  return {
    brand: raw.brand,
    series: raw.series,
    part_type: raw.part_type as 'capacitor' | 'resistor' | 'inductor',
    value: `${raw.value}${raw.value_unit}`,
    tolerance: undefined,
    voltage: raw.voltage_or_power || undefined,
    dimensions,
    lead_config: leadConfig,
    source: raw.source_url,
    verified: true,
    datasheet_url: raw.source_url,
    notes: raw.notes || undefined
  }
}

export function loadComponents(): CrossoverComponent[] {
  return (rawComponentsData as RawComponent[]).map(convertRawToComponent)
}

export function getComponentsByType(type: CrossoverComponent['part_type']): CrossoverComponent[] {
  return loadComponents().filter(component => component.part_type === type)
}

export function getComponentBrands(): string[] {
  const brands = new Set(loadComponents().map(c => c.brand))
  return Array.from(brands).sort()
}

export function getComponentSeries(): string[] {
  const series = new Set(loadComponents().map(c => c.series))
  return Array.from(series).sort()
}