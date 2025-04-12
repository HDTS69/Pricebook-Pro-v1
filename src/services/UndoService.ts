// Define an interface for the history entry
interface HistoryEntry<T> {
  state: T;
  description: string;
}

// Define key for localStorage persistence
const HISTORY_STORAGE_KEY = 'pricebook_action_history';

// Define the Undo Service class
class UndoServiceClass {
  private history: HistoryEntry<any>[] = [];
  private historyIndex: number = -1;
  private maxHistory: number = 50;
  private persistenceEnabled: boolean = true;

  private listeners: (() => void)[] = [];

  constructor() {
    this.loadFromStorage();
  }

  // Add a state to the history
  addToHistory<T>(state: T, description: string): void {
    // Remove any future states if we've gone back in history
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }

    // Add new state to history
    this.history.push({ state, description });
    
    // Limit history size
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    } else {
      this.historyIndex++;
    }

    // Save history to storage
    if (this.persistenceEnabled) {
      this.saveToStorage();
    }

    // Notify listeners
    this.notifyListeners();
  }

  // Undo to the previous state
  undo<T>(): T | null {
    if (!this.canUndo()) {
      return null;
    }

    this.historyIndex--;
    const entry = this.history[this.historyIndex];
    
    // Save state to storage
    if (this.persistenceEnabled) {
      this.saveToStorage();
    }

    // Notify listeners
    this.notifyListeners();
    
    return entry.state;
  }

  // Redo to the next state
  redo<T>(): T | null {
    if (!this.canRedo()) {
      return null;
    }

    this.historyIndex++;
    const entry = this.history[this.historyIndex];
    
    // Save state to storage
    if (this.persistenceEnabled) {
      this.saveToStorage();
    }

    // Notify listeners
    this.notifyListeners();
    
    return entry.state;
  }

  // Check if undo is available
  canUndo(): boolean {
    return this.historyIndex > 0;
  }

  // Check if redo is available
  canRedo(): boolean {
    return this.historyIndex < this.history.length - 1;
  }

  // Get the description of the current action
  getCurrentActionDescription(): string {
    if (this.historyIndex >= 0 && this.historyIndex < this.history.length) {
      return this.history[this.historyIndex].description;
    }
    return '';
  }

  // Get the description of the previous action (for undo tooltip)
  getPreviousActionDescription(): string {
    if (this.historyIndex > 0) {
      return this.history[this.historyIndex - 1].description;
    }
    return '';
  }

  // Get the description of the next action (for redo tooltip)
  getNextActionDescription(): string {
    if (this.historyIndex < this.history.length - 1) {
      return this.history[this.historyIndex + 1].description;
    }
    return '';
  }

  // Subscribe to changes
  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notify all listeners
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  // Clear all history
  clear(): void {
    this.history = [];
    this.historyIndex = -1;
    
    // Clear from storage
    if (this.persistenceEnabled) {
      localStorage.removeItem(HISTORY_STORAGE_KEY);
    }

    this.notifyListeners();
  }

  // Enable/disable persistence
  setPersistenceEnabled(enabled: boolean): void {
    this.persistenceEnabled = enabled;
    if (enabled) {
      this.saveToStorage();
    }
  }

  // Get all history entries
  getAllHistory(): HistoryEntry<any>[] {
    return [...this.history];
  }

  // Get current history index
  getCurrentIndex(): number {
    return this.historyIndex;
  }

  // Save history to localStorage
  private saveToStorage(): void {
    try {
      const serializedState = JSON.stringify({
        history: this.history,
        historyIndex: this.historyIndex
      });
      localStorage.setItem(HISTORY_STORAGE_KEY, serializedState);
    } catch (error) {
      console.error('Failed to save history to localStorage:', error);
    }
  }

  // Load history from localStorage
  private loadFromStorage(): void {
    try {
      const serializedState = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (serializedState) {
        const { history, historyIndex } = JSON.parse(serializedState);
        this.history = history;
        this.historyIndex = historyIndex;
      }
    } catch (error) {
      console.error('Failed to load history from localStorage:', error);
    }
  }
}

// Export a singleton instance
export const UndoService = new UndoServiceClass(); 