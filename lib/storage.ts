/**
 * LocalStorage utilities for auto-save and persistence
 */

import { PlacedComponent } from '@/types'

interface BoardDimensions {
  width: number
  height: number
  thickness: number
}

const STORAGE_KEY = 'crossover_designer_autosave'
const STORAGE_VERSION = '1.0'

export interface StoredDesign {
  version: string
  savedAt: string
  board: BoardDimensions
  boardFeatures?: {
    mountingHoles: boolean
    cornerRadius: number
    addLabels: boolean
  }
  components: PlacedComponent[]
}

/**
 * Save design to localStorage
 */
export function saveDesign(
  components: PlacedComponent[],
  boardDimensions: BoardDimensions,
  boardFeatures?: {
    mountingHoles: boolean
    cornerRadius: number
    addLabels: boolean
  }
): boolean {
  try {
    const design: StoredDesign = {
      version: STORAGE_VERSION,
      savedAt: new Date().toISOString(),
      board: boardDimensions,
      boardFeatures,
      components
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(design))
    return true
  } catch (error) {
    console.error('Failed to save design to localStorage:', error)
    return false
  }
}

/**
 * Load design from localStorage
 */
export function loadDesign(): StoredDesign | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null
    
    const design = JSON.parse(stored) as StoredDesign
    
    // Check version compatibility
    if (design.version !== STORAGE_VERSION) {
      console.warn('Stored design version mismatch, may need migration')
    }
    
    return design
  } catch (error) {
    console.error('Failed to load design from localStorage:', error)
    return null
  }
}

/**
 * Clear saved design
 */
export function clearSavedDesign(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Failed to clear saved design:', error)
  }
}

/**
 * Check if there's a saved design
 */
export function hasSavedDesign(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null
  } catch {
    return false
  }
}

/**
 * Get the timestamp of the last save
 */
export function getLastSaveTime(): Date | null {
  try {
    const design = loadDesign()
    return design ? new Date(design.savedAt) : null
  } catch {
    return null
  }
}

/**
 * Export design as JSON for manual download
 */
export function exportDesignJSON(
  components: PlacedComponent[],
  boardDimensions: BoardDimensions,
  boardFeatures?: {
    mountingHoles: boolean
    cornerRadius: number
    addLabels: boolean
  },
  metadata?: {
    projectName?: string
    author?: string
    notes?: string
  }
): Blob {
  const design = {
    version: STORAGE_VERSION,
    createdAt: new Date().toISOString(),
    metadata,
    board: boardDimensions,
    boardFeatures,
    components,
    statistics: {
      componentCount: components.length,
      boardArea: boardDimensions.width * boardDimensions.height,
      boardVolume: boardDimensions.width * boardDimensions.height * boardDimensions.thickness
    }
  }
  
  return new Blob([JSON.stringify(design, null, 2)], { type: 'application/json' })
}

/**
 * Generate a shareable URL with compressed state
 */
export function generateShareableURL(
  components: PlacedComponent[],
  boardDimensions: BoardDimensions
): string {
  try {
    const data = {
      b: [boardDimensions.width, boardDimensions.height, boardDimensions.thickness],
      c: components.map(comp => ({
        id: comp.component.id,
        x: comp.x,
        y: comp.y,
        r: comp.rotation || 0
      }))
    }
    
    const compressed = btoa(JSON.stringify(data))
    const url = new URL(window.location.href)
    url.searchParams.set('design', compressed)
    
    return url.toString()
  } catch (error) {
    console.error('Failed to generate shareable URL:', error)
    return window.location.href
  }
}

/**
 * Parse design from URL parameters
 */
export function parseDesignFromURL(): { 
  board?: BoardDimensions, 
  componentPositions?: Array<{ id: string; x: number; y: number; rotation: number }> 
} | null {
  try {
    const params = new URLSearchParams(window.location.search)
    const compressed = params.get('design')
    
    if (!compressed) return null
    
    const data = JSON.parse(atob(compressed))
    
    return {
      board: data.b ? {
        width: data.b[0],
        height: data.b[1],
        thickness: data.b[2]
      } : undefined,
      componentPositions: data.c
    }
  } catch (error) {
    console.error('Failed to parse design from URL:', error)
    return null
  }
}