'use client'

import { useRef, useState, useEffect } from 'react'
import { Stage, Layer, Rect, Group, Text, Line } from 'react-konva'
import { PlacedComponent, CrossoverComponent } from '@/types'
import Konva from 'konva'

interface DesignCanvasProps {
  placedComponents: PlacedComponent[]
  setPlacedComponents: React.Dispatch<React.SetStateAction<PlacedComponent[]>>
  selectedComponentId: string | null
  setSelectedComponentId: React.Dispatch<React.SetStateAction<string | null>>
  boardDimensions: {
    width: number
    height: number
    thickness: number
  }
  setBoardDimensions: React.Dispatch<React.SetStateAction<{
    width: number
    height: number
    thickness: number
  }>>
}

const SCALE = 3

export function DesignCanvasComponent({
  placedComponents,
  setPlacedComponents,
  selectedComponentId,
  setSelectedComponentId,
  boardDimensions,
  setBoardDimensions,
}: DesignCanvasProps) {
  const stageRef = useRef<Konva.Stage>(null)
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 })
  const [showGrid, setShowGrid] = useState(true)
  const [gridSize, setGridSize] = useState(5) // 5mm grid default

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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
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

    setPlacedComponents((prev) => [...prev, newComponent])
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'copy'
  }

  const handleComponentDragEnd = (e: Konva.KonvaEventObject<DragEvent>, id: string) => {
    const node = e.target
    const boardX = (stageSize.width - boardDimensions.width * SCALE) / 2
    const boardY = (stageSize.height - boardDimensions.height * SCALE) / 2

    const newX = (node.x() - boardX) / SCALE
    const newY = (node.y() - boardY) / SCALE

    setPlacedComponents((prev) =>
      prev.map((c) => (c.id === id ? { ...c, x: newX, y: newY } : c))
    )
  }

  const boardX = (stageSize.width - BOARD_WIDTH * SCALE) / 2
  const boardY = (stageSize.height - BOARD_HEIGHT * SCALE) / 2

  // Generate grid lines
  const gridLines = []
  if (showGrid) {
    // Vertical lines
    for (let i = 0; i <= BOARD_WIDTH; i += gridSize) {
      gridLines.push(
        <Line
          key={`v-${i}`}
          points={[boardX + i * SCALE, boardY, boardX + i * SCALE, boardY + BOARD_HEIGHT * SCALE]}
          stroke="#e0e0e0"
          strokeWidth={0.5}
        />
      )
    }
    // Horizontal lines
    for (let i = 0; i <= BOARD_HEIGHT; i += gridSize) {
      gridLines.push(
        <Line
          key={`h-${i}`}
          points={[boardX, boardY + i * SCALE, boardX + BOARD_WIDTH * SCALE, boardY + i * SCALE]}
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
      </div>
      
      <Stage width={stageSize.width} height={stageSize.height} ref={stageRef}>
        <Layer>
          <Rect
            x={boardX}
            y={boardY}
            width={BOARD_WIDTH * SCALE}
            height={BOARD_HEIGHT * SCALE}
            fill="#f5f5dc"
            stroke="#8B7355"
            strokeWidth={2}
            shadowBlur={10}
            shadowOffset={{ x: 5, y: 5 }}
            shadowOpacity={0.2}
          />
          
          {gridLines}

          {placedComponents.map((placed) => (
            <ComponentShape
              key={placed.id}
              placed={placed}
              boardX={boardX}
              boardY={boardY}
              scale={SCALE}
              isSelected={placed.id === selectedComponentId}
              onSelect={() => setSelectedComponentId(placed.id)}
              onDragEnd={(e) => handleComponentDragEnd(e, placed.id)}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  )
}

interface ComponentShapeProps {
  placed: PlacedComponent
  boardX: number
  boardY: number
  scale: number
  isSelected: boolean
  onSelect: () => void
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void
}

function ComponentShape({
  placed,
  boardX,
  boardY,
  scale,
  isSelected,
  onSelect,
  onDragEnd,
}: ComponentShapeProps) {
  const { component, x, y, rotation, flipVertical } = placed
  const dims = component.dimensions

  const width = dims.diameter ? dims.diameter : dims.length
  const height = dims.diameter ? dims.diameter : dims.width

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
      onDragEnd={onDragEnd}
      onClick={onSelect}
      onTap={onSelect}
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
        text={component.value}
        fontSize={10}
        fill="#333"
        width={width * scale}
        align="center"
      />
    </Group>
  )
}