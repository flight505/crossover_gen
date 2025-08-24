import { BoardDimensions, PlacedComponent } from './board'

export interface CrossoverDesign {
  id: string
  name: string
  board: BoardDimensions
  components: PlacedComponent[]
  createdAt: Date
  updatedAt: Date
}

export interface ExportSettings {
  format: 'stl' | 'obj' | 'step'
  resolution: 'low' | 'medium' | 'high'
  includeSupports?: boolean
  splitParts?: boolean
}