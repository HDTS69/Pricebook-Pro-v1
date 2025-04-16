import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Quote, Customer, QuoteTask, Tier, Addon, Address } from "@/types/quote";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  List,
  DollarSign,
  PlusCircle,
  ChevronsUpDown,
  X as CloseIcon,
  Trash2,
  Pencil,
  Settings2,
  Check,
  Send,
  CheckCircle,
  Eye,
  Mail,
  Smartphone,
  Copy,
  Trash,
  Eraser,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/Checkbox";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/Tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Switch } from "@/components/ui/Switch";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { useCustomers } from "@/contexts/CustomerContext";

// --- Customer Details Section Component ---
import { CustomerDetailsSection } from './CustomerDetailsSection';

// --- Quote Dropdown Section Component ---
interface QuoteDropdownSectionProps {
  customerQuotes: Quote[];
  currentQuote: Quote | null;
  baseQuoteNumber: string;
  customer: Customer | null;
  onQuoteSelect: (quoteId: string) => void;
  onAddQuote: (nextSequenceNumber: number) => void;
  onRenameQuote: (quoteId: string, newName: string) => void;
  onDeleteQuote: (quoteId: string) => void;
  onDuplicateQuote: (quoteId: string) => void;
  onDeleteAllQuotes: (customerId: string) => void;
  formatCurrency: (amount: number) => string;
}

function QuoteDropdownSection({
  customerQuotes,
  currentQuote,
  baseQuoteNumber,
  customer,
  onQuoteSelect,
  onAddQuote,
  onRenameQuote,
  onDeleteQuote,
  onDuplicateQuote,
  onDeleteAllQuotes,
  formatCurrency,
}: QuoteDropdownSectionProps) {
  const [isQuoteDropdownOpen, setIsQuoteDropdownOpen] = useState(false);
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
  const [editingQuoteName, setEditingQuoteName] = useState<string>("");
  const quoteInputRef = useRef<HTMLInputElement>(null);
  const [quoteConfirmDeleteId, setQuoteConfirmDeleteId] = useState<string | null>(null);
  const [isProcessingQuoteAction, setIsProcessingQuoteAction] = useState<boolean>(false);
  const [confirmingDeleteAll, setConfirmingDeleteAll] = useState<boolean>(false);
  const [isQuoteDuplicatePopoverOpen, setIsQuoteDuplicatePopoverOpen] = useState<boolean>(false);
  const [duplicatingQuoteId, setDuplicatingQuoteId] = useState<string | null>(null);
  const [duplicateQuoteTargetIds, setDuplicateQuoteTargetIds] = useState<string[]>([]);
  const [duplicateQuoteNewCount, setDuplicateQuoteNewCount] = useState<number>(1);

  useEffect(() => {
    if (editingQuoteId && quoteInputRef.current) {
      quoteInputRef.current.focus();
    }
  }, [editingQuoteId]);

  useEffect(() => {
    if (!isQuoteDropdownOpen || currentQuote?.id) {
        setEditingQuoteId(null);
        setEditingQuoteName("");
        setQuoteConfirmDeleteId(null);
        setConfirmingDeleteAll(false);
        setIsQuoteDuplicatePopoverOpen(false);
        setDuplicatingQuoteId(null);
        setDuplicateQuoteTargetIds([]);
        setDuplicateQuoteNewCount(1);
    }
  }, [isQuoteDropdownOpen, currentQuote?.id]);

  const handleQuoteClick = (quoteId: string) => {
    if (editingQuoteId === quoteId || quoteConfirmDeleteId === quoteId || isProcessingQuoteAction) return;
    onQuoteSelect(quoteId);
    setIsQuoteDropdownOpen(false);
  };

  const handleStartRenameQuote = (quote: Quote) => {
    setEditingQuoteId(quote.id);
    setEditingQuoteName(quote.name);
    setQuoteConfirmDeleteId(null);
    setConfirmingDeleteAll(false);
  };

  const handleCancelRenameQuote = () => {
    setEditingQuoteId(null);
    setEditingQuoteName("");
  };

  const handleSaveRenameQuote = () => {
    if (!editingQuoteId) return;
    const trimmedName = editingQuoteName.trim();
    const originalQuote = customerQuotes.find(q => q.id === editingQuoteId);

    if (!trimmedName || !originalQuote || originalQuote.name === trimmedName) {
      handleCancelRenameQuote();
      return;
    }

    setIsProcessingQuoteAction(true);
    onRenameQuote(editingQuoteId, trimmedName);
    setTimeout(() => {
      setEditingQuoteId(null);
      setEditingQuoteName("");
      setIsProcessingQuoteAction(false);
    }, 300);
  };

  const handleRenameKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSaveRenameQuote();
    } else if (event.key === 'Escape') {
      handleCancelRenameQuote();
    }
  };

  const handleDeleteQuoteConfirmClick = (quoteId: string) => {
    if (!quoteConfirmDeleteId || quoteConfirmDeleteId !== quoteId) return;
    setIsProcessingQuoteAction(true);
    onDeleteQuote(quoteId);
    setTimeout(() => {
      setQuoteConfirmDeleteId(null);
      setIsProcessingQuoteAction(false);
    }, 300);
  };
  
  const handleDuplicateQuoteClick = (e: React.MouseEvent, quoteId: string) => {
      e.stopPropagation();
      setDuplicatingQuoteId(quoteId);
      setIsQuoteDuplicatePopoverOpen(true);
      setEditingQuoteId(null);
      setQuoteConfirmDeleteId(null);
      setConfirmingDeleteAll(false);
  };
  
  const handleDeleteAllQuotesConfirmClick = () => {
      if (!confirmingDeleteAll || !customer) return;
      setIsProcessingQuoteAction(true);
      onDeleteAllQuotes(customer.id);
      setTimeout(() => {
          setConfirmingDeleteAll(false);
          setIsProcessingQuoteAction(false);
      }, 300);
  };

  const handleAddNewQuote = () => {
    const currentSequenceNumbers = customerQuotes.map(q => q.sequenceNumber);
    const nextSequenceNumber = currentSequenceNumbers.length > 0 ? Math.max(...currentSequenceNumbers) + 1 : 1;
    onAddQuote(nextSequenceNumber);
  };

  const handleDropdownOpenChange = (open: boolean) => {
      if (!open && isQuoteDuplicatePopoverOpen) {
          return; 
      }
      if (open) {
          if (!isProcessingQuoteAction) {
              setEditingQuoteId(null);
              setQuoteConfirmDeleteId(null);
              setConfirmingDeleteAll(false); 
              setIsQuoteDuplicatePopoverOpen(false);
              setDuplicatingQuoteId(null);
              setDuplicateQuoteTargetIds([]);
              setDuplicateQuoteNewCount(1);
          }
      }
      setIsQuoteDropdownOpen(open);
  };

  const handleDropdownCloseAutoFocus = (e: Event) => {
    if (editingQuoteId || quoteConfirmDeleteId || confirmingDeleteAll || isQuoteDuplicatePopoverOpen) {
      e.preventDefault();
    }
  };

  const handleConfirmQuoteDuplicate = () => {
    if (!duplicatingQuoteId) return;
    
    setIsProcessingQuoteAction(true);
    
    if (duplicateQuoteNewCount > 0) {
        for (let i = 0; i < duplicateQuoteNewCount; i++) {
            console.log(`Popover: Duplicating ${duplicatingQuoteId} to NEW quote.`);
            onDuplicateQuote(duplicatingQuoteId);
        }
    }

    if (duplicateQuoteTargetIds.length > 0) {
        duplicateQuoteTargetIds.forEach(destinationQuoteId => {
            console.log(`Popover: Duplicating ${duplicatingQuoteId} OVERWRITING quote: ${destinationQuoteId}`);
            onDuplicateQuote(duplicatingQuoteId);
        });
    }

    setTimeout(() => {
        setIsProcessingQuoteAction(false);
        setIsQuoteDuplicatePopoverOpen(false);
        setDuplicatingQuoteId(null);
        setDuplicateQuoteTargetIds([]);
        setDuplicateQuoteNewCount(1);
    }, 300 + (duplicateQuoteNewCount + duplicateQuoteTargetIds.length) * 50);
  };

  return (
    <section>
      <Label className="text-xs text-muted-foreground block mb-1">Current Quote</Label>
      <DropdownMenu
        open={isQuoteDropdownOpen}
        onOpenChange={handleDropdownOpenChange}
        modal={false}
      >
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full h-8 text-sm justify-between font-regular"
          >
            <span>
              {currentQuote ? (
                <>
                  {baseQuoteNumber} / {currentQuote.sequenceNumber}
                  {currentQuote.name !== String(currentQuote.sequenceNumber) && currentQuote.name && ` - ${currentQuote.name}`}
                </>
              ) : (
                <span>Create new quote</span>
              )}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuPortal>
           <DropdownMenuContent
               align="start"
               sideOffset={4}
               className="w-[--radix-dropdown-menu-trigger-width]"
               onCloseAutoFocus={handleDropdownCloseAutoFocus}
           >
               {customerQuotes.map((quote) => (
                   <div
                       key={quote.id}
                       onClick={() => {
                           if (editingQuoteId !== quote.id && quoteConfirmDeleteId !== quote.id) {
                               handleQuoteClick(quote.id);
                           }
                       }}
                       className={`group flex justify-between items-center text-xs px-2 py-2 cursor-pointer rounded-sm outline-none focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground ${quote.id === currentQuote?.id ? 'bg-accent' : ''} ${editingQuoteId === quote.id ? 'bg-muted' : ''} ${quoteConfirmDeleteId === quote.id ? 'bg-destructive/10' : ''}`}
                   >
                       <div className="flex-grow flex items-center gap-2 mr-2 overflow-hidden min-w-0">
                           {editingQuoteId === quote.id ? (
                               <div className="flex-grow flex items-center gap-1">
                                   <Input ref={quoteInputRef} type="text" value={editingQuoteName} onChange={(e) => setEditingQuoteName(e.target.value)} onKeyDown={handleRenameKeyDown} onBlur={handleSaveRenameQuote} onClick={(e) => e.stopPropagation()} className="h-6 text-xs flex-grow"/>
                                   <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0" onClick={(e) => { e.stopPropagation(); handleSaveRenameQuote(); }} title="Save Name"><Check className="h-3 w-3 text-primary" /></Button>
                                   <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0" onClick={(e) => { e.stopPropagation(); handleCancelRenameQuote(); }} title="Cancel Rename"><CloseIcon className="h-3 w-3" /></Button>
                               </div>
                           ) : (
                               <span className="flex-grow truncate cursor-default" title={quote.name}>
                                   {baseQuoteNumber} / {quote.sequenceNumber} {quote.name !== String(quote.sequenceNumber) && quote.name ? ` - ${quote.name}` : ''} <span className="text-muted-foreground">({formatCurrency(quote.totalPrice)})</span>
                               </span>
                           )}
                       </div>

                       <div className="flex items-center shrink-0">
                           {quoteConfirmDeleteId === quote.id ? (
                               <div className="flex items-center">
                                   <Button variant="destructive" size="sm" className="h-6 text-xs px-2 mr-1" onClick={(e) => { e.stopPropagation(); handleDeleteQuoteConfirmClick(quote.id); }} title="Confirm Delete">Confirm?</Button>
                                   <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => { e.stopPropagation(); setQuoteConfirmDeleteId(null); }} title="Cancel Delete"><CloseIcon className="h-3 w-3"/></Button>
                               </div>
                           ) : editingQuoteId === quote.id ? (
                               null
                           ) : (
                               <div className={`flex items-center opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity`}>
                                   <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={(e) => { e.stopPropagation(); handleStartRenameQuote(quote); }} title={`Rename Quote ${quote.sequenceNumber}`} disabled={editingQuoteId !== null || quoteConfirmDeleteId !== null || isProcessingQuoteAction}><Pencil className="h-4 w-4" /></Button>
                                   <Popover open={isQuoteDuplicatePopoverOpen && duplicatingQuoteId === quote.id} onOpenChange={setIsQuoteDuplicatePopoverOpen}>
                                     <PopoverTrigger asChild>
                                       <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={(e) => handleDuplicateQuoteClick(e, quote.id)} title={`Duplicate Quote ${quote.sequenceNumber}`} disabled={editingQuoteId !== null || quoteConfirmDeleteId !== null || isProcessingQuoteAction}><Copy className="h-4 w-4" /></Button>
                                     </PopoverTrigger>
                                     <PopoverContent 
                                         className="w-56 p-2" 
                                         side="right" 
                                         align="start"
                                         onInteractOutside={(e) => {
                                             const target = e.target as HTMLElement;
                                             if (target.closest('[role="menuitem"]') || target.closest('[role="menu"]')) {
                                                 e.preventDefault(); 
                                             } else {
                                                 setIsQuoteDuplicatePopoverOpen(false);
                                                 setDuplicatingQuoteId(null);
                                             }
                                         }}
                                     >
                                       <div className="space-y-2 text-xs">
                                         <div className="flex justify-between items-center mb-2 border-b pb-1">
                                             <div className="font-semibold text-sm flex-grow text-center">Duplicate '{duplicatingQuoteId ? (customerQuotes.find(q=>q.id === duplicatingQuoteId)?.name || 'Quote') : ''}'</div>
                                             <Button 
                                                 variant="ghost" 
                                                 size="icon" 
                                                 className="h-6 w-6 text-muted-foreground hover:text-foreground shrink-0"
                                                 onClick={(e) => { 
                                                     e.stopPropagation(); 
                                                     setIsQuoteDuplicatePopoverOpen(false); 
                                                     setDuplicatingQuoteId(null); 
                                                 }} 
                                                 title="Close"
                                             >
                                                 <CloseIcon className="h-4 w-4" />
                                             </Button>
                                         </div>
                                         <div className="space-y-1">
                                             <Label htmlFor="new-quote-count" className="font-medium px-1">Create New Copies</Label>
                                             <Input 
                                               id="new-quote-count"
                                               type="number" 
                                               min="0" 
                                               value={duplicateQuoteNewCount} 
                                               onChange={(e) => { e.stopPropagation(); setDuplicateQuoteNewCount(Math.max(0, parseInt(e.target.value, 10) || 0)); }}
                                               onClick={(e) => e.stopPropagation()} 
                                               className="h-7 text-xs w-20"
                                             />
                                         </div>
                                         <Separator className="my-2" />
                                         <div className="space-y-1">
                                             <Label className="font-medium px-1 block mb-1">Overwrite Existing Quotes</Label>
                                             <ScrollArea className="max-h-32 pr-2">
                                               {customerQuotes
                                                 .filter(q => q.id !== duplicatingQuoteId)
                                                 .map(destQuote => (
                                                   <div key={destQuote.id} className="flex items-center space-x-2 py-1 px-1 rounded hover:bg-accent" onClick={(e) => e.stopPropagation()}>
                                                     <Checkbox 
                                                       id={`duplicate-target-quote-${destQuote.id}`} 
                                                       checked={duplicateQuoteTargetIds.includes(destQuote.id)} 
                                                       onCheckedChange={(checked) => {
                                                         setDuplicateQuoteTargetIds(prev => 
                                                           checked 
                                                             ? [...prev, destQuote.id] 
                                                             : prev.filter(id => id !== destQuote.id)
                                                         );
                                                       }}
                                                     />
                                                     <label htmlFor={`duplicate-target-quote-${destQuote.id}`} className="text-xs font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-grow cursor-pointer truncate" title={destQuote.name} onClick={(e) => e.stopPropagation()}> 
                                                      {destQuote.name} ({formatCurrency(destQuote.totalPrice)})
                                                     </label>
                                                   </div>
                                                 ))}
                                               {customerQuotes.length <= 1 && (<div className="text-muted-foreground italic px-2 text-center py-2">(No other quotes to overwrite)</div>)}
                                             </ScrollArea>
                                         </div>
                                         <Separator className="my-2" />
                                         {/* Confirmation Button */}
                                         <Button 
                                             className="w-full h-8 text-xs mt-2" 
                                             onClick={handleConfirmQuoteDuplicate}
                                             disabled={isProcessingQuoteAction || (duplicateQuoteNewCount === 0 && duplicateQuoteTargetIds.length === 0)}
                                         >
                                             Duplicate ({duplicateQuoteNewCount + duplicateQuoteTargetIds.length})
                                         </Button>
                                       </div>
                                     </PopoverContent>
                                   </Popover>
                                   <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); setQuoteConfirmDeleteId(quote.id); }} title={`Delete Quote ${quote.sequenceNumber}`} disabled={editingQuoteId !== null || quoteConfirmDeleteId !== null || isProcessingQuoteAction}><Trash2 className="h-4 w-4" /></Button>
                               </div>
                           )}
                       </div>
                   </div>
               ))}

               <DropdownMenuSeparator className="my-1" />

               <DropdownMenuItem
                   onSelect={(e: Event) => { e.preventDefault(); handleAddNewQuote(); }}
                   className="text-xs text-muted-foreground italic cursor-pointer flex items-center"
               >
                  <PlusCircle className="h-4 w-4 mr-2" /> Add New Quote...
               </DropdownMenuItem>

               {customerQuotes.length > 1 && (
                   <>
                     <DropdownMenuSeparator className="my-1" />
                     <DropdownMenuItem
                         onSelect={(e: Event) => {
                             e.preventDefault(); // Prevent dropdown from closing immediately
                             if (confirmingDeleteAll) {
                                 handleDeleteAllQuotesConfirmClick();
                             } else {
                                 setConfirmingDeleteAll(true);
                                 // Reset other potentially conflicting states
                                 setEditingQuoteId(null);
                                 setQuoteConfirmDeleteId(null);
                             }
                         }}
                         className={`text-xs ${confirmingDeleteAll ? 'text-destructive focus:bg-destructive focus:text-destructive-foreground' : 'text-muted-foreground focus:text-destructive focus:bg-destructive/10'} cursor-pointer flex items-center`}
                         disabled={customerQuotes.length <= 1 || isProcessingQuoteAction} // Disable if only one quote exists or action in progress
                         >
                         <Trash className="h-4 w-4 mr-2" />
                         {confirmingDeleteAll ? "Confirm Delete All?" : "Delete All Quotes..."}
                     </DropdownMenuItem>
                   </>
               )}
           </DropdownMenuContent>
        </DropdownMenuPortal>
      </DropdownMenu>
    </section>
  );
}
// --- End Quote Dropdown Section ---

