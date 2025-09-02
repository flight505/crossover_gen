import { create } from 'zustand'
import { checkCollision, isWithinBounds, findNearestValidPosition } from '@/lib/collision-detection'

export interface Component3D {
  id: string
  componentId: string // Reference to component data
  position: [number, number, number]
  rotation: [number, number, number]
  selected: boolean
  // Component data will be fetched from enriched JSON
  brand: string
  series: string
  part_type: 'capacitor' | 'resistor' | 'inductor'
  value: number
  value_unit: string
  body_shape: 'cylinder' | 'coil' | 'rectangular'
  dimensions: {
    diameter?: number
    length?: number
    width?: number
    height?: number
    depth?: number
    outer_diameter?: number
    inner_diameter?: number
  }
  lead_configuration: 'axial' | 'radial'
  suggested_hole_diameter_mm: number
  end_inset_mm?: number
  lead_pattern?: 'adjacent' | 'opposite'
  lead_spacing_mm?: number
}

export interface BoardSettings {
  width: number
  height: number
  thickness: number
  cornerRadius: number
  mountingHoles: {
    enabled: boolean
    diameter: number
    positions: 'corners' | 'custom'
  }
}

interface HistoryState {
  board: BoardSettings
  components: Component3D[]
}

interface DesignerState {
  // Board settings
  board: BoardSettings
  
  // Components on board
  components: Component3D[]
  
  // History for undo/redo
  history: HistoryState[]
  historyIndex: number
  
  // Selection
  selectedIds: string[]
  
  // Camera
  cameraPosition: [number, number, number]
  cameraTarget: [number, number, number]
  
  // UI State
  showGrid: boolean
  gridSize: number
  snapToGrid: boolean
  showLabels: boolean
  showDimensions: boolean
  
  // Actions
  addComponent: (component: Partial<Component3D>) => void
  removeComponent: (id: string) => void
  updateComponent: (id: string, updates: Partial<Component3D>) => void
  selectComponent: (id: string, multi?: boolean) => void
  deselectAll: () => void
  moveComponent: (id: string, position: [number, number, number]) => void
  rotateComponent: (id: string, rotation: [number, number, number]) => void
  
  // Board actions
  updateBoard: (settings: Partial<BoardSettings>) => void
  
  // Camera actions
  setCameraPosition: (position: [number, number, number]) => void
  setCameraTarget: (target: [number, number, number]) => void
  
  // UI actions
  toggleGrid: () => void
  setGridSize: (size: number) => void
  toggleSnapToGrid: () => void
  toggleLabels: () => void
  toggleDimensions: () => void
  
  // Project actions
  loadProject: (data: { board?: BoardSettings; components?: Component3D[]; cameraPosition?: [number, number, number]; cameraTarget?: [number, number, number] }) => void
  clearProject: () => void
  exportProject: () => { board: BoardSettings; components: Component3D[]; cameraPosition: [number, number, number]; cameraTarget: [number, number, number] }
  
  // History actions
  undo: () => void
  redo: () => void
  saveToHistory: () => void
}

