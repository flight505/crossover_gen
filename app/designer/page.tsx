'use client'

import { useState, useEffect, useCallback } from 'react'
import { ComponentLibrary } from '@/components/designer/ComponentLibrary'
import { DesignCanvas } from '@/components/designer/DesignCanvasClient'
import { Toolbar } from '@/components/designer/Toolbar'
import { PropertiesPanel } from '@/components/designer/PropertiesPanel'
import { BoardConfig } from '@/components/designer/BoardConfig'
import { PlacedComponent } from '@/types'
import { demoLayout, demoDesign } from '@/data/demo-layout'
import { useHistory } from '@/hooks/useHistory'

export default function DesignerPage() {
  const history = useHistory<PlacedComponent[]>(demoLayout)
  const [selectedComponentIds, setSelectedComponentIds] = useState<string[]>([])
  const [boardDimensions, setBoardDimensions] = useState(demoDesign.board)

  // Use history.current as the source of truth for components
  const placedComponents = history.current
  
  // Wrap setPlacedComponents to push to history
  const setPlacedComponents = useCallback((
    newComponents: PlacedComponent[] | ((prev: PlacedComponent[]) => PlacedComponent[])
  ) => {
    const components = typeof newComponents === 'function' 
      ? newComponents(history.current)
      : newComponents
    history.push(components)
  }, [history])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo/Redo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        if (history.canUndo) {
          history.undo()
        }
      }
      
      if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        if (history.canRedo) {
          history.redo()
        }
      }
      
      // Delete selected components
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedComponentIds.length > 0) {
        e.preventDefault()
        setPlacedComponents(prev => prev.filter(c => !selectedComponentIds.includes(c.id)))
        setSelectedComponentIds([])
      
      }
      
      // Rotate selected components
      if (e.key === 'r' || e.key === 'R') {
        if (selectedComponentIds.length > 0) {
          e.preventDefault()
          const angle = e.shiftKey ? -90 : 90
          setPlacedComponents(prev =>
            prev.map(c =>
              selectedComponentIds.includes(c.id)
                ? { ...c, rotation: (c.rotation + angle + 360) % 360 }
                : c
            )
          )
        }
      }
      
      // Select all
      if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        e.preventDefault()
        setSelectedComponentIds(placedComponents.map(c => c.id))
      }
      
      // Clear selection with Escape
      if (e.key === 'Escape') {
        setSelectedComponentIds([])
      
      }
      
      // Arrow key movement for selected components
      if (selectedComponentIds.length > 0 && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault()
        const moveAmount = e.shiftKey ? 5 : 1 // 5mm with Shift, 1mm without
        
        setPlacedComponents(prev => prev.map(c => {
          if (!selectedComponentIds.includes(c.id)) return c
          
          let newX = c.x
          let newY = c.y
          
          switch(e.key) {
            case 'ArrowLeft':
              newX = Math.max(0, c.x - moveAmount)
              break
            case 'ArrowRight':
              newX = Math.min(boardDimensions.width - 20, c.x + moveAmount) // Assuming ~20mm component width
              break
            case 'ArrowUp':
              newY = Math.max(0, c.y - moveAmount)
              break
            case 'ArrowDown':
              newY = Math.min(boardDimensions.height - 20, c.y + moveAmount) // Assuming ~20mm component height
              break
          }
          
          return { ...c, x: newX, y: newY }
        }))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedComponentIds, placedComponents, boardDimensions, history, setPlacedComponents])

  return (
    <div className="h-screen flex flex-col bg-background">
      <Toolbar 
        placedComponents={placedComponents}
        setPlacedComponents={setPlacedComponents}
        setSelectedComponentIds={setSelectedComponentIds}
        boardDimensions={boardDimensions}
        setBoardDimensions={setBoardDimensions}
      />
      <div className="flex-1 flex overflow-hidden">
        <ComponentLibrary />
        <div className="flex-1 relative">
          <DesignCanvas
            placedComponents={placedComponents}
            setPlacedComponents={setPlacedComponents}
            selectedComponentIds={selectedComponentIds}
            setSelectedComponentIds={setSelectedComponentIds}
            boardDimensions={boardDimensions}
            setBoardDimensions={setBoardDimensions}
          />
          <BoardConfig
            boardDimensions={boardDimensions}
            setBoardDimensions={setBoardDimensions}
          />
        </div>
        <PropertiesPanel
          selectedComponentIds={selectedComponentIds}
          placedComponents={placedComponents}
          setPlacedComponents={setPlacedComponents}
        />
      </div>
    </div>
  )
}