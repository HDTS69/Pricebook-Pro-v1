import React, { createContext, useContext, useCallback, useState } from 'react';
import { useActionHistory as useHistoryHook, HistoryEntry } from '@/hooks/useActionHistory';
import { Quote, Customer } from '@/types/quote';

// Define the type for our application state that we want to track
export interface AppHistoryState {
  quotes: Quote[];
  currentQuoteId: string | null;
  customers: Customer[];
}

// Context interface
interface ActionHistoryContextType {
  state: AppHistoryState;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  trackAction: (newState: Partial<AppHistoryState>, actionDescription: string) => void;
  isProcessingAction: boolean;
}

// Create the context with default values
const ActionHistoryContext = createContext<ActionHistoryContextType>({
  state: { quotes: [], currentQuoteId: null, customers: [] },
  canUndo: false,
  canRedo: false,
  undo: () => {},
  redo: () => {},
  trackAction: () => {},
  isProcessingAction: false
});

// Hook to easily access the action history context
export function useActionHistory() {
  return useContext(ActionHistoryContext);
}

interface ActionHistoryProviderProps {
  initialState: AppHistoryState;
  onStateChange: (newState: AppHistoryState) => void;
  children: React.ReactNode;
}

export function ActionHistoryProvider({ 
  initialState, 
  onStateChange, 
  children 
}: ActionHistoryProviderProps) {
  const history = useHistoryHook(initialState);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Track an action by updating history and calling the state change handler
  const trackAction = useCallback((newPartialState: Partial<AppHistoryState>, actionDescription: string) => {
    const newState = { ...history.currentState, ...newPartialState };
    history.addToHistory(newState, actionDescription);
    onStateChange(newState);
  }, [history, onStateChange]);

  // Undo the last action
  const handleUndo = useCallback(() => {
    if (history.canUndo) {
      setIsProcessingAction(true);
      const previousState = history.undo();
      onStateChange(previousState);
      setTimeout(() => setIsProcessingAction(false), 300);
    }
  }, [history, onStateChange]);

  // Redo a previously undone action
  const handleRedo = useCallback(() => {
    if (history.canRedo) {
      setIsProcessingAction(true);
      const nextState = history.redo();
      onStateChange(nextState);
      setTimeout(() => setIsProcessingAction(false), 300);
    }
  }, [history, onStateChange]);

  const value = {
    state: history.currentState,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
    undo: handleUndo,
    redo: handleRedo,
    trackAction,
    isProcessingAction
  };

  return (
    <ActionHistoryContext.Provider value={value}>
      {children}
    </ActionHistoryContext.Provider>
  );
}

// Hook to easily access the action history context
export function useActionHistoryContext() {
  return useContext(ActionHistoryContext);
} 