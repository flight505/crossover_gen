'use client'

import { useState } from 'react'
import { ComponentLibrary } from '@/components/designer/ComponentLibrary'
import { DesignCanvas } from '@/components/designer/DesignCanvasClient'
import { Toolbar } from '@/components/designer/Toolbar'
import { PropertiesPanel } from '@/components/designer/PropertiesPanel'
import { PlacedComponent } from '@/types'

export default function DesignerPage() {
  const [placedComponents, setPlacedComponents] = useState<PlacedComponent[]>([])
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null)

  return (
    <div className="h-screen flex flex-col bg-background">
      <Toolbar />
      <div className="flex-1 flex overflow-hidden">
        <ComponentLibrary />
        <div className="flex-1 relative">
          <DesignCanvas
            placedComponents={placedComponents}
            setPlacedComponents={setPlacedComponents}
            selectedComponentId={selectedComponentId}
            setSelectedComponentId={setSelectedComponentId}
          />
        </div>
        <PropertiesPanel
          selectedComponentId={selectedComponentId}
          placedComponents={placedComponents}
          setPlacedComponents={setPlacedComponents}
        />
      </div>
    </div>
  )
}