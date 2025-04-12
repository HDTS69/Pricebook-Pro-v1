import React from 'react';
import { Button } from "@/components/ui/Button";
import { Undo2, Redo2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip';

interface QuoteActionToolbarProps {
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isProcessingAction?: boolean;
  lastActionDescription?: string;
}

export function QuoteActionToolbar({
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  isProcessingAction = false,
  lastActionDescription = ''
}: QuoteActionToolbarProps): React.ReactElement {
  return (
    <TooltipProvider>
      <div className="flex items-center space-x-1">
        <Tooltip>
          <TooltipTrigger asChild>
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
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {canUndo ? (
              <p>{`Undo: ${lastActionDescription || 'Last action'}`}</p>
            ) : (
              <p>Nothing to undo</p>
            )}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
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
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {canRedo ? (
              <p>Redo action</p>
            ) : (
              <p>Nothing to redo</p>
            )}
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
} 