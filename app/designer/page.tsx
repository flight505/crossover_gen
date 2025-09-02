'use client'

import { useEffect } from 'react'
import { Scene3D } from '@/components/three/Scene3D'
import { ComponentLibrary3D } from '@/components/three/ComponentLibrary3D'
import { Toolbar3D } from '@/components/three/controls/Toolbar3D'
import { useDesignerStore } from '@/lib/store/designer-store'

export default function DesignerPage() {
  const selectedIds = useDesignerStore((state) => state.selectedIds)
  const components = useDesignerStore((state) => state.components)
  const removeComponent = useDesignerStore((state) => state.removeComponent)
  const moveComponent = useDesignerStore((state) => state.moveComponent)
  const rotateComponent = useDesignerStore((state) => state.rotateComponent)
  const deselectAll = useDesignerStore((state) => state.deselectAll)
  const selectComponent = useDesignerStore((state) => state.selectComponent)
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete selected components
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
        e.preventDefault()
        selectedIds.forEach(id => removeComponent(id))
      }
      
      // Rotate selected components
      if ((e.key === 'r' || e.key === 'R') && selectedIds.length > 0) {
        e.preventDefault()
        selectedIds.forEach(id => {
          const comp = components.find(c => c.id === id)
          if (comp) {
            const newRotation: [number, number, number] = [
              comp.rotation[0],
              comp.rotation[1] + (e.shiftKey ? -90 : 90),
              comp.rotation[2]
            ]
            rotateComponent(id, newRotation)
          }
        })
      }
      
      // Arrow key movement
      if (selectedIds.length > 0 && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault()
        const moveAmount = e.shiftKey ? 5 : 1 // 5mm with Shift, 1mm without
        
        selectedIds.forEach(id => {
          const comp = components.find(c => c.id === id)
          if (comp) {
            const newPosition = [...comp.position] as [number, number, number]
            
            switch(e.key) {
              case 'ArrowLeft':
                newPosition[0] -= moveAmount
                break
              case 'ArrowRight':
                newPosition[0] += moveAmount
                break
              case 'ArrowUp':
                newPosition[2] -= moveAmount
                break
              case 'ArrowDown':
                newPosition[2] += moveAmount
                break
            }
            
            moveComponent(id, newPosition)
          }
        })
      }
      
      // Select all
      if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        e.preventDefault()
        components.forEach(c => selectComponent(c.id, true))
      }
      
      // Escape to deselect
      if (e.key === 'Escape') {
        deselectAll()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedIds, components, removeComponent, moveComponent, rotateComponent, deselectAll, selectComponent])
  
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Toolbar */}
      <Toolbar3D />
      
      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Component Library Sidebar */}
        <ComponentLibrary3D />
        
        {/* 3D Canvas */}
        <div className="flex-1 relative">
          <Scene3D />
        </div>
      </div>
    </div>
  )
}