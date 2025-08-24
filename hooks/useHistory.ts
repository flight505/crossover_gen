import { useState, useCallback } from 'react'

interface HistoryState<T> {
  current: T
  history: T[]
  historyIndex: number
  canUndo: boolean
  canRedo: boolean
  push: (state: T) => void
  undo: () => void
  redo: () => void
  clear: () => void
}

export function useHistory<T>(initialState: T, maxHistory: number = 50): HistoryState<T> {
  const [history, setHistory] = useState<T[]>([initialState])
  const [historyIndex, setHistoryIndex] = useState(0)

  const push = useCallback((newState: T) => {
    setHistory(prev => {
      // Remove any history after current index (when pushing after undo)
      const newHistory = prev.slice(0, historyIndex + 1)
      newHistory.push(newState)
      
      // Limit history size
      if (newHistory.length > maxHistory) {
        newHistory.shift()
        return newHistory
      }
      
      return newHistory
    })
    setHistoryIndex(prev => Math.min(prev + 1, maxHistory - 1))
  }, [historyIndex, maxHistory])

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1)
    }
  }, [historyIndex])

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1)
    }
  }, [historyIndex, history.length])

  const clear = useCallback(() => {
    const current = history[historyIndex]
    setHistory([current])
    setHistoryIndex(0)
  }, [history, historyIndex])

  return {
    current: history[historyIndex],
    history,
    historyIndex,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    push,
    undo,
    redo,
    clear
  }
}