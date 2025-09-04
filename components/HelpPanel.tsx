'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  HelpCircle, 
  X, 
  Keyboard,
  MousePointer,
  Move,
  RotateCw,
  Trash,
  Copy,
  Undo,
  Redo,
  ZoomIn
} from 'lucide-react'

export function HelpPanel() {
  const [isOpen, setIsOpen] = useState(false)

  const shortcuts = [
    { icon: <MousePointer className="w-4 h-4" />, key: 'Click', action: 'Select component' },
    { icon: <MousePointer className="w-4 h-4" />, key: 'Shift+Click', action: 'Add to selection' },
    { icon: <MousePointer className="w-4 h-4" />, key: 'Drag', action: 'Move component' },
    { icon: <Move className="w-4 h-4" />, key: '↑↓←→', action: 'Move selected (1mm)' },
    { icon: <Move className="w-4 h-4" />, key: 'Shift+↑↓←→', action: 'Move selected (5mm)' },
    { icon: <RotateCw className="w-4 h-4" />, key: 'R', action: 'Rotate 90° clockwise' },
    { icon: <RotateCw className="w-4 h-4" />, key: 'Shift+R', action: 'Rotate 90° counter-clockwise' },
    { icon: <Trash className="w-4 h-4" />, key: 'Delete/Backspace', action: 'Delete selected' },
    { icon: <Copy className="w-4 h-4" />, key: 'Ctrl/Cmd+D', action: 'Duplicate selected' },
    { icon: <Keyboard className="w-4 h-4" />, key: 'Ctrl/Cmd+A', action: 'Select all' },
    { icon: <Keyboard className="w-4 h-4" />, key: 'Escape', action: 'Deselect all' },
    { icon: <Undo className="w-4 h-4" />, key: 'Ctrl/Cmd+Z', action: 'Undo' },
    { icon: <Redo className="w-4 h-4" />, key: 'Ctrl/Cmd+Y', action: 'Redo' },
    { icon: <ZoomIn className="w-4 h-4" />, key: 'Scroll', action: 'Zoom in/out' },
  ]

  const tips = [
    'Keep inductors at least 50mm apart to prevent magnetic interference',
    'Orient adjacent inductors at 90° to each other',
    'Position inductors at least 150mm from speaker drivers',
    'Capacitors can be placed anywhere - they are not affected by magnetic fields',
    'Use zip-tie slots to secure large inductors',
    'Add labels to identify component values on the finished board',
    'The board automatically resizes to fit your components',
    'Enable grid snapping for precise component alignment'
  ]

  return (
    <>
      {/* Floating Help Button */}
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-4 right-4 z-50 shadow-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="w-5 h-5" /> : <HelpCircle className="w-5 h-5" />}
      </Button>

      {/* Help Panel */}
      {isOpen && (
        <Card className="fixed bottom-16 right-4 z-50 w-96 max-h-[600px] shadow-xl">
          <CardHeader>
            <CardTitle>Help & Keyboard Shortcuts</CardTitle>
            <CardDescription>
              Quick reference for using the crossover designer
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4 overflow-y-auto max-h-[480px]">
            {/* Keyboard Shortcuts */}
            <div>
              <h3 className="font-semibold text-sm mb-2">Keyboard Shortcuts</h3>
              <div className="space-y-1">
                {shortcuts.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between py-1 text-sm">
                    <div className="flex items-center gap-2">
                      {shortcut.icon}
                      <span className="text-gray-600">{shortcut.action}</span>
                    </div>
                    <kbd className="px-2 py-1 text-xs bg-gray-100 border rounded">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>

            {/* Workflow */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-sm mb-2">Workflow</h3>
              <ol className="space-y-1 text-sm text-gray-600">
                <li>1. Drag components from library to board</li>
                <li>2. Position and rotate as needed</li>
                <li>3. Board auto-resizes to fit</li>
                <li>4. Review operations in timeline</li>
                <li>5. Click &quot;Generate Board&quot; to create 3D model</li>
                <li>6. Export STL for 3D printing</li>
              </ol>
            </div>

            {/* Tips */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-sm mb-2">Tips & Best Practices</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                {tips.map((tip, index) => (
                  <li key={index} className="flex gap-2">
                    <span className="text-gray-400">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* About */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-sm mb-2">About</h3>
              <p className="text-sm text-gray-600">
                Crossover Gen helps you design 3D-printable mounting boards for speaker crossover components. 
                The app automatically creates recesses and lead holes for your components.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Version 2.0 - Procedural Generation
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}