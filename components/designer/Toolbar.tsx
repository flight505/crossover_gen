'use client'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export function Toolbar() {
  return (
    <div className="border-b bg-background px-4 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">Crossover Designer</h1>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex gap-1">
            <Button variant="ghost" size="sm">
              New
            </Button>
            <Button variant="ghost" size="sm">
              Save
            </Button>
            <Button variant="ghost" size="sm">
              Load
            </Button>
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