// --- Fully functional Edit Task Dialog ---
interface EditTaskDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  taskDetails: { task: QuoteTask; index: number; tierId: string } | null;
  onUpdateTask: (taskIndex: number, tierId: string, updatedTask: QuoteTask) => void;
}

function EditTaskDialog({
  isOpen,
  onOpenChange,
  taskDetails,
  onUpdateTask,
}: EditTaskDialogProps) {
  const [editedName, setEditedName] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [editedPrice, setEditedPrice] = useState("");
  const [editedQuantity, setEditedQuantity] = useState("1"); // Add state for quantity

  useEffect(() => {
    if (isOpen && taskDetails) {
      setEditedName(taskDetails.task.name);
      setEditedDescription(taskDetails.task.description || "");
      setEditedPrice(taskDetails.task.basePrice.toString());
      setEditedQuantity((taskDetails.task.quantity ?? 1).toString()); // Set quantity, default to 1
    } else {
      // Reset form when closed or no details
      setEditedName("");
      setEditedDescription("");
      setEditedPrice("");
      setEditedQuantity("1"); // Reset quantity
    }
  }, [isOpen, taskDetails]);

  const handleSave = () => {
    if (!taskDetails) return;

    const priceValue = parseFloat(editedPrice);
    const quantityValue = parseInt(editedQuantity, 10); // Parse quantity

    if (isNaN(priceValue) || isNaN(quantityValue) || quantityValue < 1) { // Validate quantity >= 1
      console.error("Invalid price or quantity entered.");
      // TODO: Add validation feedback
      return;
    }

    const updatedTask: QuoteTask = {
      ...taskDetails.task,
      name: editedName.trim(),
      description: editedDescription.trim(),
      basePrice: priceValue,
      quantity: quantityValue, // Add quantity to updated task
    };

    onUpdateTask(taskDetails.index, taskDetails.tierId, updatedTask);
    onOpenChange(false); // Close dialog on save
  };

  if (!isOpen || !taskDetails) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>
            Make changes to the task details here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={editedName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditedName(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-start gap-4"> 
            <Label htmlFor="description" className="text-right pt-2">
              Description
            </Label>
            <Textarea
              id="description"
              value={editedDescription}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditedDescription(e.target.value)}
              className="col-span-3"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="price" className="text-right">
              Base Price
            </Label>
            <Input
              id="price"
              type="number"
              value={editedPrice}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditedPrice(e.target.value)}
              className="col-span-3"
              step="0.01"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="quantity" className="text-right">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              step="1"
              value={editedQuantity}
              onChange={(e) => setEditedQuantity(e.target.value)}
              className="col-span-3"
            />
          </div>
          {/* Add fields for addons later if needed */}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
// --- End Edit Task Dialog ---

interface EditAllTasksDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  tierId: string;
  tierName: string;
  tasks: ReorderableQuoteTask[];
  onUpdateAllTasks: (updatedTasks: QuoteTask[]) => void;
}