export const useDesignerStore = create<DesignerState>((set, get) => ({
  // Initial board settings
  board: {
    width: 200,
    height: 150,
    thickness: 5,
    cornerRadius: 2,
    mountingHoles: {
      enabled: false,
      diameter: 3,
      positions: 'corners'
    }
  },
  
  // Initial empty state
  components: [],
  selectedIds: [],
  
  // History (initialize with current state)
  history: [],
  historyIndex: -1,
  
  // Default camera position
  cameraPosition: [150, 150, 150],
  cameraTarget: [0, 0, 0],
  
  // UI defaults
  showGrid: true,
  gridSize: 5,
  snapToGrid: true,
  showLabels: true,
  showDimensions: false,
  
  // Component actions
  addComponent: (component) => {
    const id = `comp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    set((state) => ({
      components: [...state.components, { ...component, id } as Component3D]
    }))
    get().saveToHistory()
  },
  
  removeComponent: (id) => {
    set((state) => ({
      components: state.components.filter(c => c.id !== id),
      selectedIds: state.selectedIds.filter(sid => sid !== id)
    }))
    get().saveToHistory()
  },
  
  updateComponent: (id, updates) => {
    set((state) => ({
      components: state.components.map(c => 
        c.id === id ? { ...c, ...updates } : c
      )
    }))
  },
  
  selectComponent: (id, multi = false) => {
    set((state) => ({
      selectedIds: multi 
        ? [...state.selectedIds, id]
        : [id],
      components: state.components.map(c => ({
        ...c,
        selected: multi 
          ? (c.id === id ? true : c.selected)
          : c.id === id
      }))
    }))
  },
  
  deselectAll: () => {
    set((state) => ({
      selectedIds: [],
      components: state.components.map(c => ({ ...c, selected: false }))
    }))
  },
  
  moveComponent: (id, position) => {
    const state = get()
    const component = state.components.find(c => c.id === id)
    if (!component) return
    
    // Create test component with new position
    const testComponent = { ...component, position }
    const otherComponents = state.components.filter(c => c.id !== id)
    
    // Check for collisions
    const hasCollision = checkCollision(testComponent, otherComponents)
    const withinBounds = isWithinBounds(testComponent, state.board.width, state.board.height)
    
    if (hasCollision || !withinBounds) {
      // Try to find nearest valid position
      const validPosition = findNearestValidPosition(
        testComponent,
        otherComponents,
        state.board.width,
        state.board.height,
        state.gridSize
      )
      
      if (validPosition) {
        set((state) => ({
          components: state.components.map(c =>
            c.id === id ? { ...c, position: validPosition } : c
          )
        }))
        get().saveToHistory()
      }
      // If no valid position found, don't move
    } else {
      // No collision, proceed with move
      set((state) => ({
        components: state.components.map(c =>
          c.id === id ? { ...c, position } : c
        )
      }))
      get().saveToHistory()
    }
  },
  
  rotateComponent: (id, rotation) => {
    set((state) => ({
      components: state.components.map(c =>
        c.id === id ? { ...c, rotation } : c
      )
    }))
    get().saveToHistory()
  },
  
  // Board actions
  updateBoard: (settings) => {
    set((state) => ({
      board: { ...state.board, ...settings }
    }))
  },
  
  // Camera actions
  setCameraPosition: (position) => {
    set({ cameraPosition: position })
  },
  
  setCameraTarget: (target) => {
    set({ cameraTarget: target })
  },
  
  // UI actions
  toggleGrid: () => {
    set((state) => ({ showGrid: !state.showGrid }))
  },
  
  setGridSize: (size) => {
    set({ gridSize: size })
  },
  
  toggleSnapToGrid: () => {
    set((state) => ({ snapToGrid: !state.snapToGrid }))
  },
  
  toggleLabels: () => {
    set((state) => ({ showLabels: !state.showLabels }))
  },
  
  toggleDimensions: () => {
    set((state) => ({ showDimensions: !state.showDimensions }))
  },
  
  // Project actions
  loadProject: (data) => {
    set({
      board: data.board || get().board,
      components: data.components || [],
      selectedIds: [],
      cameraPosition: data.cameraPosition || get().cameraPosition,
      cameraTarget: data.cameraTarget || get().cameraTarget
    })
  },
  
  clearProject: () => {
    set({
      components: [],
      selectedIds: [],
      board: {
        width: 200,
        height: 150,
        thickness: 5,
        cornerRadius: 2,
        mountingHoles: {
          enabled: false,
          diameter: 3,
          positions: 'corners'
        }
      }
    })
  },
  
  exportProject: () => {
    const state = get()
    return {
      board: state.board,
      components: state.components.map(c => ({
        ...c,
        selected: false
      })),
      cameraPosition: state.cameraPosition,
      cameraTarget: state.cameraTarget
    }
  },
  
  // History management
  saveToHistory: () => {
    const state = get()
    const newHistoryState: HistoryState = {
      board: { ...state.board },
      components: [...state.components]
    }
    
    // Remove any states after current index (for when we undo then make new changes)
    const history = state.history.slice(0, state.historyIndex + 1)
    
    // Add new state and limit history to 50 states
    const newHistory = [...history, newHistoryState].slice(-50)
    
    set({
      history: newHistory,
      historyIndex: newHistory.length - 1
    })
  },
  
  undo: () => {
    const state = get()
    if (state.historyIndex > 0) {
      const previousState = state.history[state.historyIndex - 1]
      set({
        board: { ...previousState.board },
        components: [...previousState.components],
        historyIndex: state.historyIndex - 1,
        selectedIds: []
      })
    }
  },
  
  redo: () => {
    const state = get()
    if (state.historyIndex < state.history.length - 1) {
      const nextState = state.history[state.historyIndex + 1]
      set({
        board: { ...nextState.board },
        components: [...nextState.components],
        historyIndex: state.historyIndex + 1,
        selectedIds: []
      })
    }
  }
}))