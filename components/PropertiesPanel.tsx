'use client'

import { useDesignerStore } from '@/lib/store/designer-store'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useState, useEffect } from 'react'
import { Trash2, Copy, RotateCw } from 'lucide-react'

export function PropertiesPanel() {
  const {
    components,
    selectedIds,
    moveComponent,
    rotateComponent,
    removeComponent,
    deselectAll
  } = useDesignerStore()
  
  const selectedComponent = components.find(c => selectedIds.includes(c.id))
  
  const [position, setPosition] = useState({ x: 0, y: 0, z: 0 })
  const [rotation, setRotation] = useState(0)
  
  useEffect(() => {
    if (selectedComponent) {
      setPosition({
        x: selectedComponent.position[0],
        y: selectedComponent.position[1],
        z: selectedComponent.position[2]
      })
      // Convert radians to degrees for display
      setRotation(Math.round((selectedComponent.rotation[1] * 180) / Math.PI))
    }
  }, [selectedComponent])
  
  if (selectedIds.length === 0) {
    return (
      <Card className="p-4">
        <p className="text-sm text-gray-500 text-center">
          No component selected
        </p>
      </Card>
    )
  }
  
  if (selectedIds.length > 1) {
    return (
      <Card className="p-4">
        <h3 className="font-semibold mb-3">
          {selectedIds.length} Components Selected
        </h3>
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {
              selectedIds.forEach(id => {
                const comp = components.find(c => c.id === id)
                if (comp) {
                  rotateComponent(id, [
                    comp.rotation[0],
                    comp.rotation[1] + Math.PI / 2,
                    comp.rotation[2]
                  ])
                }
              })
            }}
          >
            <RotateCw className="h-4 w-4 mr-2" />
            Rotate All 90°
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="w-full"
            onClick={() => {
              selectedIds.forEach(id => removeComponent(id))
              deselectAll()
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete All
          </Button>
        </div>
      </Card>
    )
  }
  
  if (!selectedComponent) return null
  
  const handlePositionChange = (axis: 'x' | 'y' | 'z', value: string) => {
    const numValue = parseFloat(value) || 0
    const newPosition = { ...position, [axis]: numValue }
    setPosition(newPosition)
    
    // Update component position
    moveComponent(selectedComponent.id, [
      newPosition.x,
      newPosition.y,
      newPosition.z
    ])
  }
  
  const handleRotationChange = (value: string) => {
    const degrees = parseFloat(value) || 0
    setRotation(degrees)
    
    // Convert degrees to radians
    const radians = (degrees * Math.PI) / 180
    rotateComponent(selectedComponent.id, [
      selectedComponent.rotation[0],
      radians,
      selectedComponent.rotation[2]
    ])
  }
  
  const rotateBy90 = () => {
    const newRotation = rotation + 90
    setRotation(newRotation)
    const radians = (newRotation * Math.PI) / 180
    rotateComponent(selectedComponent.id, [
      selectedComponent.rotation[0],
      radians,
      selectedComponent.rotation[2]
    ])
  }
  
  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-3">Properties</h3>
      
      {/* Component Info */}
      <div className="space-y-2 mb-4">
        <div className="text-sm">
          <span className="text-gray-500">Type:</span>{' '}
          <span className="font-medium capitalize">{selectedComponent.part_type}</span>
        </div>
        <div className="text-sm">
          <span className="text-gray-500">Value:</span>{' '}
          <span className="font-medium">
            {selectedComponent.value}{selectedComponent.value_unit}
          </span>
        </div>
        <div className="text-sm">
          <span className="text-gray-500">Brand:</span>{' '}
          <span className="font-medium">{selectedComponent.brand}</span>
        </div>
        <div className="text-sm">
          <span className="text-gray-500">Series:</span>{' '}
          <span className="font-medium">{selectedComponent.series}</span>
        </div>
      </div>
      
      <Separator className="my-3" />
      
      {/* Position Controls */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Position (mm)</Label>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label htmlFor="pos-x" className="text-xs text-gray-500">X</Label>
            <Input
              id="pos-x"
              type="number"
              value={position.x.toFixed(1)}
              onChange={(e) => handlePositionChange('x', e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label htmlFor="pos-y" className="text-xs text-gray-500">Y</Label>
            <Input
              id="pos-y"
              type="number"
              value={position.y.toFixed(1)}
              onChange={(e) => handlePositionChange('y', e.target.value)}
              className="h-8 text-sm"
              disabled
            />
          </div>
          <div>
            <Label htmlFor="pos-z" className="text-xs text-gray-500">Z</Label>
            <Input
              id="pos-z"
              type="number"
              value={position.z.toFixed(1)}
              onChange={(e) => handlePositionChange('z', e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        </div>
      </div>
      
      <Separator className="my-3" />
      
      {/* Rotation Controls */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Rotation</Label>
        <div className="flex gap-2">
          <Input
            type="number"
            value={rotation}
            onChange={(e) => handleRotationChange(e.target.value)}
            className="h-8 text-sm"
            step="90"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={rotateBy90}
            className="px-3"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-4 gap-1">
          {[0, 90, 180, 270].map(angle => (
            <Button
              key={angle}
              size="sm"
              variant={rotation === angle ? "default" : "outline"}
              onClick={() => handleRotationChange(angle.toString())}
              className="text-xs"
            >
              {angle}°
            </Button>
          ))}
        </div>
      </div>
      
      <Separator className="my-3" />
      
      {/* Actions */}
      <div className="space-y-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => {
            // Duplicate component
            const newComponent = {
              ...selectedComponent,
              id: `component-${Date.now()}`,
              position: [
                selectedComponent.position[0] + 10,
                selectedComponent.position[1],
                selectedComponent.position[2] + 10
              ] as [number, number, number]
            }
            useDesignerStore.getState().addComponent(newComponent)
          }}
        >
          <Copy className="h-4 w-4 mr-2" />
          Duplicate
        </Button>
        <Button
          variant="destructive"
          size="sm"
          className="w-full"
          onClick={() => {
            removeComponent(selectedComponent.id)
            deselectAll()
          }}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </div>
    </Card>
  )
}