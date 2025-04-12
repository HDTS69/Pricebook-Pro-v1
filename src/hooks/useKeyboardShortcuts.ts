import { useEffect } from 'react';

interface KeyboardShortcutOptions {
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  preventDefault?: boolean;
}

/**
 * Hook to register keyboard shortcuts
 * @param key The key to listen for (e.g., 'z', 'y')
 * @param callback The function to call when the shortcut is triggered
 * @param options Options for the shortcut (e.g., modifier keys)
 */
export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  options: KeyboardShortcutOptions = {}
) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if the key and modifier keys match
      if (
        event.key.toLowerCase() === key.toLowerCase() &&
        (options.ctrlKey === undefined || event.ctrlKey === options.ctrlKey) &&
        (options.altKey === undefined || event.altKey === options.altKey) &&
        (options.shiftKey === undefined || event.shiftKey === options.shiftKey) &&
        (options.metaKey === undefined || event.metaKey === options.metaKey)
      ) {
        if (options.preventDefault) {
          event.preventDefault();
        }
        callback();
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [key, callback, options]);
}

/**
 * Hook to register undo/redo keyboard shortcuts
 * @param undoCallback Function to call for undo (Ctrl+Z)
 * @param redoCallback Function to call for redo (Ctrl+Y or Ctrl+Shift+Z)
 */
export function useUndoRedoShortcuts(
  undoCallback: () => void,
  redoCallback: () => void
) {
  // Register Ctrl+Z for undo
  useKeyboardShortcut('z', undoCallback, {
    ctrlKey: true,
    preventDefault: true,
  });

  // Register Ctrl+Y for redo
  useKeyboardShortcut('y', redoCallback, {
    ctrlKey: true,
    preventDefault: true,
  });

  // Also register Ctrl+Shift+Z for redo (alternative shortcut)
  useKeyboardShortcut('z', redoCallback, {
    ctrlKey: true,
    shiftKey: true,
    preventDefault: true,
  });
} 