const EditAllTasksDialog = ({ 
  isOpen, 
  onOpenChange, 
  tierId, 
  tierName, 
  tasks}: EditAllTasksDialogProps) => {
  useEffect(() => { 
    if (isOpen) console.log("Placeholder EditAllTasksDialog:", tierId); 
  }, [isOpen, tierId]);
  
  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);
  
  if (!isOpen) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange} modal={false}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit All Tasks for {tierName} (Placeholder)</DialogTitle>
        </DialogHeader>
        <p>Contains {tasks?.length} tasks.</p>
        <DialogFooter>
          <Button onClick={handleClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// --- Moved SortableTaskItem Component ---
const SortableTaskItem = ({ id, task, index, onDelete, onEdit, onUpdateQuantity }:
    { 
        id: string; 
        task: QuoteTask; 
        index: number; 
        tierId: string; 
        onDelete: () => void; 
        onEdit: () => void; 
        onUpdateQuantity: (newQuantity: number) => void;
    }
) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const [isExpanded, setIsExpanded] = useState(false);
  const [inlineQuantity, setInlineQuantity] = useState<string>((task.quantity ?? 1).toString());

  // Encapsulated currency formatting
  const formatCurrencyStatic = useCallback((amount: number): string => {
    return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(amount);
  }, []);

  useEffect(() => {
      setInlineQuantity((task.quantity ?? 1).toString());
  }, [task.quantity]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  const toggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const handleQuantitySave = useCallback(() => {
    const currentVal = parseInt(inlineQuantity, 10);
    const originalVal = task.quantity ?? 1;
    if (!isNaN(currentVal) && currentVal >= 1 && currentVal !== originalVal) {
        onUpdateQuantity(currentVal);
    } else {
        setInlineQuantity(originalVal.toString());
    }
  }, [inlineQuantity, task.quantity, onUpdateQuantity]);

  const handleQuantityInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setInlineQuantity(event.target.value);
  }, []);

  const handleQuantityKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
          handleQuantitySave();
          (event.target as HTMLInputElement).blur();
      } else if (event.key === 'Escape') {
          setInlineQuantity((task.quantity ?? 1).toString());
          (event.target as HTMLInputElement).blur();
      }
  }, [handleQuantitySave, task.quantity]);

  const handleTaskItemDeleteClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    console.log(`[SortableTaskItem] Delete button clicked for task index: ${index}, ID: ${id}`);
    onDelete();
  }, [index, id, onDelete]);

  const handleEditClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit();
  }, [onEdit]);

  const handleInputClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="border p-2 rounded bg-background flex flex-col mb-1 touch-none">
      <div className="flex justify-between items-start w-full">
        <button 
          onClick={toggleExpand} 
          className="flex-grow text-left mr-2 focus:outline-none focus:ring-1 focus:ring-ring rounded-sm p-0.5 -m-0.5"
          title={isExpanded ? "Hide description" : "Show description"}
          {...listeners}
        >
          <span className="block break-words font-medium text-sm">{task.name}</span>
        </button>
        <div className="flex items-center flex-shrink-0 space-x-1 pt-0.5">
            <Input 
                type="number"
                value={inlineQuantity}
                onChange={handleQuantityInputChange}
                onBlur={handleQuantitySave}
                onKeyDown={handleQuantityKeyDown}
                min="1"
                step="1"
                className="h-6 w-12 text-xs px-1 text-center"
                onClick={handleInputClick}
                aria-label={`Quantity for ${task.name}`}
            />
          <span className="text-sm font-semibold mr-1">{formatCurrencyStatic(task.basePrice)}</span>
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                 <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleEditClick} title="Edit Task Details"><Pencil className="h-3 w-3"/></Button>
              </TooltipTrigger>
              <TooltipContent side="top"><p>Edit Details</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={handleTaskItemDeleteClick} title="Delete Task"><Trash2 className="h-3 w-3"/></Button>
              </TooltipTrigger>
              <TooltipContent side="top"><p>Delete Task</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      {isExpanded && task.description && (
        <p className="text-xs text-muted-foreground break-words mt-1.5 pl-1 pr-1 w-full">
          {task.description}
        </p>
      )}
    </div>
  );
};
// --- End SortableTaskItem Component ---

// --- ReorderableQuoteTask Type (if not defined globally) ---
// Assuming QuoteTask is defined globally or imported
type ReorderableQuoteTask = QuoteTask & { tempDndId: string };
// --- End Type Definition ---

// --- Moved QuoteTasksList Component ---
interface QuoteTasksListProps {
  tasks: ReorderableQuoteTask[];
  selectedTierId: string;
  sensors: ReturnType<typeof useSensors>; // Pass sensors down
  onDragEnd: (event: DragEndEvent) => void;
  onDeleteTask: (taskIndex: number, tierId: string) => void;
  onEditTask: (task: QuoteTask, index: number, tierId: string) => void;
  onUpdateTaskQuantity: (taskIndex: number, tierId: string, newQuantity: number) => void;
}

