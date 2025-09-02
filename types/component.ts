export interface ComponentDimensions {
  length: number
  width: number
  height: number
  diameter?: number
}

export interface LeadConfig {
  spacing: number
  diameter: number
  configuration: 'radial' | 'axial' | 'inline'
  countersink?: boolean
  countersinkDiameter?: number // Default: lead diameter * 1.8
  countersinkAngle?: number // Default: 82 degrees
}

export interface CrossoverComponent {
  id?: string
  brand: string
  series: string
  part_type: 'capacitor' | 'resistor' | 'inductor'
  value: string
  tolerance?: string
  voltage?: string
  dimensions: ComponentDimensions
  lead_config: LeadConfig
  source?: string
  verified?: boolean
  datasheet_url?: string
  notes?: string
}