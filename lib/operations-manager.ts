/**
 * Operations Manager - Tracks all procedural operations for board generation
 */

export type OperationType = 
  | 'createBoard'
  | 'placeComponent'
  | 'createRecess'
  | 'drillHoles'
  | 'addZipTieSlot'
  | 'addMountingHole'
  | 'addLabel'
  | 'addWireChannel'

export interface BaseOperation {
  id: string
  type: OperationType
  enabled: boolean
  timestamp: number
  description: string
}

export interface CreateBoardOp extends BaseOperation {
  type: 'createBoard'
  params: {
    width: number
    height: number
    thickness: number
    cornerRadius: number
  }
}

export interface PlaceComponentOp extends BaseOperation {
  type: 'placeComponent'
  params: {
    componentId: string
    componentName: string
    position: [number, number, number]
    rotation: number
  }
}

export interface CreateRecessOp extends BaseOperation {
  type: 'createRecess'
  params: {
    componentId: string
    shape: 'cylinder' | 'rectangular' | 'toroidal'
    depth: number
    dimensions: {
      width?: number
      length?: number
      diameter?: number
      outerDiameter?: number
      innerDiameter?: number
    }
  }
}

export interface DrillHolesOp extends BaseOperation {
  type: 'drillHoles'
  params: {
    componentId: string
    holes: Array<{
      x: number
      z: number
      diameter: number
    }>
  }
}

export interface AddZipTieSlotOp extends BaseOperation {
  type: 'addZipTieSlot'
  params: {
    position: [number, number]
    width: number
    length: number
    orientation: 'horizontal' | 'vertical'
  }
}

export interface AddMountingHoleOp extends BaseOperation {
  type: 'addMountingHole'
  params: {
    position: [number, number]
    diameter: number
    countersink: boolean
  }
}

export interface AddLabelOp extends BaseOperation {
  type: 'addLabel'
  params: {
    text: string
    position: [number, number]
    size: number
    depth: number
    style: 'embossed' | 'engraved'
  }
}

export interface AddWireChannelOp extends BaseOperation {
  type: 'addWireChannel'
  params: {
    start: [number, number]
    end: [number, number]
    width: number
    depth: number
  }
}

export type Operation = 
  | CreateBoardOp
  | PlaceComponentOp
  | CreateRecessOp
  | DrillHolesOp
  | AddZipTieSlotOp
  | AddMountingHoleOp
  | AddLabelOp
  | AddWireChannelOp

export class OperationsManager {
  private operations: Operation[] = []
  private nextId = 1

  /**
   * Add a new operation to the list
   */
  addOperation(op: Omit<Operation, 'id' | 'timestamp'>): string {
    const id = `op_${this.nextId++}`
    const operation = {
      ...op,
      id,
      timestamp: Date.now(),
      enabled: true
    } as Operation
    
    this.operations.push(operation)
    return id
  }

  /**
   * Remove an operation by ID
   */
  removeOperation(id: string): boolean {
    const index = this.operations.findIndex(op => op.id === id)
    if (index !== -1) {
      this.operations.splice(index, 1)
      return true
    }
    return false
  }

  /**
   * Toggle operation enabled state
   */
  toggleOperation(id: string): void {
    const op = this.operations.find(o => o.id === id)
    if (op) {
      op.enabled = !op.enabled
    }
  }

  /**
   * Update operation parameters
   */
  updateOperation(id: string, params: Record<string, unknown>): void {
    const op = this.operations.find(o => o.id === id)
    if (op) {
      op.params = { ...op.params, ...params }
    }
  }

  /**
   * Get all operations
   */
  getOperations(): Operation[] {
    return [...this.operations]
  }

  /**
   * Get enabled operations only
   */
  getEnabledOperations(): Operation[] {
    return this.operations.filter(op => op.enabled)
  }

  /**
   * Clear all operations
   */
  clear(): void {
    this.operations = []
    this.nextId = 1
  }

  /**
   * Move operation up in the list
   */
  moveUp(id: string): void {
    const index = this.operations.findIndex(op => op.id === id)
    if (index > 0) {
      [this.operations[index - 1], this.operations[index]] = 
      [this.operations[index], this.operations[index - 1]]
    }
  }

  /**
   * Move operation down in the list
   */
  moveDown(id: string): void {
    const index = this.operations.findIndex(op => op.id === id)
    if (index < this.operations.length - 1) {
      [this.operations[index], this.operations[index + 1]] = 
      [this.operations[index + 1], this.operations[index]]
    }
  }

  /**
   * Export operations as JSON
   */
  export(): string {
    return JSON.stringify(this.operations, null, 2)
  }

  /**
   * Import operations from JSON
   */
  import(json: string): void {
    try {
      const ops = JSON.parse(json)
      if (Array.isArray(ops)) {
        this.operations = ops
        // Update nextId based on imported operations
        const maxId = ops.reduce((max, op) => {
          const num = parseInt(op.id.replace('op_', ''))
          return num > max ? num : max
        }, 0)
        this.nextId = maxId + 1
      }
    } catch (error) {
      console.error('Failed to import operations:', error)
    }
  }

  /**
   * Generate human-readable description for an operation
   */
  static getOperationDescription(op: Operation): string {
    switch (op.type) {
      case 'createBoard':
        return `Create board (${op.params.width}×${op.params.height}×${op.params.thickness}mm)`
      case 'placeComponent':
        return `Place ${op.params.componentName} at (${op.params.position[0]}, ${op.params.position[2]})`
      case 'createRecess':
        return `Create ${op.params.shape} recess (${op.params.depth}mm deep)`
      case 'drillHoles':
        return `Drill ${op.params.holes.length} holes`
      case 'addZipTieSlot':
        return `Add zip-tie slot at (${op.params.position[0]}, ${op.params.position[1]})`
      case 'addMountingHole':
        return `Add mounting hole (⌀${op.params.diameter}mm)`
      case 'addLabel':
        return `Add label "${op.params.text}"`
      case 'addWireChannel':
        return `Add wire channel`
      default:
        return (op as Operation).description
    }
  }
}