const QuoteTasksList = ({ 
  tasks, 
  selectedTierId, 
  sensors, 
  onDragEnd,
  onDeleteTask,
  onEditTask,
  onUpdateTaskQuantity,
}: QuoteTasksListProps) => {
  if (tasks.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">No tasks for this tier.</p>;
  }

  // Create a memoized handler for each task to avoid recreating on each render
  const getHandleDeleteTask = useCallback((index: number) => () => {
    console.log(`[QuoteTasksList -> SortableTaskItem] onDelete triggered for task index: ${index}, tierId: ${selectedTierId}`);
    onDeleteTask(index, selectedTierId);
  }, [onDeleteTask, selectedTierId]);

  const getHandleEditTask = useCallback((task: QuoteTask, index: number) => () => {
    onEditTask(task, index, selectedTierId);
  }, [onEditTask, selectedTierId]);

  const getHandleUpdateQuantity = useCallback((index: number) => (newQuantity: number) => {
    onUpdateTaskQuantity(index, selectedTierId, newQuantity);
  }, [onUpdateTaskQuantity, selectedTierId]);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={tasks.map(t => t.tempDndId)} strategy={verticalListSortingStrategy}>
        <div className="space-y-1"> 
          {tasks.map((task, index) => (
            <SortableTaskItem
              key={task.tempDndId} // Use stable ID for key
              id={task.tempDndId}  // Use stable ID for dnd-kit
              task={task}
              index={index}
              tierId={selectedTierId}
              onDelete={getHandleDeleteTask(index)}
              onEdit={getHandleEditTask(task, index)}
              onUpdateQuantity={getHandleUpdateQuantity(index)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};
// --- End QuoteTasksList Component ---

interface CurrentQuoteSidebarProps {
  quotes: Quote[];
  currentQuoteId: string | null;
  customer: Customer | null;
  availableTiers: Tier[];
  // @ts-ignore - intentionally unused but kept for future use
  _allCustomers: Customer[];
  // @ts-ignore - intentionally unused but kept for future use
  _isLoadingCustomers: boolean;
  onQuoteSelect: (quoteId: string) => void;
  onTierSelect: (tierId: string) => void;
  onDeleteTask: (taskIndex: number, tierId: string) => void;
  onAddTier: () => void;
  onDeleteTier: (tierIdToDelete: string, index: number) => void;
  onRenameTier: (tierIdToRename: string, newName: string) => void;
  onPreviewQuote: () => void;
  onUpdateCustomer: (updatedCustomer: Customer) => void;
  onCustomerSelect: (customerId: string) => void;
  onAddQuote: (nextSequenceNumber: number) => void;
  onDeleteQuote: (quoteId: string) => void;
  onRenameQuote: (quoteId: string, newName: string) => void;
  onUpdateTask: (taskIndex: number, tierId: string, updatedTask: QuoteTask) => void;
  onUpdateAllTasks: (tierId: string, updatedTasks: QuoteTask[]) => void;
  onReorderTasks: (tierId: string, oldIndex: number, newIndex: number) => void;
  onDuplicateTier: (sourceTierId: string, destinationTierId: string | null, newTierName?: string) => void;
  onClearAllTasks: (tierId: string) => void;
  onDeleteAllQuotes: (customerId: string) => void;
  onDuplicateQuote: (quoteId: string) => void;
  onDeleteAllTiers: () => void;
}

const calculateQuoteTotalPriceFromTasks = (tasks: QuoteTask[]): number => {
  return tasks.reduce((sum, task) => {
    const quantity = task.quantity ?? 1; // Default to 1 if quantity is missing
    const taskAddonTotal = task.addons?.reduce((addonSum: number, addon: Addon) => addonSum + addon.price, 0) ?? 0;
    const taskTotal = (task.basePrice + taskAddonTotal) * quantity; // Multiply by quantity
    return sum + taskTotal;
  }, 0);
};

const applyProportionalAdjustment = (
  targetTotalPrice: number,
  currentTasks: QuoteTask[]): { updatedTasks: QuoteTask[], finalTotal: number } | null => {
  if (!currentTasks || currentTasks.length === 0) return null;

  // Calculate the effective total original price considering quantities
  let effectiveOriginalTotal = 0;
  currentTasks.forEach(task => {
    const quantity = task.quantity ?? 1;
    const taskAddonTotal = task.addons?.reduce((sum: number, addon: Addon) => sum + addon.price, 0) ?? 0;
    effectiveOriginalTotal += (task.basePrice + taskAddonTotal) * quantity;
  });

  if (effectiveOriginalTotal === 0) return null; // Avoid division by zero if all items are free

  const ratio = targetTotalPrice / effectiveOriginalTotal;

  if (targetTotalPrice < 0 || ratio < 0) return null; // Cannot adjust to negative price

  const updatedTasks: QuoteTask[] = currentTasks.map(task => {
    const quantity = task.quantity ?? 1;
    const taskAddonTotal = task.addons?.reduce((sum: number, addon: Addon) => sum + addon.price, 0) ?? 0;
    
    // Calculate the target total price for this specific task (including addons and quantity)
    const originalTaskTotal = (task.basePrice + taskAddonTotal) * quantity;
    const targetTaskTotal = originalTaskTotal * ratio;
    
    // Calculate the new base price needed to achieve the targetTaskTotal
    // newBasePrice * quantity + taskAddonTotal * quantity = targetTaskTotal
    // newBasePrice = (targetTaskTotal / quantity) - taskAddonTotal
    let newBasePrice = (targetTaskTotal / quantity) - taskAddonTotal;
    
    return { 
        ...task, 
        // Ensure base price doesn't go below zero
        basePrice: Math.max(0, parseFloat(newBasePrice.toFixed(2))) 
    };
  });

  const finalRecalculatedTotal = calculateQuoteTotalPriceFromTasks(updatedTasks);
  
  // Add a check for minor discrepancies due to floating point math
  if (Math.abs(finalRecalculatedTotal - targetTotalPrice) > 0.01 * currentTasks.length) {
      console.warn("Proportional adjustment resulted in a significant discrepancy:", 
                     { targetTotalPrice, finalRecalculatedTotal });
      // Optionally return null or handle the discrepancy
  }
  
  return { updatedTasks, finalTotal: finalRecalculatedTotal };
};

// --- NEW: QuotePricingDetails Component ---
interface QuotePricingDetailsProps {
  currentQuote: Quote | null;
  selectedTierId: string | null;
  getTierName: (tierId?: string) => string;
  formatCurrency: (amount: number) => string;
  showAdjustmentSlider: boolean;
  setShowAdjustmentSlider: React.Dispatch<React.SetStateAction<boolean>>;
  adjustmentPercentage: number;
  setAdjustmentPercentage: React.Dispatch<React.SetStateAction<number>>;
  onUpdateAllTasks: (tierId: string, updatedTasks: QuoteTask[]) => void;
  // Include calculateTotalPrice and applyAdjustment helper functions via props or define locally if specific
  calculateTierTotalPrice: (tierId: string) => number;
  applyProportionalAdjustment: (
    targetTotalPrice: number,
    currentTasks: QuoteTask[],
    tierId: string
  ) => { updatedTasks: QuoteTask[], finalTotal: number } | null;
}

const QuotePricingDetails = ({
  currentQuote,
  selectedTierId,
  getTierName,
  formatCurrency,
  showAdjustmentSlider,
  setShowAdjustmentSlider,
  adjustmentPercentage,
  setAdjustmentPercentage,
  onUpdateAllTasks,
  calculateTierTotalPrice,
  applyProportionalAdjustment,
}: QuotePricingDetailsProps) => {
  const [isEditingTotalPrice, setIsEditingTotalPrice] = useState<boolean>(false);
  const [editingTotalPriceStr, setEditingTotalPriceStr] = useState<string>("");
  const totalPriceInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingTotalPrice && totalPriceInputRef.current) {
      totalPriceInputRef.current.focus();
    }
  }, [isEditingTotalPrice]);

  // === MOVED HANDLERS ===
  const handleStartEditTotalPrice = (): void => {
    if (!currentQuote || showAdjustmentSlider) return;
    setEditingTotalPriceStr(currentQuote.totalPrice.toFixed(2));
    setIsEditingTotalPrice(true);
  };

  const handleCancelEditTotalPrice = (): void => {
    setIsEditingTotalPrice(false);
    setEditingTotalPriceStr("");
  };

  const handleSaveTotalPrice = (): void => {
    if (!currentQuote || !selectedTierId) return;
    const newTotalPrice = parseFloat(editingTotalPriceStr);
    if (isNaN(newTotalPrice) || newTotalPrice < 0 || newTotalPrice === currentQuote.totalPrice) {
      handleCancelEditTotalPrice();
      return;
    }
    const currentTierTasks = currentQuote.tierTasks[selectedTierId] || [];
    if (!currentTierTasks || currentTierTasks.length === 0) {
      handleCancelEditTotalPrice();
      return;
    }
    const adjustmentResult = applyProportionalAdjustment(newTotalPrice, currentTierTasks, selectedTierId);
    if (!adjustmentResult) {
      handleCancelEditTotalPrice();
      return;
    }
    onUpdateAllTasks(selectedTierId, adjustmentResult.updatedTasks);
    setAdjustmentPercentage(0); // Reset slider percentage after manual total edit
    handleCancelEditTotalPrice();
  };

  const handleTotalPriceKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') handleSaveTotalPrice();
    else if (event.key === 'Escape') handleCancelEditTotalPrice();
  };
  // === END MOVED HANDLERS ===
  
  return (
    <section>
      <h3 className="text-sm font-semibold mb-2 flex items-center"><DollarSign className="h-4 w-4 mr-2" /> Pricing</h3>
      <div className="text-xs space-y-2 bg-muted p-3 rounded-md">
        {currentQuote && selectedTierId ? (
          <>
            <div className="flex justify-between">
              <span>Tier:</span><span className="font-semibold">{getTierName(selectedTierId)}</span>
            </div>
            <Separator className="my-4" /> {/* Ensure Separator is imported/available */}
            <div className="flex items-center justify-between space-x-2 mt-2">
              <Label htmlFor="adjustment-toggle" className="text-sm font-regular">Enable Price Adjustment</Label>
              <Switch id="adjustment-toggle" checked={showAdjustmentSlider} onCheckedChange={(checked: boolean) => { setShowAdjustmentSlider(checked); if (!checked) setAdjustmentPercentage(0); }} disabled={!currentQuote} />
            </div>
            {showAdjustmentSlider && (
              <div className="space-y-2 pt-2">
                <Label htmlFor="adjustment-slider" className="text-sm font-regular">Adjust Total: {adjustmentPercentage}%</Label>
                <Slider
                  id="adjustment-slider" min={-100} max={100} step={1} value={[adjustmentPercentage]}
                  onValueChange={(value: number[]) => setAdjustmentPercentage(value[0])}
                  onValueCommit={(value: number[]) => {
                    if (!currentQuote || !selectedTierId) return;
                    const committedPercentage = value[0];
                    const currentTierTotal = calculateTierTotalPrice(selectedTierId);
                    const targetTotalPrice = currentTierTotal * (1 + committedPercentage / 100);
                    const currentTasks = currentQuote.tierTasks[selectedTierId] || [];
                    const adjustmentResult = applyProportionalAdjustment(targetTotalPrice, currentTasks, selectedTierId);
                    if (adjustmentResult) {
                      onUpdateAllTasks(selectedTierId, adjustmentResult.updatedTasks);
                    } else {
                      console.error("Slider adjustment failed.");
                    }
                  }}
                  className="[&>span:first-child]:h-1"
                  disabled={!currentQuote}
                />
                <div className="flex justify-between text-xs text-muted-foreground"><span>-100%</span><span>+100%</span></div>
              </div>
            )}
            {currentQuote.adjustments.length > 0 && (<div className="pt-1"><Label className="text-xs text-muted-foreground">Manual Adjustments:</Label><p className="text-xs italic">(Display not implemented)</p></div>)}
            <Separator className="my-2" />
            <div className="flex justify-between font-semibold text-sm pt-1">
              <span>Total:</span>
              {isEditingTotalPrice && currentQuote ? (
                <div className="flex items-center gap-1">
                  <span className="font-regular text-xs mr-1">$</span>
                  <Input ref={totalPriceInputRef} type="number" step="0.01" value={editingTotalPriceStr} onChange={(e) => setEditingTotalPriceStr(e.target.value)} onKeyDown={handleTotalPriceKeyDown} onBlur={handleSaveTotalPrice} className="h-6 text-sm w-24 font-semibold" disabled={!currentQuote} />
                  <Button variant="ghost" size="icon" className="h-5 w-5" onClick={handleSaveTotalPrice} title="Save" disabled={!currentQuote}><Check className="h-3 w-3 text-primary"/></Button>
                  <Button variant="ghost" size="icon" className="h-5 w-5" onClick={handleCancelEditTotalPrice} title="Cancel" disabled={!currentQuote}><CloseIcon className="h-3 w-3"/></Button>
                </div>
              ) : (
                <span className={`cursor-pointer hover:bg-secondary px-1 rounded ${!currentQuote ? 'cursor-not-allowed opacity-50' : ''}`} title={!currentQuote ? 'No quote selected' : showAdjustmentSlider ? 'Disable adjustment to edit total' : 'Click to edit total'} onClick={currentQuote && !showAdjustmentSlider ? handleStartEditTotalPrice : undefined}>
                  {formatCurrency(currentQuote?.totalPrice ?? 0)}
                </span>
              )}
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">{currentQuote ? "Select a tier to view pricing." : "Select a quote to view pricing."}</p>
        )}
      </div>
    </section>
  );
};
// --- End QuotePricingDetails Component ---

