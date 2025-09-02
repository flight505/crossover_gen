'use client'

import { Scene3D } from '@/components/three/Scene3D'
import { ComponentLibrary3D } from '@/components/three/ComponentLibrary3D'
import { Toolbar3D } from '@/components/three/controls/Toolbar3D'

export default function DesignerPage() {
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