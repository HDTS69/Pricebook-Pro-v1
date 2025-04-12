import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { X, History, Undo2, Redo2 } from 'lucide-react';
import { UndoService } from '@/services/UndoService';

interface ActionHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function ActionHistoryPanel({
  isOpen,
  onClose,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: ActionHistoryPanelProps) {
  const [historyEntries, setHistoryEntries] = React.useState<{ description: string; isActive: boolean }[]>([]);
  const [currentIndex, setCurrentIndex] = React.useState<number>(0);

  // Fetch history entries from UndoService
  React.useEffect(() => {
    const fetchHistoryEntries = () => {
      // For demo purposes, we're accessing the UndoService directly
      // In a production app, you'd want to expose this through a context provider or hook
      const entries: { description: string; isActive: boolean }[] = [];

      const history = UndoService['history'] as any[]; // Access private field for demo only
      const index = UndoService['historyIndex'] as number;

      if (history && history.length > 0) {
        history.forEach((entry, i) => {
          entries.push({
            description: entry.description || `Action ${i + 1}`,
            isActive: i === index
          });
        });
      }

      setHistoryEntries(entries);
      setCurrentIndex(index);
    };

    fetchHistoryEntries();

    // Subscribe to history changes
    const unsubscribe = UndoService.subscribe(fetchHistoryEntries);
    return unsubscribe;
  }, []);

  if (!isOpen) return null;

  return (
    <Card className="fixed top-16 right-4 w-80 z-50 shadow-lg">
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <History className="h-4 w-4" />
          Action History
        </CardTitle>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="py-2 px-0">
        <div className="flex justify-between items-center px-4 pb-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onUndo} 
            disabled={!canUndo}
            className="w-24 flex items-center gap-1"
          >
            <Undo2 className="h-3.5 w-3.5" />
            Undo
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRedo} 
            disabled={!canRedo}
            className="w-24 flex items-center gap-1"
          >
            <Redo2 className="h-3.5 w-3.5" />
            Redo
          </Button>
        </div>
        <ScrollArea className="h-64 px-2">
          <div className="space-y-1 p-2">
            {historyEntries.length > 0 ? (
              historyEntries.map((entry, index) => (
                <div 
                  key={index} 
                  className={`
                    text-xs rounded px-2 py-1.5 border
                    ${entry.isActive ? 'bg-accent border-accent' : 'bg-card border-muted'}
                    ${index > currentIndex ? 'opacity-50' : 'opacity-100'}
                  `}
                >
                  {entry.description}
                </div>
              ))
            ) : (
              <div className="text-xs text-muted-foreground text-center py-4">
                No actions recorded yet.
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
} 