'use client'

import { useState, useEffect } from 'react'
import { ComponentLibrary } from '@/components/designer/ComponentLibrary'
import { DesignCanvas } from '@/components/designer/DesignCanvasClient'
import { Toolbar } from '@/components/designer/Toolbar'
import { PropertiesPanel } from '@/components/designer/PropertiesPanel'
import { PlacedComponent } from '@/types'

export default function DesignerPage() {
  const [placedComponents, setPlacedComponents] = useState<PlacedComponent[]>([])
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete selected component
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedComponentId) {
        e.preventDefault()
        setPlacedComponents(prev => prev.filter(c => c.id !== selectedComponentId))
        setSelectedComponentId(null)
      }
      
      // Rotate component
      if (e.key === 'r' || e.key === 'R') {
        if (selectedComponentId) {
          e.preventDefault()
          const angle = e.shiftKey ? -90 : 90
          setPlacedComponents(prev =>
            prev.map(c =>
              c.id === selectedComponentId
                ? { ...c, rotation: (c.rotation + angle + 360) % 360 }
                : c
            )
          )
        }
      }
      
      // Select all
      if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        e.preventDefault()
        // For now, just select the first component
        if (placedComponents.length > 0) {
          setSelectedComponentId(placedComponents[0].id)
        }
      }
      
      // Clear selection with Escape
      if (e.key === 'Escape') {
        setSelectedComponentId(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedComponentId, placedComponents])

  return (
    <div className="h-screen flex flex-col bg-background">
      <Toolbar 
        placedComponents={placedComponents}
        setPlacedComponents={setPlacedComponents}
        setSelectedComponentId={setSelectedComponentId}
      />
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