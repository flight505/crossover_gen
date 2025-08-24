'use client'

import { PlacedComponent } from '@/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

interface PropertiesPanelProps {
  selectedComponentIds: string[]
  placedComponents: PlacedComponent[]
  setPlacedComponents: React.Dispatch<React.SetStateAction<PlacedComponent[]>>
}

export function PropertiesPanel({
  selectedComponentIds,
  placedComponents,
  setPlacedComponents,
}: PropertiesPanelProps) {
  const selectedComponents = placedComponents.filter((c) => selectedComponentIds.includes(c.id))
  const selectedComponent = selectedComponents.length === 1 ? selectedComponents[0] : null

  const handleRotate = (angle: number) => {
    if (selectedComponentIds.length === 0) return
    setPlacedComponents((prev) =>
      prev.map((c) =>
        selectedComponentIds.includes(c.id)
          ? { ...c, rotation: (c.rotation + angle) % 360 }
          : c
      )
    )
  }

  const handleFlip = () => {
    if (selectedComponentIds.length === 0) return
    setPlacedComponents((prev) =>
      prev.map((c) =>
        selectedComponentIds.includes(c.id)
          ? { ...c, flipVertical: !c.flipVertical }
          : c
      )
    )
  }

  const handleDelete = () => {
    if (selectedComponentIds.length === 0) return
    setPlacedComponents((prev) => prev.filter((c) => !selectedComponentIds.includes(c.id)))
  }

  return (
    <div className="w-80 border-l bg-background">
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">Properties</h2>
        {selectedComponents.length > 1 ? (
          <div className="space-y-4">
            <Card className="p-3">
              <div className="text-sm">
                <div className="font-semibold">
                  {selectedComponents.length} components selected
                </div>
              </div>
            </Card>
            
            <div>
              <h3 className="text-sm font-semibold mb-2">Batch Actions</h3>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleRotate(90)}>
                  Rotate All 90°
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleRotate(-90)}>
                  Rotate All -90°
                </Button>
              </div>
            </div>

            <Button size="sm" variant="outline" onClick={handleFlip} className="w-full">
              Flip All Vertical
            </Button>

            <Separator />

            <Button size="sm" variant="destructive" className="w-full" onClick={handleDelete}>
              Delete All Selected
            </Button>
          </div>
        ) : selectedComponent ? (
          <div className="space-y-4">
            <Card className="p-3">
              <div className="text-sm">
                <div className="font-semibold">
                  {selectedComponent.component.brand} {selectedComponent.component.series}
                </div>
                <div className="text-muted-foreground">
                  {selectedComponent.component.value}
                </div>
              </div>
            </Card>

            <div>
              <h3 className="text-sm font-semibold mb-2">Position</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>X: {selectedComponent.x.toFixed(1)}mm</div>
                <div>Y: {selectedComponent.y.toFixed(1)}mm</div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-semibold mb-2">Rotation</h3>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleRotate(90)}>
                  Rotate 90°
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleRotate(-90)}>
                  Rotate -90°
                </Button>
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                Current: {selectedComponent.rotation}°
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-2">Transform</h3>
              <Button size="sm" variant="outline" onClick={handleFlip}>
                Flip Vertical
              </Button>
            </div>

            <Separator />

            <Button size="sm" variant="destructive" className="w-full" onClick={handleDelete}>
              Delete Component
            </Button>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            Select a component to view properties
          </div>
        )}
      </div>
    </div>
  )
}