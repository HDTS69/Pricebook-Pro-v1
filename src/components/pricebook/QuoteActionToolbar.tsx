import React from 'react';
import { Button } from "@/components/ui/button";
import { Undo2, Redo2 } from 'lucide-react';

interface QuoteActionToolbarProps {
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isProcessingAction?: boolean;
}

export function QuoteActionToolbar({
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  isProcessingAction = false,
}: QuoteActionToolbarProps): React.ReactElement {
  return (
    <div className="flex items-center space-x-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={onUndo}
        disabled={!canUndo || isProcessingAction}
        className="h-8 w-8"
        aria-label="Undo last action"
      >
        <Undo2 className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={onRedo}
        disabled={!canRedo || isProcessingAction}
        className="h-8 w-8"
        aria-label="Redo last undone action"
      >
        <Redo2 className="h-4 w-4" />
      </Button>
    </div>
  );
} 