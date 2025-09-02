import { create } from 'zustand'

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

interface DesignerState {
  // Board settings
  board: BoardSettings
  
  // Components on board
  components: Component3D[]
  
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
  },
  
  removeComponent: (id) => {
    set((state) => ({
      components: state.components.filter(c => c.id !== id),
      selectedIds: state.selectedIds.filter(sid => sid !== id)
    }))
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
    set((state) => ({
      components: state.components.map(c =>
        c.id === id ? { ...c, position } : c
      )
    }))
  },
  
  rotateComponent: (id, rotation) => {
    set((state) => ({
      components: state.components.map(c =>
        c.id === id ? { ...c, rotation } : c
      )
    }))
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
  }
}))