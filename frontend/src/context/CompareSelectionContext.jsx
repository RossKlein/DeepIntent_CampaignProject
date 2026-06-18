import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { readCompareSelection, writeCompareSelection } from '../utils/compareSelection'

const CompareSelectionContext = createContext(null)

export function CompareSelectionProvider({ children }) {
  const [selectedIds, setSelectedIds] = useState(() => new Set(readCompareSelection()))

  const toggleSelected = useCallback((id) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      writeCompareSelection(next)
      return next
    })
  }, [])

  const setSelection = useCallback((ids) => {
    setSelectedIds((current) => {
      const next = new Set(ids)
      if (
        current.size === next.size &&
        [...current].every((id) => next.has(id))
      ) {
        return current
      }
      writeCompareSelection(next)
      return next
    })
  }, [])

  const clearSelection = useCallback(() => {
    writeCompareSelection(new Set())
    setSelectedIds(new Set())
  }, [])

  const value = useMemo(
    () => ({ selectedIds, toggleSelected, setSelection, clearSelection }),
    [selectedIds, toggleSelected, setSelection, clearSelection],
  )

  return (
    <CompareSelectionContext.Provider value={value}>
      {children}
    </CompareSelectionContext.Provider>
  )
}

export function useCompareSelection() {
  const context = useContext(CompareSelectionContext)
  if (!context) {
    throw new Error('useCompareSelection must be used within CompareSelectionProvider')
  }
  return context
}