export function CurrentQuoteSidebar({
  quotes,
  currentQuoteId,
  customer: propCustomer,
  availableTiers: availableTiersProp,
  // @ts-ignore - intentionally unused but kept for future use
  _allCustomers,
  // @ts-ignore - intentionally unused but kept for future use
  _isLoadingCustomers,
  onQuoteSelect,
  onTierSelect,
  onDeleteTask,
  onAddTier,
  onDeleteTier,
  onRenameTier,
  onPreviewQuote,
  onUpdateCustomer,
  onCustomerSelect: propCustomerSelect,
  onAddQuote,
  onDeleteQuote,
  onRenameQuote,
  onUpdateTask,
  onUpdateAllTasks,
  onReorderTasks,
  onDuplicateTier,
  onClearAllTasks,
  onDeleteAllQuotes,
  onDuplicateQuote,
  onDeleteAllTiers,
}: CurrentQuoteSidebarProps) {
  console.log("CurrentQuoteSidebar received quotes:", quotes, "currentQuoteId:", currentQuoteId);

  // Access the customer context
  const { selectedCustomer, selectCustomer: contextSelectCustomer } = useCustomers();
  
  // Use prop customer if provided, otherwise use selectedCustomer from context
  const customer = propCustomer || selectedCustomer;
  
  // Use prop customerSelect if provided, otherwise use selectCustomer from context
  const onCustomerSelect = propCustomerSelect || contextSelectCustomer;

  // State for sidebar width
  const [sidebarWidth, setSidebarWidth] = useState<number>(350); // Default width
  const isResizing = useRef<boolean>(false);
  const sidebarRef = useRef<HTMLDivElement>(null); // Ref for the sidebar container
  const inputRef = useRef<HTMLInputElement>(null);
  const quoteInputRef = useRef<HTMLInputElement>(null);

  // State for customer selection and data
  const [_customerSearchQuery] = useState('');
  
  // All other state declarations - make sure ALL useState hooks are here
  const [internalAvailableTiers, setInternalAvailableTiers] = useState<Tier[]>(availableTiersProp);
  const [isTierDropdownOpen, setIsTierDropdownOpen] = useState(false);
  const [editingTierId, setEditingTierId] = useState<string | null>(null);
  const [editingTierName, setEditingTierName] = useState<string>("");
  const [tierConfirmDeleteId, setTierConfirmDeleteId] = useState<string | null>(null);
  const [confirmingDeleteAllTiers, setConfirmingDeleteAllTiers] = useState<boolean>(false);
  const [isProcessingAction, setIsProcessingAction] = useState<boolean>(false);
  const [isDuplicatePopoverOpen, setIsDuplicatePopoverOpen] = useState<boolean>(false);
  const [duplicatingTierId, setDuplicatingTierId] = useState<string | null>(null);
  const [duplicateTargetTierIds, setDuplicateTargetTierIds] = useState<string[]>([]);
  const [duplicateNewTierCount, setDuplicateNewTierCount] = useState<number>(1);
  const [clearConfirmTierId, setClearConfirmTierId] = useState<string | null>(null);
  const [_isShowingAddTierPopover, _setIsShowingAddTierPopover] = useState<boolean>(false);
  const [_newTierName, _setNewTierName] = useState<string>('');
  const [showAdjustmentSlider, setShowAdjustmentSlider] = useState<boolean>(false);
  const [adjustmentPercentage, setAdjustmentPercentage] = useState<number>(0);
  const [isEditingSendEmail, setIsEditingSendEmail] = useState<boolean>(false);
  const [tempSendEmail, setTempSendEmail] = useState<string>('');
  const [isEditingSendSms, setIsEditingSendSms] = useState<boolean>(false);
  const [tempSendSms, setTempSendSms] = useState<string>('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [editingTaskDetails, setEditingTaskDetails] = useState<{task: QuoteTask, index: number, tierId: string} | null>(null);
  const [isEditAllTasksDialogOpen, setIsEditAllTasksDialogOpen] = useState<boolean>(false);
  const [editingAllTasksTierId, setEditingAllTasksTierId] = useState<string | null>(null);
  const [_isSelectingCustomer, _setIsSelectingCustomer] = useState<boolean>(false);
  const [_isEditingCustomer, _setIsEditingCustomer] = useState<boolean>(false);
  const [mainEditingQuoteId, _setMainEditingQuoteId] = useState<string | null>(null);
  const [_editingQuoteName, _setEditingQuoteName] = useState<string>("");
  const [quotesToSendIds, setQuotesToSendIds] = useState<string[]>([]);
  const [disabledEmailSendClicks, setDisabledEmailSendClicks] = useState<number>(0);
  const [disabledSmsSendClicks, setDisabledSmsSendClicks] = useState<number>(0);
  const [isQuoteDropdownOpen, setIsQuoteDropdownOpen] = useState<boolean>(false);
  
  // Always derive these values unconditionally
  const currentQuote = useMemo(() => {
    if (!currentQuoteId || !quotes) {
      console.log("[CurrentQuoteSidebar] currentQuote memo: No currentQuoteId or quotes");
      return null;
    }
    
    const foundQuote = quotes.find(q => q.id === currentQuoteId);
    
    // Only log when the quote actually changes to reduce console noise
    if (foundQuote) {
      console.log("[CurrentQuoteSidebar] currentQuote memo: Found quote", foundQuote.id);
    } else {
      console.log("[CurrentQuoteSidebar] currentQuote memo: Quote not found for ID", currentQuoteId);
    }
    
    return foundQuote || null;
  }, [currentQuoteId, quotes]);

  const tasksForSelectedTier = useMemo(() => {
    if (!currentQuote || !currentQuote.selectedTierId || !(currentQuote.selectedTierId in currentQuote.tierTasks)) {
      console.log("[CurrentQuoteSidebar] tasksForSelectedTier memo: No current quote, selected tier, or tier tasks");
      return [];
    }
    const tasks = currentQuote.tierTasks[currentQuote.selectedTierId] || [];
    console.log("[CurrentQuoteSidebar] tasksForSelectedTier memo: Derived tasks:", tasks);
    return tasks;
  }, [currentQuote]);

  const reorderableTasks = useMemo(() => {
    const tasks = tasksForSelectedTier.map(task => ({ ...task, tempDndId: task.taskId }));
    console.log("[CurrentQuoteSidebar] reorderableTasks memo: Derived:", tasks);
    return tasks;
  }, [tasksForSelectedTier]);

  // Always compute these values (move them before any returns)
  const selectedTierId = currentQuote?.selectedTierId;
  const isQuoteSentOrAccepted = currentQuote?.status === 'Sent' || currentQuote?.status === 'Accepted';
  const hasEmail = customer?.email ? true : false;
  const hasPhone = customer?.phone ? true : false;
  const canSend = customer && !isQuoteSentOrAccepted && (hasEmail || hasPhone);
  const customerQuotes = customer ? quotes.filter((q) => q.customerId === customer.id) : [];
  const baseQuoteNumber = customerQuotes.length > 0 ? customerQuotes[0]?.quoteNumber || "Q-ERR" : "Q-ERR";
  
  // Sidebar resize handlers
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing.current || !sidebarRef.current) return;
    const newWidth = window.innerWidth - e.clientX;
    const constrainedWidth = Math.max(280, Math.min(newWidth, 800));
    setSidebarWidth(constrainedWidth);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const handleMouseUp = () => {
    if (isResizing.current) {
      isResizing.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  };
  
  // All useEffect hooks must be declared before any conditional returns
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [handleMouseMove]);

  useEffect(() => { 
    if (editingTierId && inputRef.current) inputRef.current.focus(); 
  }, [editingTierId]);
  
  useEffect(() => { 
    if (mainEditingQuoteId && quoteInputRef.current) quoteInputRef.current.focus(); 
  }, [mainEditingQuoteId]);
  
  useEffect(() => { 
    if (customer?.email && !isEditingSendEmail) setTempSendEmail(customer.email); 
    if (customer?.phone && !isEditingSendSms) setTempSendSms(customer.phone); 
  }, [customer, isEditingSendEmail, isEditingSendSms]);
  
  useEffect(() => { 
    setInternalAvailableTiers(availableTiersProp); 
  }, [availableTiersProp]);
  
  useEffect(() => { 
    setClearConfirmTierId(null); 
  }, [selectedTierId]);
  
  useEffect(() => { 
    if (!isQuoteDropdownOpen || currentQuoteId) {
        setIsQuoteDropdownOpen(false);
    }
    // Reset tier delete confirmation when quote dropdown state changes
    setConfirmingDeleteAllTiers(false); 
  }, [isQuoteDropdownOpen, currentQuoteId]);

  // Add back helper functions before hooks
  // Format currency helper
  const formatCurrency = (amount: number): string => 
    new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(amount);

  // Get tier name helper
  const getTierName = (tierId?: string): string => 
    internalAvailableTiers.find(t => t.id === tierId)?.name || (tierId ? `Tier ${tierId}` : "None");

  // Calculate tier total price helper
  const calculateTierTotalPrice = (tierId: string): number => {
    if (!currentQuote || !tierId || !(tierId in (currentQuote.tierTasks || {}))) return 0;
    return calculateQuoteTotalPriceFromTasks(currentQuote.tierTasks[tierId] || []);
  };

  // Format address helper - intentionally unused but kept for future use
  // @ts-ignore - Intentionally unused
  const _formatAddress = (address: Address | null | undefined): string => {
    if (!address) return "N/A";
    const parts = [address.street, address.city, address.state, address.postcode, address.country].filter(Boolean);
    return parts.length ? parts.join(', ') : "N/A";
  };
  
  // After formatAddress removal - directly to sortedAvailableTiers
  const sortedAvailableTiers = useMemo(() => {
    const standardTierNames = ['gold', 'silver', 'bronze'];
    const standardTiers: Tier[] = [];
    const otherTiers: Tier[] = [];

    // Separate standard tiers from others
    internalAvailableTiers.forEach(tier => {
      if (standardTierNames.includes(tier.name.toLowerCase())) {
        standardTiers.push(tier);
      } else {
        otherTiers.push(tier);
      }
    });

    // Sort standard tiers according to the predefined order
    standardTiers.sort((a, b) => {
      const aIndex = standardTierNames.indexOf(a.name.toLowerCase());
      const bIndex = standardTierNames.indexOf(b.name.toLowerCase());
      return aIndex - bIndex;
    });

    // Combine the sorted standard tiers with the other tiers (in their original added order)
    return [...standardTiers, ...otherTiers];
  }, [internalAvailableTiers]);

  // Create and add all function hooks before conditional return
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), 
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleOpenEditTaskDialog = useCallback((task: QuoteTask, index: number, tierId: string) => {
    setEditingTaskDetails({ task, index, tierId });
    setIsEditDialogOpen(true);
  }, []);

  const handleOpenEditAllTasksDialog = useCallback(() => {
    if (!currentQuote?.selectedTierId) return;
    setEditingAllTasksTierId(currentQuote.selectedTierId);
    setIsEditAllTasksDialogOpen(true);
  }, [currentQuote?.selectedTierId]);

  const handleTaskDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    const selectedTierId = currentQuote?.selectedTierId;
    if (selectedTierId && currentQuote && over && active.id !== over.id) {
      const oldIndex = reorderableTasks.findIndex(item => item.tempDndId === active.id);
      const newIndex = reorderableTasks.findIndex(item => item.tempDndId === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorderTasks(selectedTierId, oldIndex, newIndex);
      }
    }
  }, [currentQuote, reorderableTasks, onReorderTasks]);

  const handleUpdateTaskQuantity = useCallback((taskIndex: number, tierId: string, newQuantity: number) => {
    if (!currentQuote) return;
    const tasks = currentQuote.tierTasks[tierId];
    if (!tasks || taskIndex < 0 || taskIndex >= tasks.length) return;
    
    const taskToUpdate = tasks[taskIndex];
    // Check if quantity actually changed to avoid unnecessary updates
    if ((taskToUpdate.quantity ?? 1) === newQuantity) {
      console.log(`[handleUpdateTaskQuantity] Quantity unchanged for task index ${taskIndex}`);
      return; // Avoid calling update if quantity is the same
    }

    const updatedTask: QuoteTask = {
        ...taskToUpdate,
        quantity: newQuantity
    };
    console.log(`[handleUpdateTaskQuantity] Updating task index ${taskIndex} in tier ${tierId} with quantity ${newQuantity}`);
    // Call the main update task handler passed from PricebookPage
    onUpdateTask(taskIndex, tierId, updatedTask);
  }, [currentQuote, onUpdateTask]);

  const handleDeleteTask = useCallback((taskIndex: number, tierId: string) => {
    // Ensure the onDeleteTask prop is called with the correct arguments
    onDeleteTask(taskIndex, tierId);
  }, [onDeleteTask]);

  // Convert to regular function to fix linter errors
  const handleConfirmDuplicate = (): void => {
    if (!duplicatingTierId || !currentQuote) return; // Guard against null ID

    const sourceTierName = getTierName(duplicatingTierId); // Checked non-null above
    let _copyCounter = 1;

    // Function to find the next available copy name (consistent)
    const getNextCopyName = (baseName: string): string => {
        let newName: string;
        do {
            newName = `${baseName} Copy ${_copyCounter++}`;
        } while (internalAvailableTiers.some(t => t.name === newName));
        return newName;
    };

    // Use state variables directly from the main component state
    // Create new tiers
    if (duplicateNewTierCount > 0) { // Use component state
        for (let i = 0; i < duplicateNewTierCount; i++) { // Use component state
            const newTierName = getNextCopyName(sourceTierName);
            console.log(`Popover: Duplicating ${duplicatingTierId} to NEW tier: ${newTierName}`);
            onDuplicateTier(duplicatingTierId, null, newTierName);
        }
    }

    // Overwrite existing tiers
    if (duplicateTargetTierIds.length > 0) { // Use component state
        duplicateTargetTierIds.forEach(destinationTierId => { // Use component state
            console.log(`Popover: Duplicating ${duplicatingTierId} OVERWRITING tier: ${destinationTierId}`);
            onDuplicateTier(duplicatingTierId, destinationTierId);
        });
    }

    // Reset and close popover
    setIsDuplicatePopoverOpen(false); // Close popover 
    setDuplicatingTierId(null);
    // Reset internal state vars used by popover inputs
    setDuplicateTargetTierIds([]); // Reset component state
    setDuplicateNewTierCount(1); // Reset component state
  };

  const handleDuplicateButtonClick = useCallback((e: React.MouseEvent, tierId: string) => {
    e.stopPropagation(); // Prevent event bubbling
    setDuplicatingTierId(tierId); // Set the target tier ID
    setIsDuplicatePopoverOpen(true); // Explicitly open the popover
    setDuplicateTargetTierIds([]); // Reset duplication state defined at top level
    setDuplicateNewTierCount(1); // Reset duplication state defined at top level
  }, []);

  const handlePopoverOpenChange = useCallback((open: boolean) => {
    // Only manage popover state. Reset ID only on explicit close.
    setIsDuplicatePopoverOpen(open);
    if (!open) {
      setDuplicatingTierId(null);
    }
  }, []);

  const handleDuplicateConfirmClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    handleConfirmDuplicate(); // Call the component handler
  }, []); // Remove handleConfirmDuplicate from dependencies since it's now a regular function

  const handlePopoverOutsideInteraction = useCallback((e: Event) => {
    // Allow interacting with other dropdown items without closing popover/dropdown
    const target = e.target as HTMLElement;
    if (target.closest('[role="menuitem"]') || target.closest('[role="menu"]')) {
      e.preventDefault(); 
    } else {
      // Otherwise, close the popover normally
      setIsDuplicatePopoverOpen(false);
      setDuplicatingTierId(null);
    }
  }, []);

  const handleDeleteTierButtonClick = useCallback((e: React.MouseEvent, tierId: string) => {
    e.stopPropagation();
    setTierConfirmDeleteId(tierId);
  }, []);

  const handleDropdownCloseAutoFocus = useCallback((e: Event) => {
    // Prevent focus-related close if editing/confirming delete, a popover is open, or confirming delete all
    if (editingTierId || tierConfirmDeleteId || isDuplicatePopoverOpen || confirmingDeleteAllTiers) {
      e.preventDefault();
    }
  }, [editingTierId, tierConfirmDeleteId, isDuplicatePopoverOpen, confirmingDeleteAllTiers]);

  const handleTierDropdownOpenChange = useCallback((open: boolean) => {
    // Prevent closing the dropdown if EITHER popover is open
    if (!open && isDuplicatePopoverOpen) { 
      return; // Do nothing, keep dropdown open
    }
    // Otherwise, update the dropdown state normally
    if (currentQuote) {
      setIsTierDropdownOpen(open);
      // If we are closing the main dropdown, ensure other states are reset
      if (!open) {
        setTierConfirmDeleteId(null);
        setEditingTierId(null); // Also cancel renaming
        setIsDuplicatePopoverOpen(false); 
        setDuplicatingTierId(null);
        setConfirmingDeleteAllTiers(false); // Reset delete all confirmation
      }
    } 
  }, [currentQuote, isDuplicatePopoverOpen]);

  // Only now do we conditionally return
  if (!customer) {
    // Customer selection UI shown when no customer is selected
    return (
      <div 
        ref={sidebarRef}
        className="flex flex-col h-full border-l bg-card relative flex-shrink-0"
        style={{ width: `${sidebarWidth}px` }}
      >
        {/* Resize Handle */}
        <div 
          onMouseDown={handleMouseDown}
          className="absolute top-0 left-0 w-1.5 h-full cursor-col-resize bg-transparent hover:bg-border/50 transition-colors duration-200 z-10"
          title="Drag to resize"
        />
        <div className="p-4 border-b flex justify-between items-center flex-shrink-0 relative z-0 bg-card">
          <h2 className="text-lg font-semibold truncate pr-2">Quote Details</h2>
        </div>
        <ScrollArea className="flex-grow">
          <div className="p-4 pr-6 space-y-6">
            <CustomerDetailsSection 
              customer={null} 
              onCustomerSelect={onCustomerSelect} 
            />
          </div>
        </ScrollArea>
      </div>
    );
  }

  // The rest of your handlers remain the same
  const handleTierClick = (tierId: string) => {
    if (!tierId || editingTierId === tierId || tierConfirmDeleteId === tierId || !currentQuote) return;
    if (tierConfirmDeleteId !== null) setTierConfirmDeleteId(null);
    if (editingTierId !== null) setEditingTierId(null);
    onTierSelect(tierId);
  };
  const handleStartRename = (tier: Tier) => {
    console.log("handleStartRename called for tier:", tier.id);
    setEditingTierId(tier.id);
    setEditingTierName(tier.name);
    setTierConfirmDeleteId(null);
    setIsTierDropdownOpen(true);
  };
  const handleCancelRename = () => {
    setEditingTierId(null);
    setEditingTierName("");
  };
  const handleSaveRename = () => {
    if (!editingTierId) return;
    const trimmedName = editingTierName.trim();
    const originalTier = internalAvailableTiers.find(t => t.id === editingTierId);
    if (!trimmedName || (originalTier && originalTier.name === trimmedName)) { handleCancelRename(); return; }
    if (internalAvailableTiers.some(t => t.id !== editingTierId && t.name.toLowerCase() === trimmedName.toLowerCase())) { alert(`Tier name "${trimmedName}" already exists.`); return; }
    setIsProcessingAction(true);
    onRenameTier(editingTierId, trimmedName);
    setTimeout(() => { setEditingTierId(null); setIsProcessingAction(false); }, 300);
  };
  const handleRenameKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => { if (event.key === 'Enter') handleSaveRename(); else if (event.key === 'Escape') handleCancelRename(); };
  const handleDeleteConfirmClick = (tierId: string) => {
    const index = internalAvailableTiers.findIndex(t => t.id === tierId);
    if (index === -1) return;
    setIsProcessingAction(true);
    onDeleteTier(tierId, index);
    setTimeout(() => {
      setTierConfirmDeleteId(null);
      setIsProcessingAction(false);
      if (currentQuote?.selectedTierId === tierId) {
        const nextTierId = internalAvailableTiers.filter(t => t.id !== tierId)[0]?.id || null;
        if(nextTierId) onTierSelect(nextTierId);
      }
    }, 300);
  };

  const handleInitiateClearAllTasks = (tierId: string): void => { setClearConfirmTierId(tierId); setTierConfirmDeleteId(null); };
  const handleConfirmClearAllTasks = (tierId: string): void => {
    if (!currentQuote || clearConfirmTierId !== tierId) return;
    onClearAllTasks(tierId);
    setClearConfirmTierId(null);
    setAdjustmentPercentage(0);
  };

  return (
    // Main container: Apply dynamic width, ref, and change background back to bg-card
    <div 
      ref={sidebarRef}
      className="flex flex-col h-full border-l bg-card relative flex-shrink-0" // Changed bg-background to bg-card
      style={{ width: `${sidebarWidth}px` }}
    >
      {/* Resize Handle */}
      <div 
        onMouseDown={handleMouseDown}
        className="absolute top-0 left-0 w-1.5 h-full cursor-col-resize bg-transparent hover:bg-border/50 transition-colors duration-200 z-10"
        title="Drag to resize"
      />

      {/* Sidebar Header - Ensure it uses bg-card to match */}
      <div className="p-4 border-b flex justify-between items-center flex-shrink-0 relative z-0 bg-card">
        <h2 className="text-lg font-semibold truncate pr-2">Quote Details</h2>
        {/* Add action buttons here if needed */}
      </div>

      {/* Scrollable Content Area */}
      <ScrollArea className="flex-grow">
        <div className="p-4 pr-6 space-y-6 min-w-0 overflow-hidden">
          {/* Customer Section */}
          <CustomerDetailsSection 
            customer={customer}
            onUpdateCustomer={onUpdateCustomer}
            onCustomerSelect={onCustomerSelect}
          />

          {/* Quote Dropdown Section */}
          <QuoteDropdownSection 
            customerQuotes={customerQuotes}
            currentQuote={currentQuote}
            baseQuoteNumber={baseQuoteNumber}
            customer={customer}
            onQuoteSelect={onQuoteSelect}
            onAddQuote={onAddQuote}
            onRenameQuote={onRenameQuote}
            onDeleteQuote={onDeleteQuote}
            onDuplicateQuote={onDuplicateQuote}
            onDeleteAllQuotes={onDeleteAllQuotes}
            formatCurrency={formatCurrency}
          />

          {/* Tier Dropdown Section */}
          <section className="/*px-4*/">
             <Label className="text-xs text-muted-foreground block mb-1">Selected Tier</Label>
             <DropdownMenu 
                open={isTierDropdownOpen} 
                onOpenChange={handleTierDropdownOpenChange} 
                modal={false}
             >
                 <DropdownMenuTrigger asChild>
                     <Button 
                       variant="outline" 
                       className="w-full h-8 text-sm justify-between font-regular" 
                       disabled={!currentQuote}
                     >
                         <span>
                           {selectedTierId ? getTierName(selectedTierId) : (currentQuote ? 'Select tier...' : 'No quote selected')}
                         </span>
                         <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                     </Button>
                 </DropdownMenuTrigger>
                 <DropdownMenuPortal>
                    <DropdownMenuContent 
                      align="start" 
                      sideOffset={4} 
                      className="w-[--radix-dropdown-menu-trigger-width]"
                      onCloseAutoFocus={handleDropdownCloseAutoFocus}
                    >
                       {sortedAvailableTiers.map((tier) => (
                           <div 
                             key={tier.id} 
                             onClick={() => {
                               if (editingTierId !== tier.id && tierConfirmDeleteId !== tier.id) {
                                   handleTierClick(tier.id); 
                                   setIsTierDropdownOpen(false);
                               }
                             }}
                             className={`group flex justify-between items-center text-xs px-2 py-2 cursor-pointer rounded-sm outline-none focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground ${tier.id === selectedTierId ? 'bg-accent' : ''} ${editingTierId === tier.id ? 'bg-muted' : ''} ${tierConfirmDeleteId === tier.id ? 'bg-destructive/10' : ''}`}
                           >
                             <div className="flex-grow flex items-center gap-2 mr-2 overflow-hidden min-w-0">
                                 {editingTierId === tier.id ? (
                                     <div className="flex-grow flex items-center gap-1">
                                         <Input ref={inputRef} type="text" value={editingTierName} onChange={(e) => setEditingTierName(e.target.value)} onKeyDown={handleRenameKeyDown} onBlur={handleSaveRename} onClick={(e) => e.stopPropagation()} className="h-6 text-xs flex-grow"/>
                                         <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0" onClick={(e) => { e.stopPropagation(); handleSaveRename(); }} title="Save Name"><Check className="h-3 w-3 text-primary" /></Button>
                                         <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0" onClick={(e) => { e.stopPropagation(); handleCancelRename(); }} title="Cancel Rename"><CloseIcon className="h-3 w-3" /></Button>
                                     </div>
                                 ) : (
                                     <span className="flex-grow truncate cursor-default" title={tier.name}>{tier.name}</span>
                                 )}
                              </div>
                               <div className="flex items-center shrink-0">
                                   {tierConfirmDeleteId === tier.id ? (
                                       <div className="flex items-center">
                                           <Button variant="destructive" size="sm" className="h-6 text-xs px-2 mr-1" onClick={(e) => { e.stopPropagation(); handleDeleteConfirmClick(tier.id); }} title="Confirm Delete">Confirm?</Button>
                                           <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => { e.stopPropagation(); setTierConfirmDeleteId(null); }} title="Cancel Delete"><CloseIcon className="h-3 w-3"/></Button>
                                       </div>
                                   ) : editingTierId === tier.id ? (
                                       null // No buttons while actively editing name inline
                                   ) : (
                                       <div className={`flex items-center opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity`}>
                                           <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={(e) => { e.stopPropagation(); handleStartRename(tier); }} title={`Rename ${tier.name}`} disabled={editingTierId !== null || tierConfirmDeleteId !== null || isDuplicatePopoverOpen}><Pencil className="h-4 w-4" /></Button>
                                           <Popover 
                                             open={isDuplicatePopoverOpen && duplicatingTierId === tier.id} // Correct condition
                                             onOpenChange={handlePopoverOpenChange}
                                            >
                                              <PopoverTrigger asChild>
                                                <Button 
                                                  variant="ghost" 
                                                  size="icon" 
                                                  className="h-6 w-6 text-muted-foreground hover:text-foreground" 
                                                  onClick={(e) => handleDuplicateButtonClick(e, tier.id)} 
                                                  title={`Duplicate ${tier.name}`} 
                                                  disabled={isProcessingAction || editingTierId !== null || tierConfirmDeleteId !== null}
                                                >
                                                  <Copy className="h-4 w-4" />
                                                </Button>
                                              </PopoverTrigger>
                                              <PopoverContent 
                                                className="w-64 p-2 relative" // Add relative positioning
                                                side="right" 
                                                align="start" 
                                                // Prevent closing dropdown when interacting outside popover
                                                onInteractOutside={handlePopoverOutsideInteraction}
                                               >
                                                  {/* Removed absolute positioned button */}
                                                  <div className="space-y-2 text-xs">
                                                      {/* Flex container for Title and Close Button */}
                                                      <div className="flex justify-between items-center mb-2 border-b pb-1">
                                                          <div className="font-semibold text-sm flex-grow text-center">Duplicate '{duplicatingTierId ? getTierName(duplicatingTierId) : ''}'</div>
                                                          <Button 
                                                              variant="ghost" 
                                                              size="icon" 
                                                              className="h-6 w-6 text-muted-foreground hover:text-foreground shrink-0" // Adjusted classes
                                                              onClick={(e) => { 
                                                                  e.stopPropagation(); 
                                                                  setIsDuplicatePopoverOpen(false); 
                                                                  setDuplicatingTierId(null); 
                                                              }} 
                                                              title="Close"
                                                          >
                                                              <CloseIcon className="h-4 w-4" />
                                                          </Button>
                                                      </div>
                                                      {/* Input for New Copies */}
                                                      <div className="space-y-1">
                                                          <Label htmlFor="new-tier-count" className="font-medium px-1">Create New Copies</Label>
                                                          <Input 
                                                            id="new-tier-count"
                                                            type="number" 
                                                            min="0" 
                                                            value={duplicateNewTierCount} // Use component state
                                                            onChange={(e) => {
                                                              e.stopPropagation(); // Prevent closing popover
                                                              setDuplicateNewTierCount(Math.max(0, parseInt(e.target.value, 10) || 0));
                                                            }}
                                                            onClick={(e) => e.stopPropagation()} // Also stop propagation on click
                                                            className="h-7 text-xs w-20"
                                                          />
                                                      </div>
                                                      <Separator className="my-2" />
                                                      {/* Checkboxes for Overwrite */}
                                                      <div className="space-y-1">
                                                          <Label className="font-medium px-1 block mb-1">Overwrite Existing Tiers</Label>
                                                          <ScrollArea className="max-h-32 pr-2">
                                                            {internalAvailableTiers
                                                              .filter(t => t.id !== duplicatingTierId)
                                                              .map(destTier => (
                                                                <div key={destTier.id} className="flex items-center space-x-2 py-1 px-1 rounded hover:bg-accent" onClick={(e) => e.stopPropagation()}> {/* Stop propagation on div click */}
                                                                  <Checkbox 
                                                                    id={`duplicate-target-${destTier.id}`} 
                                                                    checked={duplicateTargetTierIds.includes(destTier.id)} // Use component state
                                                                    onCheckedChange={(checked) => {
                                                                      // No need for stopPropagation here as it's on the parent div
                                                                      setDuplicateTargetTierIds(prev => // Use component state setter
                                                                        checked 
                                                                          ? [...prev, destTier.id] 
                                                                          : prev.filter(id => id !== destTier.id)
                                                                      );
                                                                    }}
                                                                  />
                                                                  <label htmlFor={`duplicate-target-${destTier.id}`} className="text-xs font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-grow cursor-pointer" title={destTier.name} onClick={(e) => e.stopPropagation()}> {/* Stop propagation on label click */}
                                                                     {destTier.name}
                                                                   </label>
                                                                 </div>
                                                              ))}
                                                            {internalAvailableTiers.length <= 1 && (<div className="text-muted-foreground italic px-2 text-center py-2">(No other tiers to overwrite)</div>)}
                                                          </ScrollArea>
                                                      </div>
                                                      <Separator className="my-2" />
                                                      {/* Confirmation Button */}
                                                      <Button 
                                                        className="w-full h-8 text-xs mt-2" 
                                                        onClick={handleDuplicateConfirmClick} 
                                                        disabled={duplicateNewTierCount === 0 && duplicateTargetTierIds.length === 0}
                                                      >
                                                        {/* Adjusted button text */}
                                                        Duplicate ({duplicateNewTierCount + duplicateTargetTierIds.length})
                                                      </Button>
                                                  </div>
                                              </PopoverContent>
                                           </Popover>
                                           <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={(e) => handleDeleteTierButtonClick(e, tier.id)} title={`Delete ${tier.name}`} disabled={editingTierId !== null || tierConfirmDeleteId !== null || isDuplicatePopoverOpen}><Trash2 className="h-4 w-4" /></Button>
                                       </div>
                                   )}
                               </div>
                           </div>
                       ))}
                       <DropdownMenuSeparator className="my-1" />
                       <DropdownMenuItem 
                         onSelect={(e: Event) => { e.preventDefault(); onAddTier(); /* Dropdown remains open due to preventDefault */ }}
                         className="text-xs text-muted-foreground italic cursor-pointer flex items-center"
                       >
                          <PlusCircle className="h-4 w-4 mr-2" /> Add New Tier...
                       </DropdownMenuItem>
                       {internalAvailableTiers.length > 1 && (
                            <>
                              <DropdownMenuSeparator className="my-1" />
                              <DropdownMenuItem 
                                onSelect={(e: Event) => {
                                  e.preventDefault(); // Always prevent default to control flow
                                  if (confirmingDeleteAllTiers) {
                                    onDeleteAllTiers(); // Call the actual deletion function
                                    setConfirmingDeleteAllTiers(false);
                                    // setIsTierDropdownOpen(false); // Remove this line to keep dropdown open
                                  } else {
                                    setConfirmingDeleteAllTiers(true); // Enter confirmation state
                                    // Keep other potentially conflicting states reset
                                    setEditingTierId(null);
                                    setTierConfirmDeleteId(null);
                                    setIsDuplicatePopoverOpen(false);
                                    setDuplicatingTierId(null);
                                  }
                                }} 
                                className={`text-xs ${confirmingDeleteAllTiers ? 'text-destructive focus:bg-destructive focus:text-destructive-foreground' : 'text-muted-foreground focus:text-destructive focus:bg-destructive/10'} cursor-pointer flex items-center`}
                                disabled={internalAvailableTiers.length <= 1} // Disable if only one tier exists
                                >
                                <Trash className="h-4 w-4 mr-2" /> 
                                {confirmingDeleteAllTiers ? "Confirm Delete All?" : "Delete All Tiers..."}
                              </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                 </DropdownMenuPortal>
             </DropdownMenu>
          </section>

          <hr className="my-3 border-border/50" />

          {/* Tasks Section */}
          <section className="/*px-4*/ pt-0">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-semibold flex items-center"><List className="h-4 w-4 mr-2" /> Tasks</h3>
              <div className="flex items-center space-x-1">
                {clearConfirmTierId === selectedTierId && selectedTierId ? (
                  <Button variant="destructive" size="sm" className="h-6 text-xs px-2" onClick={() => handleConfirmClearAllTasks(selectedTierId)} title="Confirm Clear All Tasks" disabled={!currentQuote || reorderableTasks.length === 0} >Confirm Clear?</Button>
                ) : (
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={() => { if (selectedTierId) handleInitiateClearAllTasks(selectedTierId); }} title="Clear All Tasks" disabled={!currentQuote || reorderableTasks.length === 0} ><Eraser className="h-4 w-4" /></Button>
                )}
                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={handleOpenEditAllTasksDialog} title="Edit All Tasks" disabled={!currentQuote || reorderableTasks.length === 0}><Settings2 className="h-4 w-4"/></Button>
              </div>
            </div>
            {currentQuote && currentQuote.selectedTierId ? ( // Adjusted conditional check
              <QuoteTasksList
                tasks={reorderableTasks} 
                selectedTierId={currentQuote.selectedTierId} // Pass guaranteed string
                sensors={sensors}
                onDragEnd={handleTaskDragEnd}
                onDeleteTask={handleDeleteTask}
                onEditTask={handleOpenEditTaskDialog}
                onUpdateTaskQuantity={handleUpdateTaskQuantity}
              />
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">{currentQuote ? "Select a tier to view tasks." : "Select a quote to view tasks."}</p>
            )}
          </section>

          {/* Separator */}
          <Separator />

          {/* Pricing Section */}
          <QuotePricingDetails 
             // Pass necessary props, including helper functions if needed
             currentQuote={currentQuote}
             selectedTierId={currentQuote?.selectedTierId || null} // Keep fallback here as component might handle null
             getTierName={getTierName}
             formatCurrency={formatCurrency}
             showAdjustmentSlider={showAdjustmentSlider}
             setShowAdjustmentSlider={setShowAdjustmentSlider}
             adjustmentPercentage={adjustmentPercentage}
             setAdjustmentPercentage={setAdjustmentPercentage}
             onUpdateAllTasks={onUpdateAllTasks} // Pass the handler from props
             calculateTierTotalPrice={calculateTierTotalPrice} // Pass the function
             applyProportionalAdjustment={applyProportionalAdjustment} // Pass the function
          />
        </div>
      </ScrollArea>

      {/* Footer Area - Ensure it uses bg-card */}
      <div className="p-4 border-t bg-card space-y-2 flex-shrink-0">
         <Button variant="secondary" className="w-full" onClick={onPreviewQuote} disabled={!currentQuote}><Eye className="mr-2 h-4 w-4" /> Preview Quote</Button>
         <DropdownMenu
             onOpenChange={(open: boolean) => {
                 if (open && currentQuote) {
                     setIsEditingSendEmail(false); setIsEditingSendSms(false);
                     setTempSendEmail(customer?.email || ""); setTempSendSms(customer?.phone || "");
                     setDisabledEmailSendClicks(0); setDisabledSmsSendClicks(0);
                     setIsEditingSendEmail(false); setIsEditingSendSms(false);
                     const initialSelection = customerQuotes.length === 1 ? [customerQuotes[0].id] : (customerQuotes.length > 1 ? [currentQuote.id] : []);
                     setQuotesToSendIds(initialSelection);
                 }
             }}
         >
           <DropdownMenuTrigger asChild>
             <Button variant="outline" className="w-full" disabled={!canSend || !currentQuote} title={!currentQuote ? 'No quote selected' : isQuoteSentOrAccepted ? `Quote already ${currentQuote.status}` : (!hasEmail && !hasPhone ? "No customer email/phone" : "Send Quote")}><Send className="mr-2 h-4 w-4" /> Send Quote</Button>
           </DropdownMenuTrigger>
           <DropdownMenuContent className="w-72" align="end">
             {customerQuotes.length > 1 && (
               <>
                 <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Select Quotes to Send</div>
                 <ScrollArea className="max-h-36">
                   {customerQuotes.map(q => {
                     const handleCheckedChange = (checked: boolean | 'indeterminate'): void => {
                       const quoteId = q.id;
                       setQuotesToSendIds(prev => checked === true ? [...prev, quoteId] : prev.filter(id => id !== quoteId));
                     };
 
                     return (
                       <DropdownMenuItem key={q.id} className="flex items-center gap-2 pr-2 pl-2" onSelect={(e: Event) => e.preventDefault()}>
                         <Checkbox 
                           id={`send-quote-${q.id}`} 
                           checked={quotesToSendIds.includes(q.id)} 
                           onCheckedChange={handleCheckedChange}
                           className="shrink-0"
                         />
                         <label htmlFor={`send-quote-${q.id}`} className="text-xs cursor-pointer flex-grow truncate" title={`${q.quoteNumber} (${q.status}) - ${formatCurrency(q.totalPrice)}`}>{q.quoteNumber} ({q.status}) - {formatCurrency(q.totalPrice)}</label>
                       </DropdownMenuItem>
                     );
                   })}
                 </ScrollArea>
                 <DropdownMenuSeparator className="my-1"/>
               </>
             )}
             {hasEmail && (
               <DropdownMenuItem onSelect={(e: Event) => {
                 if ((e.target as HTMLElement).closest('button, input')) e.preventDefault();
                 else if (quotesToSendIds.length === 0) {
                   const newClickCount = disabledEmailSendClicks + 1; setDisabledEmailSendClicks(newClickCount);
                   if (newClickCount > 2) { setIsEditingSendEmail(true); setTimeout(() => setIsEditingSendEmail(false), 2500); setDisabledEmailSendClicks(0); }
                   e.preventDefault();
                 } else {
                   const finalEmail = isEditingSendEmail ? tempSendEmail : customer.email;
                   const quotes = customerQuotes.filter(q => quotesToSendIds.includes(q.id));
                   console.log(`Action: Send ${quotes.length} quote(s) [${quotes.map(q => q.quoteNumber).join(', ')}] via Email to: ${finalEmail}`);
                   setIsEditingSendEmail(false); setQuotesToSendIds([]);
                 }
               }} className="cursor-pointer flex justify-between items-center">
                 {isEditingSendEmail ? (
                   <div className="flex items-center gap-1 w-full">
                     <Mail className="mr-1 h-4 w-4 shrink-0" />
                     <Input type="email" value={tempSendEmail} onChange={(e) => setTempSendEmail(e.target.value)} onKeyDown={(e: React.KeyboardEvent) => {
                       if (e.key === 'Enter') {
                         if (quotesToSendIds.length === 0) {
                           const newClickCount = disabledEmailSendClicks + 1; setDisabledEmailSendClicks(newClickCount);
                           if (newClickCount > 2) { setIsEditingSendEmail(true); setTimeout(() => setIsEditingSendEmail(false), 2500); setDisabledEmailSendClicks(0); }
                           e.preventDefault(); return;
                         }
                         console.log('Action: Send via Email to (Edited): ', tempSendEmail); setIsEditingSendEmail(false); setQuotesToSendIds([]);
                       } else if (e.key === 'Escape') { setIsEditingSendEmail(false); setTempSendEmail(customer.email || ""); }
                     }} className="h-6 text-xs flex-grow" />
                     <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0" onClick={(e: React.MouseEvent) => { e.stopPropagation(); setIsEditingSendEmail(false); setTempSendEmail(customer.email || ""); }} title="Cancel Edit"><CloseIcon className="h-3 w-3"/></Button>
                   </div>
                 ) : (
                   <>
                     <div className="flex items-center overflow-hidden">
                       <Mail className="mr-2 h-4 w-4 shrink-0" />
                       <span className="truncate cursor-default" title={customer.email ?? undefined}>{customer.email}</span>
                     </div>
                     <Button variant="ghost" size="icon" className="h-5 w-5 ml-2 shrink-0" onClick={(e: React.MouseEvent) => { e.stopPropagation(); setTempSendEmail(customer.email || ""); setIsEditingSendEmail(true); }} title="Edit Email"><Pencil className="h-3 w-3" /></Button>
                   </>
                 )}
               </DropdownMenuItem>
             )}
             {hasPhone && (
               <DropdownMenuItem onSelect={(e: Event) => {
                 if ((e.target as HTMLElement).closest('button, input')) e.preventDefault();
                 else if (quotesToSendIds.length === 0) {
                   const newClickCount = disabledSmsSendClicks + 1; setDisabledSmsSendClicks(newClickCount);
                   if (newClickCount > 2) { setIsEditingSendSms(true); setTimeout(() => setIsEditingSendSms(false), 2500); setDisabledSmsSendClicks(0); }
                   e.preventDefault();
                 } else {
                   const finalSms = isEditingSendSms ? tempSendSms : customer.phone;
                   const quotes = customerQuotes.filter(q => quotesToSendIds.includes(q.id));
                   console.log(`Action: Send ${quotes.length} quote(s) [${quotes.map(q => q.quoteNumber).join(', ')}] via SMS to: ${finalSms}`);
                   setIsEditingSendSms(false); setQuotesToSendIds([]);
                 }
               }} className="cursor-pointer flex justify-between items-center">
                 {isEditingSendSms ? (
                   <div className="flex items-center gap-1 w-full">
                     <Smartphone className="mr-1 h-4 w-4 shrink-0" />
                     <Input type="tel" value={tempSendSms} onChange={(e) => setTempSendSms(e.target.value)} onKeyDown={(e: React.KeyboardEvent) => {
                       if (e.key === 'Enter') {
                         if (quotesToSendIds.length === 0) {
                           const newClickCount = disabledSmsSendClicks + 1; setDisabledSmsSendClicks(newClickCount);
                           if (newClickCount > 2) { setIsEditingSendSms(true); setTimeout(() => setIsEditingSendSms(false), 2500); setDisabledSmsSendClicks(0); }
                           e.preventDefault(); return;
                         }
                         console.log('Action: Send via SMS to (Edited): ', tempSendSms); setIsEditingSendSms(false); setQuotesToSendIds([]);
                       } else if (e.key === 'Escape') { setIsEditingSendSms(false); setTempSendSms(customer.phone || ""); }
                     }} className="h-6 text-xs flex-grow" />
                     <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0" onClick={(e: React.MouseEvent) => { e.stopPropagation(); setIsEditingSendSms(false); setTempSendSms(customer.phone || ""); }} title="Cancel Edit"><CloseIcon className="h-3 w-3"/></Button>
                   </div>
                 ) : (
                   <>
                     <div className="flex items-center overflow-hidden">
                       <Smartphone className="mr-2 h-4 w-4 shrink-0" />
                       <span className="truncate cursor-default" title={customer.phone ?? undefined}>{customer.phone}</span>
                     </div>
                     <Button variant="ghost" size="icon" className="h-5 w-5 ml-2 shrink-0" onClick={(e: React.MouseEvent) => { e.stopPropagation(); setTempSendSms(customer.phone || ""); setIsEditingSendSms(true); }} title="Edit Phone"><Pencil className="h-3 w-3" /></Button>
                   </>
                 )}
               </DropdownMenuItem>
             )}
             {!hasEmail && !hasPhone && (<DropdownMenuItem disabled className="text-xs text-muted-foreground italic">No customer email or phone.</DropdownMenuItem>)}
           </DropdownMenuContent>
         </DropdownMenu>
         <Button variant="default" className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={() => currentQuote && console.log('Accept Quote Clicked - ID:', currentQuote.id)} disabled={!currentQuote || currentQuote.status !== 'Sent'} title={!currentQuote ? 'No quote selected' : currentQuote.status !== 'Sent' ? 'Quote must be Sent to be Accepted' : 'Accept Quote'}><CheckCircle className="mr-2 h-4 w-4" /> Accept Quote</Button>
      </div>

      {/* Dialogs (Re-added) */}
      {isEditDialogOpen && editingTaskDetails && (
        <EditTaskDialog
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          taskDetails={editingTaskDetails}
          onUpdateTask={onUpdateTask}
        />
      )}
      {isEditAllTasksDialogOpen && currentQuote && selectedTierId && editingAllTasksTierId && (
        <EditAllTasksDialog
          isOpen={isEditAllTasksDialogOpen}
          onOpenChange={setIsEditAllTasksDialogOpen}
          tierId={editingAllTasksTierId}
          tierName={getTierName(editingAllTasksTierId)}
          tasks={reorderableTasks}
          onUpdateAllTasks={(updatedTasks: QuoteTask[]) => { 
            if(editingAllTasksTierId) {
                onUpdateAllTasks(editingAllTasksTierId, updatedTasks);
            }
         }}
        />
      )}
    </div>
  );
} 