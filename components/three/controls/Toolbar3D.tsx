'use client'

import { 
  FileDown, 
  Save, 
  FolderOpen, 
  Home
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useDesignerStore } from '@/lib/store/designer-store'
import { generateSTL } from '@/lib/3d-generation-new'

export function Toolbar3D() {
  const {
    showGrid,
    toggleGrid,
    showLabels,
    toggleLabels,
    showDimensions,
    toggleDimensions,
    components,
    board,
    clearProject,
    exportProject,
    loadProject,
  } = useDesignerStore()
  
  const handleExportSTL = async () => {
    try {
      const stlData = await generateSTL({ board, components })
      const blob = new Blob([stlData], { type: 'model/stl' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `crossover-${Date.now()}.stl`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error generating STL:', error)
    }
  }
  
  const handleSaveProject = () => {
    const projectData = exportProject()
    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `crossover-project-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }
  
  const handleLoadProject = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const text = await file.text()
        const data = JSON.parse(text)
        loadProject(data)
      }
    }
    input.click()
  }
  
  const handleResetView = () => {
    // Reset camera to default position
    useDesignerStore.setState({
      cameraPosition: [150, 150, 150],
      cameraTarget: [0, 0, 0]
    })
  }
  
  return (
    <div className="h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-2">
      {/* File operations */}
      <Button
        variant="ghost"
        size="sm"
        onClick={clearProject}
      >
        <FileDown className="w-4 h-4 mr-1" />
        New
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSaveProject}
      >
        <Save className="w-4 h-4 mr-1" />
        Save
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={handleLoadProject}
      >
        <FolderOpen className="w-4 h-4 mr-1" />
        Load
      </Button>
      
      <Separator orientation="vertical" className="h-8" />
      
      {/* Export */}
      <Button
        variant="default"
        size="sm"
        onClick={handleExportSTL}
        disabled={components.length === 0}
      >
        <FileDown className="w-4 h-4 mr-1" />
        Export STL
      </Button>
      
      <Separator orientation="vertical" className="h-8" />
      
      {/* View controls */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Switch
            id="grid"
            checked={showGrid}
            onCheckedChange={toggleGrid}
          />
          <Label htmlFor="grid" className="text-sm">Grid</Label>
        </div>
        
        <div className="flex items-center gap-2">
          <Switch
            id="labels"
            checked={showLabels}
            onCheckedChange={toggleLabels}
          />
          <Label htmlFor="labels" className="text-sm">Labels</Label>
        </div>
        
        <div className="flex items-center gap-2">
          <Switch
            id="dimensions"
            checked={showDimensions}
            onCheckedChange={toggleDimensions}
          />
          <Label htmlFor="dimensions" className="text-sm">Dimensions</Label>
        </div>
      </div>
      
      <Separator orientation="vertical" className="h-8" />
      
      {/* Camera controls */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleResetView}
      >
        <Home className="w-4 h-4 mr-1" />
        Reset View
      </Button>
      
      <div className="flex-1" />
      
      {/* Component count */}
      <div className="text-sm text-gray-600">
        {components.length} component{components.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
}