'use client'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { PlacedComponent } from '@/types'
import { useRef, useState } from 'react'
import { generate3DModel, downloadSTL, BoardDimensions } from '@/lib/3d-generation'
import { demoDesign } from '@/data/demo-layout'

interface ToolbarProps {
  placedComponents: PlacedComponent[]
  setPlacedComponents: React.Dispatch<React.SetStateAction<PlacedComponent[]>>
  setSelectedComponentIds: React.Dispatch<React.SetStateAction<string[]>>
  boardDimensions: BoardDimensions
  setBoardDimensions?: React.Dispatch<React.SetStateAction<BoardDimensions>>
}

export function Toolbar({ placedComponents, setPlacedComponents, setSelectedComponentIds, boardDimensions, setBoardDimensions }: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [generated3DModel, setGenerated3DModel] = useState<any>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleNew = () => {
    if (placedComponents.length > 0) {
      if (confirm('Clear all components? This cannot be undone.')) {
        setPlacedComponents([])
        setSelectedComponentIds([])
      }
    }
  }

  const handleSave = () => {
    const design = {
      version: '1.0',
      board: boardDimensions,
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

  const handleLoadExample = () => {
    if (placedComponents.length > 0) {
      if (!confirm('Loading the example will replace your current design. Continue?')) {
        return
      }
    }
    setPlacedComponents(demoDesign.components)
    if (setBoardDimensions) {
      setBoardDimensions(demoDesign.board)
    }
    setSelectedComponentIds([])
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
          setSelectedComponentIds([])
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

  const handleGenerate3D = async () => {
    if (placedComponents.length === 0) {
      alert('Please add components to the board before generating a 3D model.')
      return
    }

    setIsGenerating(true)
    try {
      // Generate the 3D model
      const model = generate3DModel(placedComponents, boardDimensions)
      setGenerated3DModel(model)
      alert('3D model generated successfully! You can now export it as STL.')
    } catch (error) {
      console.error('Failed to generate 3D model:', error)
      alert('Failed to generate 3D model. Please check the console for details.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleExportSTL = () => {
    if (!generated3DModel) {
      alert('Please generate a 3D model first.')
      return
    }

    try {
      downloadSTL(generated3DModel, `crossover-plate-${Date.now()}.stl`)
    } catch (error) {
      console.error('Failed to export STL:', error)
      alert('Failed to export STL file. Please check the console for details.')
    }
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
            <Button variant="ghost" size="sm" onClick={handleLoadExample}>
              Load Example
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
          <Button 
            variant="default" 
            size="sm" 
            onClick={handleGenerate3D}
            disabled={placedComponents.length === 0 || isGenerating}
          >
            {isGenerating ? 'Generating...' : 'Generate 3D Model'}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExportSTL}
            disabled={!generated3DModel}
          >
            Export STL
          </Button>
        </div>
      </div>
    </div>
  )
}