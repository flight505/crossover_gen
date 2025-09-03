'use client'

import { useDesignerStore } from '@/lib/store/designer-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { 
  RotateCw, 
  Move3D, 
  Circle, 
  Cable,
  Settings2
} from 'lucide-react'

export function EnhancedPropertiesPanel() {
  const selectedIds = useDesignerStore((state) => state.selectedIds)
  const components = useDesignerStore((state) => state.components)
  const board = useDesignerStore((state) => state.board)
  const updateBoard = useDesignerStore((state) => state.updateBoard)
  const moveComponent = useDesignerStore((state) => state.moveComponent)
  const rotateComponent = useDesignerStore((state) => state.rotateComponent)
  const updateComponent = useDesignerStore((state) => state.updateComponent)
  
  const selectedComponent = selectedIds.length === 1 
    ? components.find(c => c.id === selectedIds[0])
    : null

  if (!selectedComponent && selectedIds.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Properties</CardTitle>
          <CardDescription>Select a component to edit its properties</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Board Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Settings2 className="w-4 h-4" />
              <h3 className="font-semibold">Board Settings</h3>
            </div>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="board-width">Width (mm)</Label>
                <Input
                  id="board-width"
                  type="number"
                  value={board.width}
                  onChange={(e) => updateBoard({ width: Number(e.target.value) })}
                  min={50}
                  max={500}
                />
              </div>
              
              <div>
                <Label htmlFor="board-height">Height (mm)</Label>
                <Input
                  id="board-height"
                  type="number"
                  value={board.height}
                  onChange={(e) => updateBoard({ height: Number(e.target.value) })}
                  min={50}
                  max={500}
                />
              </div>
              
              <div>
                <Label htmlFor="board-thickness">Thickness (mm)</Label>
                <Input
                  id="board-thickness"
                  type="number"
                  value={board.thickness}
                  onChange={(e) => updateBoard({ thickness: Number(e.target.value) })}
                  min={3}
                  max={10}
                />
              </div>
              
              <div>
                <Label htmlFor="corner-radius">Corner Radius (mm)</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    id="corner-radius"
                    value={[board.cornerRadius]}
                    onValueChange={([value]) => updateBoard({ cornerRadius: value })}
                    min={0}
                    max={10}
                    step={0.5}
                    className="flex-1"
                  />
                  <span className="w-12 text-sm text-right">{board.cornerRadius}mm</span>
                </div>
              </div>
            </div>
          </div>
          
          <Separator />
          
          {/* Mounting Holes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Circle className="w-4 h-4" />
                <h3 className="font-semibold">Mounting Holes</h3>
              </div>
              <Switch
                checked={board.mountingHoles.enabled}
                onCheckedChange={(checked) => 
                  updateBoard({ 
                    mountingHoles: { ...board.mountingHoles, enabled: checked }
                  })
                }
              />
            </div>
            
            {board.mountingHoles.enabled && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="hole-diameter">Hole Diameter (mm)</Label>
                  <div className="flex items-center gap-2">
                    <Slider
                      id="hole-diameter"
                      value={[board.mountingHoles.diameter]}
                      onValueChange={([value]) => 
                        updateBoard({ 
                          mountingHoles: { ...board.mountingHoles, diameter: value }
                        })
                      }
                      min={2}
                      max={6}
                      step={0.5}
                      className="flex-1"
                    />
                    <span className="w-12 text-sm text-right">{board.mountingHoles.diameter}mm</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <Separator />
          
          {/* Zip-tie Slots */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cable className="w-4 h-4" />
                <h3 className="font-semibold">Zip-tie Slots</h3>
              </div>
              <Switch
                checked={board.zipTieSlots?.enabled || false}
                onCheckedChange={(checked) => 
                  updateBoard({ 
                    zipTieSlots: { 
                      enabled: checked,
                      width: board.zipTieSlots?.width || 3,
                      spacing: board.zipTieSlots?.spacing || 20
                    }
                  })
                }
              />
            </div>
            
            {board.zipTieSlots?.enabled && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="slot-width">Slot Width (mm)</Label>
                  <div className="flex items-center gap-2">
                    <Slider
                      id="slot-width"
                      value={[board.zipTieSlots.width || 3]}
                      onValueChange={([value]) => 
                        updateBoard({ 
                          zipTieSlots: { 
                            enabled: board.zipTieSlots?.enabled || false,
                            width: value,
                            spacing: board.zipTieSlots?.spacing || 20
                          }
                        })
                      }
                      min={2}
                      max={5}
                      step={0.5}
                      className="flex-1"
                    />
                    <span className="w-12 text-sm text-right">{board.zipTieSlots.width || 3}mm</span>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="slot-spacing">Slot Spacing (mm)</Label>
                  <div className="flex items-center gap-2">
                    <Slider
                      id="slot-spacing"
                      value={[board.zipTieSlots.spacing || 20]}
                      onValueChange={([value]) => 
                        updateBoard({ 
                          zipTieSlots: { 
                            enabled: board.zipTieSlots?.enabled || false,
                            width: board.zipTieSlots?.width || 3,
                            spacing: value
                          }
                        })
                      }
                      min={10}
                      max={50}
                      step={5}
                      className="flex-1"
                    />
                    <span className="w-12 text-sm text-right">{board.zipTieSlots.spacing || 20}mm</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (selectedComponent) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Component Properties</CardTitle>
          <CardDescription>
            {selectedComponent.brand} {selectedComponent.series} - {selectedComponent.value}{selectedComponent.value_unit}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Position Controls */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Move3D className="w-4 h-4" />
              <h3 className="font-semibold">Position (mm)</h3>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label htmlFor="pos-x">X</Label>
                <Input
                  id="pos-x"
                  type="number"
                  value={selectedComponent.position[0].toFixed(1)}
                  onChange={(e) => {
                    const newPos = [...selectedComponent.position] as [number, number, number]
                    newPos[0] = Number(e.target.value)
                    moveComponent(selectedComponent.id, newPos)
                  }}
                  step={1}
                />
              </div>
              
              <div>
                <Label htmlFor="pos-y">Y</Label>
                <Input
                  id="pos-y"
                  type="number"
                  value={selectedComponent.position[1].toFixed(1)}
                  onChange={(e) => {
                    const newPos = [...selectedComponent.position] as [number, number, number]
                    newPos[1] = Number(e.target.value)
                    moveComponent(selectedComponent.id, newPos)
                  }}
                  step={1}
                />
              </div>
              
              <div>
                <Label htmlFor="pos-z">Z</Label>
                <Input
                  id="pos-z"
                  type="number"
                  value={selectedComponent.position[2].toFixed(1)}
                  onChange={(e) => {
                    const newPos = [...selectedComponent.position] as [number, number, number]
                    newPos[2] = Number(e.target.value)
                    moveComponent(selectedComponent.id, newPos)
                  }}
                  step={1}
                />
              </div>
            </div>
          </div>
          
          <Separator />
          
          {/* Rotation Controls */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <RotateCw className="w-4 h-4" />
              <h3 className="font-semibold">Rotation</h3>
            </div>
            
            <div className="grid grid-cols-4 gap-2">
              {[0, 90, 180, 270].map((angle) => (
                <Button
                  key={angle}
                  variant={selectedComponent.rotation[1] === angle ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    const newRot = [...selectedComponent.rotation] as [number, number, number]
                    newRot[1] = angle
                    rotateComponent(selectedComponent.id, newRot)
                  }}
                >
                  {angle}°
                </Button>
              ))}
            </div>
            
            <div>
              <Label htmlFor="custom-angle">Custom Angle</Label>
              <Input
                id="custom-angle"
                type="number"
                value={selectedComponent.rotation[1]}
                onChange={(e) => {
                  const newRot = [...selectedComponent.rotation] as [number, number, number]
                  newRot[1] = Number(e.target.value) % 360
                  rotateComponent(selectedComponent.id, newRot)
                }}
                min={0}
                max={359}
                step={15}
              />
            </div>
          </div>
          
          <Separator />
          
          {/* Component-specific Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Settings2 className="w-4 h-4" />
              <h3 className="font-semibold">Component Settings</h3>
            </div>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="hole-diameter">Lead Hole Diameter (mm)</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    id="hole-diameter"
                    value={[selectedComponent.suggested_hole_diameter_mm || 1.5]}
                    onValueChange={([value]) => 
                      updateComponent(selectedComponent.id, { 
                        suggested_hole_diameter_mm: value 
                      })
                    }
                    min={0.5}
                    max={3}
                    step={0.1}
                    className="flex-1"
                  />
                  <span className="w-12 text-sm text-right">
                    {(selectedComponent.suggested_hole_diameter_mm || 1.5).toFixed(1)}mm
                  </span>
                </div>
              </div>
              
              <div>
                <Label htmlFor="recess-depth">Recess Depth (mm)</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    id="recess-depth"
                    value={[selectedComponent.recessDepth || 2]}
                    onValueChange={([value]) => 
                      updateComponent(selectedComponent.id, { 
                        recessDepth: value 
                      })
                    }
                    min={1}
                    max={5}
                    step={0.5}
                    className="flex-1"
                  />
                  <span className="w-12 text-sm text-right">
                    {(selectedComponent.recessDepth || 2).toFixed(1)}mm
                  </span>
                </div>
              </div>
              
              <div>
                <Label htmlFor="clearance">Component Clearance (mm)</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    id="clearance"
                    value={[selectedComponent.clearance || 3]}
                    onValueChange={([value]) => 
                      updateComponent(selectedComponent.id, { 
                        clearance: value 
                      })
                    }
                    min={1}
                    max={10}
                    step={0.5}
                    className="flex-1"
                  />
                  <span className="w-12 text-sm text-right">
                    {(selectedComponent.clearance || 3).toFixed(1)}mm
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <Separator />
          
          {/* Actions */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => {
                // Reset to default values
                updateComponent(selectedComponent.id, {
                  suggested_hole_diameter_mm: 1.5,
                  recessDepth: 2,
                  clearance: 3
                })
              }}
            >
              Reset
            </Button>
            <Button className="flex-1">
              Apply
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  // Multiple selection
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Multiple Selection</CardTitle>
        <CardDescription>{selectedIds.length} components selected</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Batch editing for multiple components is not yet available.
        </p>
      </CardContent>
    </Card>
  )
}