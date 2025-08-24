'use client'

import dynamic from 'next/dynamic'

export const DesignCanvas = dynamic(
  () => import('./DesignCanvas').then((mod) => mod.DesignCanvasComponent),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading canvas...</div>
      </div>
    )
  }
)