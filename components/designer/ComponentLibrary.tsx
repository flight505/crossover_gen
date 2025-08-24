'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card } from '@/components/ui/card'
import { getComponentsByType } from '@/lib/data-loader'
import { CrossoverComponent } from '@/types'

export function ComponentLibrary() {
  const [searchTerm, setSearchTerm] = useState('')

  const filterComponents = (components: CrossoverComponent[]) => {
    if (!searchTerm) return components
    const term = searchTerm.toLowerCase()
    return components.filter(
      (c) =>
        c.brand.toLowerCase().includes(term) ||
        c.series.toLowerCase().includes(term) ||
        c.value.toLowerCase().includes(term)
    )
  }

  const handleDragStart = (e: React.DragEvent, component: CrossoverComponent) => {
    e.dataTransfer.setData('component', JSON.stringify(component))
  }

  return (
    <div className="w-80 border-r bg-background flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-2">Component Library</h2>
        <input
          type="text"
          placeholder="Search components..."
          className="w-full px-3 py-2 border rounded-md text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <Tabs defaultValue="capacitors" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3 px-4">
          <TabsTrigger value="capacitors">Capacitors</TabsTrigger>
          <TabsTrigger value="resistors">Resistors</TabsTrigger>
          <TabsTrigger value="inductors">Inductors</TabsTrigger>
        </TabsList>
        <TabsContent value="capacitors" className="flex-1 px-4">
          <ScrollArea className="h-full">
            <div className="space-y-2 pb-4">
              {filterComponents(getComponentsByType('capacitor')).map((component, idx) => (
                <ComponentCard
                  key={idx}
                  component={component}
                  onDragStart={handleDragStart}
                />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
        <TabsContent value="resistors" className="flex-1 px-4">
          <ScrollArea className="h-full">
            <div className="space-y-2 pb-4">
              {filterComponents(getComponentsByType('resistor')).map((component, idx) => (
                <ComponentCard
                  key={idx}
                  component={component}
                  onDragStart={handleDragStart}
                />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
        <TabsContent value="inductors" className="flex-1 px-4">
          <ScrollArea className="h-full">
            <div className="space-y-2 pb-4">
              {filterComponents(getComponentsByType('inductor')).map((component, idx) => (
                <ComponentCard
                  key={idx}
                  component={component}
                  onDragStart={handleDragStart}
                />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ComponentCard({
  component,
  onDragStart,
}: {
  component: CrossoverComponent
  onDragStart: (e: React.DragEvent, component: CrossoverComponent) => void
}) {
  return (
    <Card
      className="p-3 cursor-move hover:shadow-md transition-shadow"
      draggable
      onDragStart={(e) => onDragStart(e, component)}
    >
      <div className="text-sm">
        <div className="font-semibold">
          {component.brand} {component.series}
        </div>
        <div className="text-muted-foreground">
          {component.value} {component.voltage && `• ${component.voltage}`}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {component.dimensions.diameter
            ? `⌀${component.dimensions.diameter}mm × ${component.dimensions.height}mm`
            : `${component.dimensions.length}×${component.dimensions.width}×${component.dimensions.height}mm`}
        </div>
      </div>
    </Card>
  )
}