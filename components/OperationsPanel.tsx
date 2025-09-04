'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Play, 
  ChevronUp, 
  ChevronDown, 
  Trash2,
  Plus,
  Eye,
  EyeOff,
  Layers
} from 'lucide-react'
import { OperationsManager, Operation } from '@/lib/operations-manager'
import { JSCADOperationsGenerator } from '@/lib/jscad-operations-generator'
import { useDesignerStore } from '@/lib/store/designer-store'

export function OperationsPanel() {
  const [manager] = useState(() => new OperationsManager())
  const [operations, setOperations] = useState<Operation[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [showDisabled, setShowDisabled] = useState(true)
  
  const board = useDesignerStore(state => state.board)
  const components = useDesignerStore(state => state.components)

  const updateOperationsFromState = useCallback(() => {
    manager.clear()
    
    // Add board creation
    manager.addOperation({
      type: 'createBoard',
      description: 'Create base board',
      enabled: true,
      params: {
        width: board.width,
        height: board.height,
        thickness: board.thickness,
        cornerRadius: board.cornerRadius
      }
    })
    
    // Add component operations
    components.forEach(comp => {
      // Place component
      manager.addOperation({
        type: 'placeComponent',
        description: `Place ${comp.value}${comp.value_unit}`,
        enabled: true,
        params: {
          componentId: comp.id,
          componentName: `${comp.value}${comp.value_unit}`,
          position: comp.position,
          rotation: comp.rotation[1]
        }
      })
      
      // Create recess
      const recessShape = comp.body_shape === 'cylinder' ? 'cylinder' : 
                         comp.body_shape === 'coil' ? 'toroidal' : 'rectangular'
      
      manager.addOperation({
        type: 'createRecess',
        description: `Create ${recessShape} recess`,
        enabled: true,
        params: {
          componentId: comp.id,
          shape: recessShape,
          depth: comp.recessDepth || 2,
          dimensions: {
            width: comp.dimensions.width,
            length: comp.dimensions.length,
            diameter: comp.dimensions.diameter,
            outerDiameter: comp.dimensions.outer_diameter,
            innerDiameter: comp.dimensions.inner_diameter
          }
        }
      })
      
      // Drill holes
      const holes = []
      if (comp.lead_configuration === 'axial') {
        const length = comp.dimensions.length || 20
        const inset = comp.end_inset_mm || 2
        holes.push(
          { x: -(length / 2 - inset), z: 0, diameter: comp.suggested_hole_diameter_mm },
          { x: length / 2 - inset, z: 0, diameter: comp.suggested_hole_diameter_mm }
        )
      }
      
      if (holes.length > 0) {
        manager.addOperation({
          type: 'drillHoles',
          description: `Drill lead holes`,
          enabled: true,
          params: {
            componentId: comp.id,
            holes
          }
        })
      }
    })
    
    // Add mounting holes if enabled
    if (board.mountingHoles?.enabled) {
      const positions = [
        [5, 5],
        [board.width - 5, 5],
        [board.width - 5, board.height - 5],
        [5, board.height - 5]
      ]
      
      positions.forEach(pos => {
        manager.addOperation({
          type: 'addMountingHole',
          description: 'Add mounting hole',
          enabled: true,
          params: {
            position: [pos[0] - board.width/2, pos[1] - board.height/2],
            diameter: board.mountingHoles.diameter,
            countersink: true
          }
        })
      })
    }
    
    setOperations(manager.getOperations())
  }, [board, components, manager])

  // Update operations when board or components change
  useEffect(() => {
    updateOperationsFromState()
  }, [updateOperationsFromState])

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      const enabledOps = manager.getEnabledOperations()
      const script = JSCADOperationsGenerator.generateScript(enabledOps)
      
      console.log('Generated JSCAD script:', script)
      
      // TODO: Execute script and generate STL
      // For now, show the script
      alert('JSCAD script generated! Check console for details.')
      
    } catch (error) {
      console.error('Generation error:', error)
      alert('Error generating model. Check console for details.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleToggleOperation = (id: string) => {
    manager.toggleOperation(id)
    setOperations(manager.getOperations())
  }

  const handleRemoveOperation = (id: string) => {
    manager.removeOperation(id)
    setOperations(manager.getOperations())
  }

  const handleMoveUp = (id: string) => {
    manager.moveUp(id)
    setOperations(manager.getOperations())
  }

  const handleMoveDown = (id: string) => {
    manager.moveDown(id)
    setOperations(manager.getOperations())
  }

  const visibleOperations = showDisabled ? operations : operations.filter(op => op.enabled)

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="w-5 h-5" />
          Operations Timeline
        </CardTitle>
        <CardDescription>
          Procedural steps to generate your board
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col gap-4 p-4">
        {/* Controls */}
        <div className="flex gap-2">
          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating}
            className="flex-1"
          >
            <Play className="w-4 h-4 mr-2" />
            {isGenerating ? 'Generating...' : 'Generate Board'}
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowDisabled(!showDisabled)}
            title={showDisabled ? "Hide disabled" : "Show all"}
          >
            {showDisabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </Button>
        </div>
        
        <Separator />
        
        {/* Operations List */}
        <ScrollArea className="flex-1">
          <div className="space-y-2 pr-4">
            {visibleOperations.map((op, index) => (
              <div
                key={op.id}
                className={`p-3 border rounded-lg ${
                  op.enabled ? 'bg-white' : 'bg-gray-50 opacity-60'
                }`}
              >
                <div className="flex items-start gap-2">
                  <Checkbox
                    checked={op.enabled}
                    onCheckedChange={() => handleToggleOperation(op.id)}
                    className="mt-0.5"
                  />
                  
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {OperationsManager.getOperationDescription(op)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {op.type} • #{index + 1}
                    </div>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleMoveUp(op.id)}
                      disabled={index === 0}
                    >
                      <ChevronUp className="w-3 h-3" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleMoveDown(op.id)}
                      disabled={index === operations.length - 1}
                    >
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleRemoveOperation(op.id)}
                      disabled={op.type === 'createBoard'}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {operations.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <Layers className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No operations yet</p>
                <p className="text-sm mt-1">Place components to begin</p>
              </div>
            )}
          </div>
        </ScrollArea>
        
        {/* Add Custom Operations */}
        <Separator />
        
        <div className="space-y-2">
          <div className="text-sm font-medium">Add Operations</div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                manager.addOperation({
                  type: 'addZipTieSlot',
                  description: 'Add zip-tie slot',
                  enabled: true,
                  params: {
                    position: [0, 0],
                    width: 3,
                    length: 10,
                    orientation: 'horizontal'
                  }
                })
                setOperations(manager.getOperations())
              }}
            >
              <Plus className="w-3 h-3 mr-1" />
              Zip-tie Slot
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                manager.addOperation({
                  type: 'addLabel',
                  description: 'Add label',
                  enabled: true,
                  params: {
                    text: 'Label',
                    position: [0, 0],
                    size: 3,
                    depth: 0.5,
                    style: 'embossed'
                  }
                })
                setOperations(manager.getOperations())
              }}
            >
              <Plus className="w-3 h-3 mr-1" />
              Label
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                manager.addOperation({
                  type: 'addWireChannel',
                  description: 'Add wire channel',
                  enabled: true,
                  params: {
                    start: [0, 0],
                    end: [50, 0],
                    width: 2,
                    depth: 1.5
                  }
                })
                setOperations(manager.getOperations())
              }}
            >
              <Plus className="w-3 h-3 mr-1" />
              Wire Channel
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                manager.addOperation({
                  type: 'addMountingHole',
                  description: 'Add mounting hole',
                  enabled: true,
                  params: {
                    position: [0, 0],
                    diameter: 3,
                    countersink: false
                  }
                })
                setOperations(manager.getOperations())
              }}
            >
              <Plus className="w-3 h-3 mr-1" />
              Mounting Hole
            </Button>
          </div>
        </div>
        
        {/* Status */}
        <Separator />
        
        <div className="text-xs text-gray-500">
          {operations.filter(op => op.enabled).length} of {operations.length} operations enabled
        </div>
      </CardContent>
    </Card>
  )
}