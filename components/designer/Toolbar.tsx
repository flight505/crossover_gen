'use client'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { PlacedComponent } from '@/types'
import { useRef } from 'react'

interface ToolbarProps {
  placedComponents: PlacedComponent[]
  setPlacedComponents: React.Dispatch<React.SetStateAction<PlacedComponent[]>>
  setSelectedComponentId: React.Dispatch<React.SetStateAction<string | null>>
}

export function Toolbar({ placedComponents, setPlacedComponents, setSelectedComponentId }: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleNew = () => {
    if (placedComponents.length > 0) {
      if (confirm('Clear all components? This cannot be undone.')) {
        setPlacedComponents([])
        setSelectedComponentId(null)
      }
    }
  }

  const handleSave = () => {
    const design = {
      version: '1.0',
      board: {
        width: 200,
        height: 150,
        thickness: 1.6
      },
      components: placedComponents,
      createdAt: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(design, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `crossover-design-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleLoad = () => {
    fileInputRef.current?.click()
  }

  const handleFileLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const design = JSON.parse(event.target?.result as string)
        if (design.components && Array.isArray(design.components)) {
          setPlacedComponents(design.components)
          setSelectedComponentId(null)
        } else {
          alert('Invalid design file format')
        }
      } catch {
        alert('Failed to load design file')
      }
    }
    reader.readAsText(file)
    e.target.value = '' // Reset input
  }

  return (
    <div className="border-b bg-background px-4 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">Crossover Designer</h1>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={handleNew}>
              New
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSave} disabled={placedComponents.length === 0}>
              Save
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLoad}>
              Load
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileLoad}
              className="hidden"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="default" size="sm">
            Generate 3D Model
          </Button>
          <Button variant="outline" size="sm">
            Export STL
          </Button>
        </div>
      </div>
    </div>
  )
}