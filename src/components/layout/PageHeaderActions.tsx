import React from 'react';
import { Button } from "@/components/ui/Button";
import { QuoteActionToolbar } from '@/components/pricebook/QuoteActionToolbar'; 
import { PanelRightClose, PanelRightOpen, History } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip';

interface PageHeaderActionsProps {
  isSidebarVisible: boolean;
  onToggleSidebar: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isProcessingAction?: boolean;
  lastActionDescription?: string;
  showHistoryPanel?: boolean;
  onToggleHistoryPanel?: () => void;
}

export function PageHeaderActions({
  isSidebarVisible,
  onToggleSidebar,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  isProcessingAction = false,
  lastActionDescription = '',
  showHistoryPanel = false,
  onToggleHistoryPanel,
}: PageHeaderActionsProps): React.ReactElement {
  return (
    <div className="fixed top-4 right-4 z-[60] flex items-center space-x-1">
      {/* Render Undo/Redo Toolbar only if sidebar is visible */}
      {isSidebarVisible && (
        <QuoteActionToolbar 
            onUndo={onUndo}
            onRedo={onRedo}
            canUndo={canUndo}
            canRedo={canRedo}
            isProcessingAction={isProcessingAction}
            lastActionDescription={lastActionDescription}
        />
      )}
      
      {/* History Button */}
      {onToggleHistoryPanel && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleHistoryPanel}
              className={`h-8 w-8 ${showHistoryPanel ? 'bg-accent' : ''}`}
              aria-label="Toggle History Panel"
              title="Action History"
            >
              <History className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Action History</p>
          </TooltipContent>
        </Tooltip>
      )}
      
      {/* Theme Toggle */}
      <ThemeToggle />
      
      {/* Always render the toggle button */}
      <Button 
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          title={isSidebarVisible ? "Hide Quote Panel" : "Show Quote Panel"}
          className="h-8 w-8 z-10" // Match toolbar button size and add z-index
      >
          {isSidebarVisible ? (
              <PanelRightClose className="h-4 w-4" /> // Match toolbar icon size
          ) : (
              <PanelRightOpen className="h-4 w-4" /> // Match toolbar icon size
          )}
      </Button>
    </div>
  );
} 