import { CrossoverComponent } from '@/types/component'
import componentsData from '@/data/crossover_parts_verified_seed.json'

export function loadComponents(): CrossoverComponent[] {
  return componentsData as CrossoverComponent[]
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