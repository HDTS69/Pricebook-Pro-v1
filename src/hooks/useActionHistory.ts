import { useState, useCallback } from 'react';

export interface HistoryEntry<T> {
  state: T;
  description: string;
}

export function useActionHistory<T>(initialState: T) {
  const [history, setHistory] = useState<HistoryEntry<T>[]>([{ state: initialState, description: 'Initial state' }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  // Check if undo/redo operations are available
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  
  // Add a new state to history
  const addToHistory = useCallback((newState: T, actionDescription: string) => {
    setHistory(prevHistory => {
      // Remove any future states if we've gone back in history
      const newHistory = prevHistory.slice(0, historyIndex + 1);
      // Add new state
      return [...newHistory, { state: newState, description: actionDescription }];
    });
    setHistoryIndex(prevIndex => prevIndex + 1);
  }, [historyIndex]);
  
  // Undo to the previous state
  const undo = useCallback(() => {
    if (canUndo) {
      setHistoryIndex(prevIndex => prevIndex - 1);
      return history[historyIndex - 1].state;
    }
    return history[historyIndex].state;
  }, [canUndo, history, historyIndex]);
  
  // Redo to the next state
  const redo = useCallback(() => {
    if (canRedo) {
      setHistoryIndex(prevIndex => prevIndex + 1);
      return history[historyIndex + 1].state;
    }
    return history[historyIndex].state;
  }, [canRedo, history, historyIndex]);
  
  // Get current state
  const currentState = history[historyIndex].state;
  
  // Get the description of the last action
  const lastActionDescription = historyIndex > 0 ? history[historyIndex].description : '';
  
  return {
    currentState,
    addToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    lastActionDescription,
    historyLength: history.length,
    currentHistoryIndex: historyIndex
  };
} 