import { useState, useCallback } from 'react';

export function useListSelection<T extends { id?: number }>() {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Prevent browser text selection when Shift is held (mousedown fires before click)
  const handleRowMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.shiftKey) {
      e.preventDefault();
    }
  }, []);

  const handleRowClick = useCallback((item: T, e?: React.MouseEvent) => {
    const id = item.id;
    if (id == null) return;

    if (e?.shiftKey) {
      // Clear any residual text selection
      window.getSelection()?.removeAllRanges();

      // Shift+click: toggle item in multi-selection
      setSelectedIds(prev => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
    } else {
      // Normal click: single selection toggle
      setSelectedIds(prev => {
        if (prev.size === 1 && prev.has(id)) {
          return new Set();
        }
        return new Set([id]);
      });
    }
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback((item: T) => {
    return item.id != null && selectedIds.has(item.id);
  }, [selectedIds]);

  // For convenience: first selected id (for single-selection action bars)
  const selectedId = selectedIds.size > 0 ? Array.from(selectedIds)[0] : null;

  return {
    selectedIds,
    selectedId,
    selectedCount: selectedIds.size,
    handleRowClick,
    handleRowMouseDown,
    clearSelection,
    isSelected,
  };
}
