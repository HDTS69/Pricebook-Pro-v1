import { useState, useEffect, useCallback } from 'react';
import { UndoService } from '@/services/UndoService';

/**
 * Hook to use the UndoService
 * @returns Object with canUndo, canRedo, undo, redo, addToHistory, and descriptions
 */
export function useUndoService() {
  const [canUndo, setCanUndo] = useState(UndoService.canUndo());
  const [canRedo, setCanRedo] = useState(UndoService.canRedo());
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [lastActionDescription, setLastActionDescription] = useState(UndoService.getCurrentActionDescription());
  const [undoActionDescription, setUndoActionDescription] = useState(UndoService.getPreviousActionDescription());
  const [redoActionDescription, setRedoActionDescription] = useState(UndoService.getNextActionDescription());

  // Update state when UndoService changes
  useEffect(() => {
    const unsubscribe = UndoService.subscribe(() => {
      setCanUndo(UndoService.canUndo());
      setCanRedo(UndoService.canRedo());
      setLastActionDescription(UndoService.getCurrentActionDescription());
      setUndoActionDescription(UndoService.getPreviousActionDescription());
      setRedoActionDescription(UndoService.getNextActionDescription());
    });

    return unsubscribe;
  }, []);

  // Add state to history
  const addToHistory = useCallback(<T>(state: T, description: string) => {
    UndoService.addToHistory(state, description);
  }, []);

  // Undo the last action
  const undo = useCallback(() => {
    if (UndoService.canUndo()) {
      setIsProcessingAction(true);
      const prevState = UndoService.undo();
      
      // Simulate processing delay
      setTimeout(() => {
        setIsProcessingAction(false);
      }, 300);
      
      return prevState;
    }
    return null;
  }, []);

  // Redo the last undone action
  const redo = useCallback(() => {
    if (UndoService.canRedo()) {
      setIsProcessingAction(true);
      const nextState = UndoService.redo();
      
      // Simulate processing delay
      setTimeout(() => {
        setIsProcessingAction(false);
      }, 300);
      
      return nextState;
    }
    return null;
  }, []);

  // Clear the history
  const clearHistory = useCallback(() => {
    UndoService.clear();
  }, []);

  return {
    canUndo,
    canRedo,
    undo,
    redo,
    addToHistory,
    clearHistory,
    isProcessingAction,
    lastActionDescription,
    undoActionDescription,
    redoActionDescription
  };
} 