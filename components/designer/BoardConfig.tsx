'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface BoardConfigProps {
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

export function BoardConfig({ boardDimensions, setBoardDimensions }: BoardConfigProps) {
  const [localDimensions, setLocalDimensions] = useState(boardDimensions)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    setLocalDimensions(boardDimensions)
  }, [boardDimensions])

  const handleApply = () => {
    // Validate dimensions
    const width = Math.max(50, Math.min(500, localDimensions.width))
    const height = Math.max(50, Math.min(500, localDimensions.height))
    const thickness = Math.max(0.8, Math.min(10, localDimensions.thickness))
    
    setBoardDimensions({ width, height, thickness })
    setIsExpanded(false)
  }

  const handleInputChange = (field: 'width' | 'height' | 'thickness', value: string) => {
    const numValue = parseFloat(value) || 0
    setLocalDimensions(prev => ({ ...prev, [field]: numValue }))
  }

  return (
    <div className="absolute top-2 right-2 z-10">
      {!isExpanded ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(true)}
          className="bg-white shadow-md"
        >
          Board: {boardDimensions.width}×{boardDimensions.height}mm
        </Button>
      ) : (
        <Card className="p-4 bg-white shadow-lg w-64">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-sm">Board Configuration</h3>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-3">
            <div>
              <Label htmlFor="board-width">Width (mm)</Label>
              <Input
                id="board-width"
                type="number"
                min="50"
                max="500"
                value={localDimensions.width}
                onChange={(e) => handleInputChange('width', e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="board-height">Height (mm)</Label>
              <Input
                id="board-height"
                type="number"
                min="50"
                max="500"
                value={localDimensions.height}
                onChange={(e) => handleInputChange('height', e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="board-thickness">Thickness (mm)</Label>
              <Input
                id="board-thickness"
                type="number"
                min="0.8"
                max="10"
                step="0.1"
                value={localDimensions.thickness}
                onChange={(e) => handleInputChange('thickness', e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                variant="default"
                onClick={handleApply}
                className="flex-1"
              >
                Apply
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setLocalDimensions(boardDimensions)
                  setIsExpanded(false)
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t text-xs text-gray-500">
            <p>Min: 50×50mm, Max: 500×500mm</p>
            <p>Thickness: 0.8-10mm</p>
          </div>
        </Card>
      )}
    </div>
  )
}