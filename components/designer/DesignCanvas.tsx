'use client'

import { useRef, useState, useEffect } from 'react'
import { Stage, Layer, Rect, Group, Text, Line, Circle } from 'react-konva'
import { PlacedComponent, CrossoverComponent } from '@/types'
import Konva from 'konva'

interface DesignCanvasProps {
  placedComponents: PlacedComponent[]
  setPlacedComponents: React.Dispatch<React.SetStateAction<PlacedComponent[]>>
  selectedComponentIds: string[]
  setSelectedComponentIds: React.Dispatch<React.SetStateAction<string[]>>
  boardDimensions: {
    width: number
    height: number
    thickness: number
  }
  setBoardDimensions?: React.Dispatch<React.SetStateAction<{
    width: number
    height: number
    thickness: number
  }>>
}

const SCALE = 3

export function DesignCanvasComponent({
  placedComponents,
  setPlacedComponents,
  selectedComponentIds,
  setSelectedComponentIds,
  boardDimensions,
}: DesignCanvasProps) {
  const stageRef = useRef<Konva.Stage>(null)
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 })
  const [showGrid, setShowGrid] = useState(true)
  const [gridSize, setGridSize] = useState(5) // 5mm grid default
  const [zoom, setZoom] = useState(1)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 })
  const [collisionWarning, setCollisionWarning] = useState(false)
  const [alignmentGuides, setAlignmentGuides] = useState<{ x?: number; y?: number }>({})
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectionRect, setSelectionRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null)
  const [hoveredComponentId, setHoveredComponentId] = useState<string | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null)
  const [dragPreview, setDragPreview] = useState<{ x: number; y: number; component: CrossoverComponent } | null>(null)
  const [draggedComponentId, setDraggedComponentId] = useState<string | null>(null)
  const [realtimePosition, setRealtimePosition] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const updateSize = () => {
      const container = document.getElementById('canvas-container')
      if (container) {
        setStageSize({
          width: container.clientWidth,
          height: container.clientHeight,
        })
      }
    }

    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.types.includes('component')) {
      // Component data might not be available until drop, but we know it's a component
      // Create a placeholder preview
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      
      const boardX = (stageSize.width - boardDimensions.width * SCALE) / 2
      const boardY = (stageSize.height - boardDimensions.height * SCALE) / 2
      
      let relativeX = (x - boardX) / SCALE
      let relativeY = (y - boardY) / SCALE
      
      // Snap to grid
      if (showGrid) {
        relativeX = Math.round(relativeX / gridSize) * gridSize
        relativeY = Math.round(relativeY / gridSize) * gridSize
      }
      
      // Create a placeholder component for preview
      const placeholderComponent: CrossoverComponent = {
        brand: 'Preview',
        series: '',
        part_type: 'capacitor',
        value: '',
        dimensions: { length: 20, width: 20, height: 10 },
        lead_config: { spacing: 5, diameter: 0.6, configuration: 'radial' }
      }
      
      setDragPreview({ x: relativeX, y: relativeY, component: placeholderComponent })
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear preview if leaving the canvas entirely
    if (e.currentTarget === e.target) {
      setDragPreview(null)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Clear the preview
    setDragPreview(null)
    
    const componentData = e.dataTransfer.getData('component')
    if (!componentData) {
      console.log('No component data in drop')
      return
    }

    const component: CrossoverComponent = JSON.parse(componentData)
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const boardX = (stageSize.width - boardDimensions.width * SCALE) / 2
    const boardY = (stageSize.height - boardDimensions.height * SCALE) / 2

    let relativeX = (x - boardX) / SCALE
    let relativeY = (y - boardY) / SCALE

    // Snap to grid
    if (showGrid) {
      relativeX = Math.round(relativeX / gridSize) * gridSize
      relativeY = Math.round(relativeY / gridSize) * gridSize
    }

    if (relativeX < 0 || relativeX > boardDimensions.width || relativeY < 0 || relativeY > boardDimensions.height) {
      return
    }

    const newComponent: PlacedComponent = {
      id: `${Date.now()}-${Math.random()}`,
      component,
      x: relativeX,
      y: relativeY,
      rotation: 0,
      flipVertical: false,
    }

    // Check for collisions
    const hasCollision = placedComponents.some(existing => {
      const existingWidth = existing.component.dimensions.diameter || existing.component.dimensions.length
      const existingHeight = existing.component.dimensions.diameter || existing.component.dimensions.width
      
      const newWidth = component.dimensions.diameter || component.dimensions.length
      const newHeight = component.dimensions.diameter || component.dimensions.width
      
      return (
        relativeX < existing.x + existingWidth &&
        relativeX + newWidth > existing.x &&
        relativeY < existing.y + existingHeight &&
        relativeY + newHeight > existing.y
      )
    })

    if (hasCollision) {
      console.log('Cannot place component: collision detected')
      setCollisionWarning(true)
      setTimeout(() => setCollisionWarning(false), 2000)
      return
    }

    setPlacedComponents((prev) => [...prev, newComponent])
    setSelectedComponentIds([newComponent.id]) // Select the newly placed component
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'copy'
    
    // Show ghost preview
    const componentData = e.dataTransfer.types.includes('component')
    if (componentData) {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      
      const boardX = (stageSize.width - boardDimensions.width * SCALE) / 2
      const boardY = (stageSize.height - boardDimensions.height * SCALE) / 2
      
      let relativeX = (x - boardX) / SCALE
      let relativeY = (y - boardY) / SCALE
      
      // Snap to grid
      if (showGrid) {
        relativeX = Math.round(relativeX / gridSize) * gridSize
        relativeY = Math.round(relativeY / gridSize) * gridSize
      }
      
      // Update preview position (we'll parse the actual component in handleDrop)
      setDragPreview(prev => prev ? { ...prev, x: relativeX, y: relativeY } : null)
    }
  }

  const findAlignmentGuides = (componentId: string, x: number, y: number, width: number, height: number) => {
    const guides: { x?: number; y?: number } = {}
    const threshold = 2 // 2mm threshold for snapping
    
    placedComponents.forEach(other => {
      if (other.id === componentId) return
      
      const otherWidth = other.component.dimensions?.diameter || other.component.dimensions?.length || 20
      const otherHeight = other.component.dimensions?.diameter || other.component.dimensions?.width || 20
      
      // Check horizontal alignment
      if (Math.abs(other.x - x) < threshold) {
        guides.x = other.x // Left edges align
      } else if (Math.abs(other.x + otherWidth - (x + width)) < threshold) {
        guides.x = other.x + otherWidth - width // Right edges align
      } else if (Math.abs(other.x + otherWidth / 2 - (x + width / 2)) < threshold) {
        guides.x = other.x + otherWidth / 2 - width / 2 // Centers align
      }
      
      // Check vertical alignment
      if (Math.abs(other.y - y) < threshold) {
        guides.y = other.y // Top edges align
      } else if (Math.abs(other.y + otherHeight - (y + height)) < threshold) {
        guides.y = other.y + otherHeight - height // Bottom edges align
      } else if (Math.abs(other.y + otherHeight / 2 - (y + height / 2)) < threshold) {
        guides.y = other.y + otherHeight / 2 - height / 2 // Centers align
      }
    })
    
    return guides
  }

  const handleComponentDrag = (e: Konva.KonvaEventObject<DragEvent>, id: string) => {
    const node = e.target
    const boardX = (stageSize.width - boardDimensions.width * SCALE) / 2
    const boardY = (stageSize.height - boardDimensions.height * SCALE) / 2
    
    const x = (node.x() - boardX) / SCALE
    const y = (node.y() - boardY) / SCALE
    
    const component = placedComponents.find(c => c.id === id)
    if (!component) return
    
    const width = component.component.dimensions?.diameter || component.component.dimensions?.length || 20
    const height = component.component.dimensions?.diameter || component.component.dimensions?.width || 20
    
    const guides = findAlignmentGuides(id, x, y, width, height)
    setAlignmentGuides(guides)
    
    // Update real-time position display
    setDraggedComponentId(id)
    setRealtimePosition({ x, y })
    
    // Snap to guides if found
    if (guides.x !== undefined) {
      node.x(boardX + guides.x * SCALE)
    }
    if (guides.y !== undefined) {
      node.y(boardY + guides.y * SCALE)
    }
  }

  const handleComponentDragEnd = (e: Konva.KonvaEventObject<DragEvent>, id: string) => {
    setAlignmentGuides({}) // Clear guides
    setDraggedComponentId(null)
    setRealtimePosition(null)
    const node = e.target
    const boardX = (stageSize.width - boardDimensions.width * SCALE) / 2
    const boardY = (stageSize.height - boardDimensions.height * SCALE) / 2

    const newX = (node.x() - boardX) / SCALE
    const newY = (node.y() - boardY) / SCALE

    // Get the component being moved
    const movingComponent = placedComponents.find(c => c.id === id)
    if (!movingComponent) return

    const componentWidth = movingComponent.component.dimensions.diameter || movingComponent.component.dimensions.length
    const componentHeight = movingComponent.component.dimensions.diameter || movingComponent.component.dimensions.width

    // Check for collisions with other components
    const hasCollision = placedComponents.some(existing => {
      if (existing.id === id) return false // Don't check collision with itself
      
      const existingWidth = existing.component.dimensions.diameter || existing.component.dimensions.length
      const existingHeight = existing.component.dimensions.diameter || existing.component.dimensions.width
      
      return (
        newX < existing.x + existingWidth &&
        newX + componentWidth > existing.x &&
        newY < existing.y + existingHeight &&
        newY + componentHeight > existing.y
      )
    })

    // Check if component is still within board bounds
    const withinBounds = (
      newX >= 0 && 
      newY >= 0 && 
      newX + componentWidth <= boardDimensions.width &&
      newY + componentHeight <= boardDimensions.height
    )

    if (hasCollision || !withinBounds) {
      // Revert to original position if collision or out of bounds
      const originalComponent = placedComponents.find(c => c.id === id)
      if (originalComponent) {
        node.x(boardX + originalComponent.x * SCALE)
        node.y(boardY + originalComponent.y * SCALE)
      }
      if (hasCollision) {
        setCollisionWarning(true)
        setTimeout(() => setCollisionWarning(false), 2000)
      }
      return
    }

    setPlacedComponents((prev) =>
      prev.map((c) => (c.id === id ? { ...c, x: newX, y: newY } : c))
    )
  }

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    
    const oldScale = zoom
    const pointer = e.target.getStage()?.getPointerPosition()
    
    if (!pointer) return

    const mousePointTo = {
      x: (pointer.x - panOffset.x) / oldScale,
      y: (pointer.y - panOffset.y) / oldScale,
    }

    // Zoom limits: 10% to 500%
    const newScale = Math.max(0.1, Math.min(5, oldScale * (1 - e.evt.deltaY * 0.001)))
    
    setZoom(newScale)
    setPanOffset({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    })
  }

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Middle mouse button or space+left click for panning
    if (e.evt.button === 1 || (e.evt.button === 0 && e.evt.metaKey)) {
      setIsPanning(true)
      setLastPanPoint({ x: e.evt.clientX, y: e.evt.clientY })
      e.evt.preventDefault()
    } else if (e.evt.button === 0 && e.target === e.target.getStage()) {
      // Left click on empty space starts selection
      const stage = e.target.getStage()
      if (stage) {
        const pointer = stage.getPointerPosition()
        if (pointer) {
          const scaledX = (pointer.x - panOffset.x) / zoom
          const scaledY = (pointer.y - panOffset.y) / zoom
          setIsSelecting(true)
          setSelectionStart({ x: scaledX, y: scaledY })
          setSelectionRect({ x: scaledX, y: scaledY, width: 0, height: 0 })
        }
      }
    }
  }

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isPanning) {
      const dx = e.evt.clientX - lastPanPoint.x
      const dy = e.evt.clientY - lastPanPoint.y
      
      setPanOffset(prev => ({
        x: prev.x + dx,
        y: prev.y + dy,
      }))
      
      setLastPanPoint({ x: e.evt.clientX, y: e.evt.clientY })
    } else if (isSelecting && selectionStart) {
      // Update selection rectangle while dragging
      const stage = e.target.getStage()
      if (stage) {
        const pointer = stage.getPointerPosition()
        if (pointer) {
          const scaledX = (pointer.x - panOffset.x) / zoom
          const scaledY = (pointer.y - panOffset.y) / zoom
          
          setSelectionRect({
            x: Math.min(selectionStart.x, scaledX),
            y: Math.min(selectionStart.y, scaledY),
            width: Math.abs(scaledX - selectionStart.x),
            height: Math.abs(scaledY - selectionStart.y)
          })
        }
      }
    }
  }

  const handleMouseUp = (e: Konva.KonvaEventObject<MouseEvent>) => {
    setIsPanning(false)
    
    if (isSelecting && selectionRect) {
      // Select components within the selection rectangle
      const boardX = (stageSize.width - boardDimensions.width * SCALE) / 2
      const boardY = (stageSize.height - boardDimensions.height * SCALE) / 2
      
      const selectedIds = placedComponents.filter(component => {
        const componentX = boardX + component.x * SCALE
        const componentY = boardY + component.y * SCALE
        const componentWidth = (component.component.dimensions.diameter || component.component.dimensions.length || 10) * SCALE
        const componentHeight = (component.component.dimensions.diameter || component.component.dimensions.width || 10) * SCALE
        
        // Check if component is within selection rectangle
        return (
          componentX >= selectionRect.x &&
          componentY >= selectionRect.y &&
          componentX + componentWidth <= selectionRect.x + selectionRect.width &&
          componentY + componentHeight <= selectionRect.y + selectionRect.height
        )
      }).map(c => c.id)
      
      if (e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey) {
        // Add to existing selection
        setSelectedComponentIds(prev => {
          const newSelection = [...prev]
          selectedIds.forEach(id => {
            if (!newSelection.includes(id)) {
              newSelection.push(id)
            }
          })
          return newSelection
        })
      } else {
        // Replace selection
        setSelectedComponentIds(selectedIds)
      }
      
      setIsSelecting(false)
      setSelectionRect(null)
      setSelectionStart(null)
    }
  }

  const handleComponentClick = (e: Konva.KonvaEventObject<MouseEvent>, id: string) => {
    if (e.evt.shiftKey) {
      // Shift+click: toggle selection
      setSelectedComponentIds(prev => 
        prev.includes(id) 
          ? prev.filter(cId => cId !== id)
          : [...prev, id]
      )
    } else if (e.evt.metaKey || e.evt.ctrlKey) {
      // Ctrl/Cmd+click: toggle selection
      setSelectedComponentIds(prev => 
        prev.includes(id) 
          ? prev.filter(cId => cId !== id)
          : [...prev, id]
      )
    } else {
      // Regular click: single selection
      setSelectedComponentIds([id])
    }
  }

  const boardX = (stageSize.width - boardDimensions.width * SCALE) / 2
  const boardY = (stageSize.height - boardDimensions.height * SCALE) / 2

  // Generate grid lines
  const gridLines = []
  if (showGrid) {
    // Vertical lines
    for (let i = 0; i <= boardDimensions.width; i += gridSize) {
      gridLines.push(
        <Line
          key={`v-${i}`}
          points={[boardX + i * SCALE, boardY, boardX + i * SCALE, boardY + boardDimensions.height * SCALE]}
          stroke="#e0e0e0"
          strokeWidth={0.5}
        />
      )
    }
    // Horizontal lines
    for (let i = 0; i <= boardDimensions.height; i += gridSize) {
      gridLines.push(
        <Line
          key={`h-${i}`}
          points={[boardX, boardY + i * SCALE, boardX + boardDimensions.width * SCALE, boardY + i * SCALE]}
          stroke="#e0e0e0"
          strokeWidth={0.5}
        />
      )
    }
  }

  return (
    <div
      id="canvas-container"
      className="w-full h-full bg-gray-50"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
    >
      <div className="absolute top-2 left-2 z-10 bg-white rounded-md shadow-md p-2 flex gap-2">
        <button
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
          onClick={() => setShowGrid(!showGrid)}
        >
          Grid: {showGrid ? 'ON' : 'OFF'}
        </button>
        <select
          className="px-2 py-1 text-sm bg-gray-100 rounded"
          value={gridSize}
          onChange={(e) => setGridSize(Number(e.target.value))}
          disabled={!showGrid}
        >
          <option value={1}>1mm</option>
          <option value={5}>5mm</option>
          <option value={10}>10mm</option>
        </select>
        <div className="flex items-center gap-1 border-l pl-2">
          <button
            className="px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
            onClick={() => setZoom(prev => Math.max(0.1, prev - 0.1))}
          >
            -
          </button>
          <span className="px-2 py-1 text-sm bg-gray-50 rounded min-w-16 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            className="px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
            onClick={() => setZoom(prev => Math.min(5, prev + 0.1))}
          >
            +
          </button>
          <button
            className="px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
            onClick={() => {
              setZoom(1)
              setPanOffset({ x: 0, y: 0 })
            }}
          >
            Reset
          </button>
        </div>
      </div>
      
      {collisionWarning && (
        <div className="absolute top-16 left-2 z-20 bg-red-500 text-white px-3 py-2 rounded-md shadow-lg">
          ⚠️ Collision detected! Components cannot overlap.
        </div>
      )}
      
      {/* Real-time position display */}
      {draggedComponentId && realtimePosition && (() => {
        const draggedComponent = placedComponents.find(c => c.id === draggedComponentId)
        if (!draggedComponent) return null
        
        return (
          <div className="absolute bottom-2 left-2 z-20 bg-black bg-opacity-75 text-white px-3 py-2 rounded-md shadow-lg text-sm font-mono">
            <div className="flex gap-4">
              <div>X: {realtimePosition.x.toFixed(1)}mm</div>
              <div>Y: {realtimePosition.y.toFixed(1)}mm</div>
              <div>R: {draggedComponent.rotation}°</div>
            </div>
          </div>
        )
      })()}
      
      <Stage 
        width={stageSize.width} 
        height={stageSize.height} 
        ref={stageRef}
        scaleX={zoom}
        scaleY={zoom}
        x={panOffset.x}
        y={panOffset.y}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMousemove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <Layer>
          <Rect
            x={boardX}
            y={boardY}
            width={boardDimensions.width * SCALE}
            height={boardDimensions.height * SCALE}
            fill="#f5f5dc"
            stroke="#8B7355"
            strokeWidth={2}
            shadowBlur={10}
            shadowOffset={{ x: 5, y: 5 }}
            shadowOpacity={0.2}
          />
          
          {gridLines}
          
          {/* Alignment guide lines */}
          {alignmentGuides.x !== undefined && (
            <Line
              points={[
                boardX + alignmentGuides.x * SCALE,
                boardY,
                boardX + alignmentGuides.x * SCALE,
                boardY + boardDimensions.height * SCALE
              ]}
              stroke="#00ff00"
              strokeWidth={1}
              dash={[5, 5]}
              opacity={0.7}
            />
          )}
          {alignmentGuides.y !== undefined && (
            <Line
              points={[
                boardX,
                boardY + alignmentGuides.y * SCALE,
                boardX + boardDimensions.width * SCALE,
                boardY + alignmentGuides.y * SCALE
              ]}
              stroke="#00ff00"
              strokeWidth={1}
              dash={[5, 5]}
              opacity={0.7}
            />
          )}

          {/* Ghost preview when dragging */}
          {dragPreview && (
            <Group
              x={boardX + dragPreview.x * SCALE}
              y={boardY + dragPreview.y * SCALE}
              opacity={0.5}
            >
              <Rect
                x={-10 * SCALE}
                y={-10 * SCALE}
                width={20 * SCALE}
                height={20 * SCALE}
                fill="#999"
                stroke="#666"
                strokeWidth={1}
                cornerRadius={2}
                dash={[5, 5]}
              />
              <Text
                x={-10 * SCALE}
                y={-2}
                width={20 * SCALE}
                text="Drop here"
                fontSize={10}
                fill="#333"
                align="center"
              />
            </Group>
          )}
          
          {placedComponents.map((placed) => (
            <ComponentShape
              key={placed.id}
              placed={placed}
              boardX={boardX}
              boardY={boardY}
              scale={SCALE}
              isSelected={selectedComponentIds.includes(placed.id)}
              onSelect={(e) => handleComponentClick(e, placed.id)}
              onDrag={(e) => handleComponentDrag(e, placed.id)}
              onDragEnd={(e) => handleComponentDragEnd(e, placed.id)}
              onMouseEnter={(e) => {
                setHoveredComponentId(placed.id)
                const stage = e.target.getStage()
                if (stage) {
                  const pointer = stage.getPointerPosition()
                  if (pointer) {
                    setTooltipPosition({ x: pointer.x + 10, y: pointer.y - 10 })
                  }
                }
              }}
              onMouseLeave={() => {
                setHoveredComponentId(null)
                setTooltipPosition(null)
              }}
            />
          ))}
          
          {/* Selection rectangle */}
          {isSelecting && selectionRect && (
            <Rect
              x={selectionRect.x}
              y={selectionRect.y}
              width={selectionRect.width}
              height={selectionRect.height}
              fill="rgba(59, 130, 246, 0.1)"
              stroke="rgb(59, 130, 246)"
              strokeWidth={1}
              dash={[5, 5]}
            />
          )}
        </Layer>
      </Stage>
      
      {/* Hover tooltip */}
      {hoveredComponentId && tooltipPosition && (() => {
        const hoveredComponent = placedComponents.find(c => c.id === hoveredComponentId)
        if (!hoveredComponent) return null
        
        return (
          <div
            className="absolute z-30 bg-gray-900 text-white p-2 rounded-md shadow-lg text-xs pointer-events-none"
            style={{
              left: tooltipPosition.x,
              top: tooltipPosition.y,
              maxWidth: '250px'
            }}
          >
            <div className="font-semibold">
              {hoveredComponent.component.brand} {hoveredComponent.component.series}
            </div>
            <div className="mt-1 space-y-0.5">
              <div>Type: {hoveredComponent.component.part_type}</div>
              <div>Value: {hoveredComponent.component.value}</div>
              {hoveredComponent.component.tolerance && (
                <div>Tolerance: {hoveredComponent.component.tolerance}</div>
              )}
              {hoveredComponent.component.voltage && (
                <div>Voltage: {hoveredComponent.component.voltage}</div>
              )}
              <div>Lead: {hoveredComponent.component.lead_config.configuration}</div>
              <div>Lead spacing: {hoveredComponent.component.lead_config.spacing}mm</div>
              <div className="pt-1 border-t border-gray-700">
                Position: ({hoveredComponent.x.toFixed(1)}, {hoveredComponent.y.toFixed(1)})mm
              </div>
              <div>Rotation: {hoveredComponent.rotation}°</div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

interface ComponentShapeProps {
  placed: PlacedComponent
  boardX: number
  boardY: number
  scale: number
  isSelected: boolean
  onSelect: (e: Konva.KonvaEventObject<MouseEvent>) => void
  onDrag: (e: Konva.KonvaEventObject<DragEvent>) => void
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void
  onMouseEnter?: (e: Konva.KonvaEventObject<MouseEvent>) => void
  onMouseLeave?: () => void
}

function ComponentShape({
  placed,
  boardX,
  boardY,
  scale,
  isSelected,
  onSelect,
  onDrag,
  onDragEnd,
  onMouseEnter,
  onMouseLeave,
}: ComponentShapeProps) {
  const { component, x, y, rotation, flipVertical } = placed
  const dims = component.dimensions

  // Use actual dimensions from component data if available
  const width = dims.diameter || dims.length || 20
  const height = dims.diameter || dims.width || 20

  const colors = {
    capacitor: '#ff6b6b',
    resistor: '#4dabf7',
    inductor: '#51cf66',
  }

  return (
    <Group
      x={boardX + x * scale}
      y={boardY + y * scale}
      rotation={rotation}
      scaleY={flipVertical ? -1 : 1}
      draggable
      onDragMove={onDrag}
      onDragEnd={onDragEnd}
      onClick={onSelect}
      onTap={onSelect}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <Rect
        x={-width * scale / 2}
        y={-height * scale / 2}
        width={width * scale}
        height={height * scale}
        fill={colors[component.part_type]}
        stroke={isSelected ? '#000' : '#666'}
        strokeWidth={isSelected ? 2 : 1}
        cornerRadius={dims.diameter ? width * scale / 2 : 2}
        shadowBlur={5}
        shadowOffset={{ x: 2, y: 2 }}
        shadowOpacity={0.3}
      />
      
      {component.lead_config.configuration === 'radial' && (
        <>
          <Rect
            x={-component.lead_config.spacing * scale / 2 - 2}
            y={height * scale / 2 - 5}
            width={4}
            height={10}
            fill="#888"
          />
          <Rect
            x={component.lead_config.spacing * scale / 2 - 2}
            y={height * scale / 2 - 5}
            width={4}
            height={10}
            fill="#888"
          />
        </>
      )}

      <Text
        x={-width * scale / 2}
        y={-height * scale / 2 - 15}
        text={component.value || ''}
        fontSize={10}
        fill="#333"
        width={width * scale}
        align="center"
      />
      
      {/* Show dimensions when selected */}
      {isSelected && (
        <>
          <Text
            x={-width * scale / 2}
            y={height * scale / 2 + 5}
            text={`${width.toFixed(1)}mm`}
            fontSize={8}
            fill="#666"
            width={width * scale}
            align="center"
          />
          <Text
            x={width * scale / 2 + 5}
            y={-5}
            text={`${height.toFixed(1)}mm`}
            fontSize={8}
            fill="#666"
            rotation={90}
          />
        </>
      )}
      
      {/* Show lead holes as circles */}
      {component.lead_config.configuration === 'axial' && (
        <>
          <Circle
            x={-width * scale / 2 + 5}
            y={0}
            radius={2}
            fill="#444"
            opacity={0.6}
          />
          <Circle
            x={width * scale / 2 - 5}
            y={0}
            radius={2}
            fill="#444"
            opacity={0.6}
          />
        </>
      )}
      
      {/* Show lead holes for radial components */}
      {component.lead_config.configuration === 'radial' && (
        <>
          <Circle
            x={-5}
            y={height * scale / 2 - 5}
            radius={2}
            fill="#444"
            opacity={0.6}
          />
          <Circle
            x={5}
            y={height * scale / 2 - 5}
            radius={2}
            fill="#444"
            opacity={0.6}
          />
        </>
      )}
    </Group>
  )
}