'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useDesignerStore } from '@/lib/store/designer-store'
import { getAllComponents, createComponent3D, type EnrichedComponentData } from '@/lib/component-data-loader'

const COMPONENT_COLORS = {
  capacitor: 'bg-red-100 border-red-300',
  resistor: 'bg-blue-100 border-blue-300',
  inductor: 'bg-green-100 border-green-300',
}

export function ComponentLibrary3D() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTab, setSelectedTab] = useState('all')
  const addComponent = useDesignerStore((state) => state.addComponent)
  
  const componentsData = getAllComponents()
  const filteredComponents = componentsData.filter((comp) => {
    const matchesSearch = searchTerm === '' || 
      comp.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comp.series.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comp.value.toString().includes(searchTerm)
    
    const matchesTab = selectedTab === 'all' || comp.part_type === selectedTab
    
    return matchesSearch && matchesTab
  })
  
  const handleAddComponent = (comp: EnrichedComponentData) => {
    // Add component at board center with some random offset
    const offsetX = (Math.random() - 0.5) * 20
    const offsetZ = (Math.random() - 0.5) * 20
    
    const component3D = createComponent3D(comp, [offsetX, 5, offsetZ])
    addComponent(component3D)
  }
  
  return (
    <div className="w-80 h-full bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold mb-3">Component Library</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search components..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex-1 flex flex-col">
        <TabsList className="mx-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="capacitor">Capacitors</TabsTrigger>
          <TabsTrigger value="resistor">Resistors</TabsTrigger>
          <TabsTrigger value="inductor">Inductors</TabsTrigger>
        </TabsList>
        
        <TabsContent value={selectedTab} className="flex-1 mt-0">
          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="p-4 space-y-2">
              {filteredComponents.map((comp, index) => (
                <div
                  key={index}
                  className={`p-3 border rounded-lg cursor-pointer hover:shadow-md transition-shadow ${
                    COMPONENT_COLORS[comp.part_type as keyof typeof COMPONENT_COLORS]
                  }`}
                  onClick={() => handleAddComponent(comp)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-sm">{comp.brand}</div>
                      <div className="text-xs text-gray-600">{comp.series}</div>
                      <div className="text-lg font-bold mt-1">
                        {comp.value}{comp.value_unit}
                      </div>
                    </div>
                    <div className="text-right text-xs text-gray-500">
                      {comp.voltage_or_power && (
                        <div>{comp.voltage_or_power}{comp.part_type === 'capacitor' ? 'V' : 'W'}</div>
                      )}
                      {comp.body_shape === 'cylinder' && comp.body_diameter_mm && (
                        <div>⌀{comp.body_diameter_mm}mm</div>
                      )}
                      {comp.body_shape === 'coil' && comp.outer_diameter_mm && (
                        <div>⌀{comp.outer_diameter_mm}mm</div>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Click to add to board
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}