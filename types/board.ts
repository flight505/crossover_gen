import { CrossoverComponent } from './component'

export interface BoardDimensions {
  width: number
  height: number
  thickness: number
  margin: number
}

export interface PlacedComponent {
  id: string
  component: CrossoverComponent
  x: number
  y: number
  rotation: number
  flipVertical?: boolean
}