import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Quote, Customer, QuoteTask, Tier, Addon } from "@/types/quote";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/Badge";
import {
  User,
  Tag,
  List,
  DollarSign,
  PlusCircle,
  ChevronsUpDown,
  X as CancelIcon,
  Trash2,
  Pencil,
  Settings2,
  Check,
  Send,
  CheckCircle,
  Eye,
  Mail,
  Smartphone,
  Undo2,
  Redo2,
  PanelRightClose,
  Copy,
  Trash,
  Eraser,
  Users,
  Phone,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "@/components/ui/Tooltip"; // <-- Corrected to PascalCase
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea"; // <-- Add Textarea import

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

const EditAllTasksDialog = ({ isOpen, onOpenChange, tierId, tierName, tasks, onUpdateAllTasks }: any) => {
  useEffect(() => { if (isOpen) console.log("Placeholder EditAllTasksDialog:", tierId); }, [isOpen, tierId]);
  if (!isOpen) return null;
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange} modal={false}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit All Tasks for {tierName} (Placeholder)</DialogTitle>
        </DialogHeader>
        <p>Contains {tasks?.length} tasks.</p>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// --- Sortable Task Item Component ---
const SortableTaskItem = ({ id, task, index, tierId, onDelete, onEdit, onUpdateQuantity }:
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
  // State for inline quantity editing
  const [inlineQuantity, setInlineQuantity] = useState<string>((task.quantity ?? 1).toString());

  // Reset inline quantity if the task prop changes from parent (e.g., after external update)
  useEffect(() => {
      setInlineQuantity((task.quantity ?? 1).toString());
  }, [task.quantity]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const toggleExpand = () => setIsExpanded(!isExpanded);

  // Handler to process and save inline quantity change
  const handleQuantitySave = () => {
    const currentVal = parseInt(inlineQuantity, 10);
    const originalVal = task.quantity ?? 1;

    // Save only if it's a valid number >= 1 and different from the original
    if (!isNaN(currentVal) && currentVal >= 1 && currentVal !== originalVal) {
        onUpdateQuantity(currentVal);
        // No need to setInlineQuantity here, useEffect will handle sync if prop updates
    } else {
        // If invalid or unchanged, reset input to original value
        setInlineQuantity(originalVal.toString());
    }
  };

  // Update local state on input change
  const handleQuantityInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInlineQuantity(event.target.value);
  };

  const handleQuantityKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
          handleQuantitySave();
          (event.target as HTMLInputElement).blur(); // Remove focus
      } else if (event.key === 'Escape') {
          setInlineQuantity((task.quantity ?? 1).toString()); // Reset on escape
          (event.target as HTMLInputElement).blur(); // Remove focus
      }
  };

  const handleTaskItemDeleteClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    console.log(`[SortableTaskItem] Delete button clicked for task index: ${index}, ID: ${id}`);
    onDelete(); // Call the prop passed from parent
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="border p-2 rounded bg-background flex flex-col mb-1 touch-none">
      {/* Top Row: Title, Quantity, Price, Buttons */}
      <div className="flex justify-between items-start w-full">
        {/* Clickable Title Area (Handles Dragging) */}
        <button 
          onClick={toggleExpand} 
          className="flex-grow text-left mr-2 focus:outline-none focus:ring-1 focus:ring-ring rounded-sm p-0.5 -m-0.5"
          title={isExpanded ? "Hide description" : "Show description"}
          {...listeners} // Allow dragging from title area
        >
          {/* Removed quantity display from here */}
          <span className="block break-words font-medium text-sm">{task.name}</span>
        </button>
        {/* Quantity, Price & Action Buttons */} 
        <div className="flex items-center flex-shrink-0 space-x-1 pt-0.5">
           {/* === Inline Quantity Input === */}
            <Input 
                type="number"
                value={inlineQuantity}
                onChange={handleQuantityInputChange} // Update local state
                onBlur={handleQuantitySave} // Save on blur
                onKeyDown={handleQuantityKeyDown} // Save on Enter, Reset on Escape
                min="1"
                step="1"
                // Removed classes hiding the spinner arrows
                className="h-6 w-12 text-xs px-1 text-center"
                onClick={(e) => e.stopPropagation()} // Prevent click from propagating to toggleExpand or drag listeners
                aria-label={`Quantity for ${task.name}`}
            />
          {/* === End Inline Quantity Input === */}
          <span className="text-sm font-semibold mr-1">{formatCurrencyStatic(task.basePrice)}</span>
          {/* Action Buttons */} 
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                 <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => {e.stopPropagation(); onEdit();}} title="Edit Task Details"><Pencil className="h-3 w-3"/></Button>
              </TooltipTrigger>
              <TooltipContent side="top"><p>Edit Details</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                 {/* Updated onClick to use the new handler with logging */}
                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={handleTaskItemDeleteClick} title="Delete Task"><Trash2 className="h-3 w-3"/></Button>
              </TooltipTrigger>
              <TooltipContent side="top"><p>Delete Task</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      {/* Conditionally Rendered Description */} 
      {isExpanded && task.description && (
        <p className="text-xs text-muted-foreground break-words mt-1.5 pl-1 pr-1 w-full">
          {task.description}
        </p>
      )}
    </div>
  ); // Fixed missing closing curly brace
};

const formatCurrencyStatic = (amount: number): string => {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(amount);
};

const mockOtherQuotes: Quote[] = [
  {
    id: "quote-123", quoteNumber: "Q-1001", sequenceNumber: 1, name: "Initial Quote", customerId: "cust-1", status: "Sent",
    tierTasks: { "tier-bronze": [{ taskId: "task-2", name: "Replace HW Heater", description: "Electric 50L", basePrice: 1200, addons: [] }] },
    selectedTierId: "tier-bronze", adjustments: [], totalPrice: 1200,
    createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date(Date.now() - 86400000).toISOString(), sentAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "quote-456", quoteNumber: "Q-1001", sequenceNumber: 2, name: "Ceiling Fan Install", customerId: "cust-1", status: "Accepted",
    tierTasks: { "tier-bronze": [{ taskId: "task-4", name: "Install Ceiling Fan", description: "Std wiring", basePrice: 180, addons: [] }] },
    selectedTierId: "tier-bronze", adjustments: [{ adjustmentId: "adj-1", type: "manual", description: "Discount", value: -20, amount: -20 }], totalPrice: 160,
    createdAt: new Date(Date.now() - 172800000).toISOString(), updatedAt: new Date(Date.now() - 172800000).toISOString(), acceptedAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: "quote-789", quoteNumber: "Q-1001", sequenceNumber: 3, name: "Drain & Dishwasher", customerId: "cust-1", status: "Draft",
    tierTasks: {
      "tier-bronze": [{ taskId: "task-3", name: "Clear Blocked Drain", description: "Std equipment", basePrice: 250, addons: [] }],
      "tier-silver": [
        { taskId: "task-1", name: "Install Dishwasher", description: "Standard", basePrice: 350, addons: [{ addonId: "addon-1", name: "Warranty", price: 50 }] },
        { taskId: "task-3", name: "Clear Blocked Drain", description: "Std equipment", basePrice: 250, addons: [] }
      ],
      "tier-gold": [],
    },
    selectedTierId: "tier-silver", adjustments: [], totalPrice: (350 + 50 + 250),
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
];

interface CurrentQuoteSidebarProps {
  quotes: Quote[];
  currentQuoteId: string | null;
  customer: Customer | null;
  availableTiers: Tier[];
  allCustomers: Customer[];
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
  onUpdateTaskPrice: (taskIndex: number, tierId: string, newPrice: number) => void;
  onUpdateTask: (taskIndex: number, tierId: string, updatedTask: QuoteTask) => void;
  onApplyPercentageAdjustment: (percentage: number) => void;
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
  currentTasks: QuoteTask[],
  tierId: string
): { updatedTasks: QuoteTask[], finalTotal: number } | null => {
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

export function CurrentQuoteSidebar({
  quotes,
  currentQuoteId,
  customer,
  availableTiers: availableTiersProp,
  allCustomers,
  onQuoteSelect,
  onTierSelect,
  onDeleteTask,
  onAddTier,
  onDeleteTier,
  onRenameTier,
  onPreviewQuote,
  onUpdateCustomer,
  onCustomerSelect,
  onAddQuote,
  onDeleteQuote,
  onRenameQuote,
  onUpdateTaskPrice,
  onUpdateTask,
  onApplyPercentageAdjustment,
  onUpdateAllTasks,
  onReorderTasks,
  onDuplicateTier,
  onClearAllTasks,
  onDeleteAllQuotes,
  onDuplicateQuote,
  onDeleteAllTiers,
}: CurrentQuoteSidebarProps) {
  console.log("CurrentQuoteSidebar received quotes:", quotes, "currentQuoteId:", currentQuoteId);

  // Add log inside the memo where currentQuote is derived
  const currentQuote = useMemo(() => {
    if (!currentQuoteId || !quotes) {
      console.log("[CurrentQuoteSidebar] currentQuote memo: No currentQuoteId or quotes");
      return null;
    }
    const foundQuote = quotes.find(q => q.id === currentQuoteId);
    console.log("[CurrentQuoteSidebar] currentQuote memo: Found quote?", foundQuote);
    return foundQuote || null;
  }, [currentQuoteId, quotes]);

  // Add log inside the memo where tasks are derived
  const tasksForSelectedTier = useMemo(() => {
    if (!currentQuote || !currentQuote.selectedTierId || !(currentQuote.selectedTierId in currentQuote.tierTasks)) {
      console.log("[CurrentQuoteSidebar] tasksForSelectedTier memo: No current quote, selected tier, or tier tasks");
      return [];
    }
    const tasks = currentQuote.tierTasks[currentQuote.selectedTierId] || [];
    console.log("[CurrentQuoteSidebar] tasksForSelectedTier memo: Derived tasks:", tasks);
    return tasks;
  }, [currentQuote]); // Dependency: currentQuote

  // Add another log for the DND-specific tasks array
  const reorderableTasks: ReorderableQuoteTask[] = useMemo(() => {
    const tasks = tasksForSelectedTier.map(task => ({ ...task, tempDndId: task.taskId }));
    console.log("[CurrentQuoteSidebar] reorderableTasks memo: Derived:", tasks);
    return tasks;
  }, [tasksForSelectedTier]); // Dependency: tasksForSelectedTier

  if (!customer) {
    return (
      <div className="flex flex-col h-full border-l bg-background items-center justify-center p-4">
        <p className="text-sm text-muted-foreground text-center">
          Select a customer first.
        </p>
      </div>
    );
  }

  const [internalAvailableTiers, setInternalAvailableTiers] = useState<Tier[]>(availableTiersProp);
  const [isTierDropdownOpen, setIsTierDropdownOpen] = useState(false);
  const [editingTierId, setEditingTierId] = useState<string | null>(null);
  const [editingTierName, setEditingTierName] = useState<string>("");
  const [tierConfirmDeleteId, setTierConfirmDeleteId] = useState<string | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState<boolean>(false);
  const [isEditingCustomer, setIsEditingCustomer] = useState<boolean>(false);
  const [editableCustomer, setEditableCustomer] = useState<Customer | null>(null);
  const [isQuoteDropdownOpen, setIsQuoteDropdownOpen] = useState(false);
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
  const [editingQuoteName, setEditingQuoteName] = useState<string>("");
  const [confirmingDeleteQuoteId, setConfirmingDeleteQuoteId] = useState<string | null>(null);
  const [isEditingSendEmail, setIsEditingSendEmail] = useState<boolean>(false);
  const [tempSendEmail, setTempSendEmail] = useState<string>("");
  const [isEditingSendSms, setIsEditingSendSms] = useState<boolean>(false);
  const [tempSendSms, setTempSendSms] = useState<string>("");
  const [quotesToSendIds, setQuotesToSendIds] = useState<string[]>([]);
  const [disabledEmailSendClicks, setDisabledEmailSendClicks] = useState<number>(0);
  const [disabledSmsSendClicks, setDisabledSmsSendClicks] = useState<number>(0);
  const [showEmailSelectWarning, setShowEmailSelectWarning] = useState<boolean>(false);
  const [showSmsSelectWarning, setShowSmsSelectWarning] = useState<boolean>(false);
  const [editingTaskPriceIndex, setEditingTaskPriceIndex] = useState<number | null>(null);
  const [editingTaskPriceStr, setEditingTaskPriceStr] = useState<string>("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTaskDetails, setEditingTaskDetails] = useState<{ task: QuoteTask; index: number; tierId: string } | null>(null);
  const [isEditAllTasksDialogOpen, setIsEditAllTasksDialogOpen] = useState(false);
  const [adjustmentPercentage, setAdjustmentPercentage] = useState<number>(0);
  const [showAdjustmentSlider, setShowAdjustmentSlider] = useState<boolean>(false);
  type ReorderableQuoteTask = QuoteTask & { tempDndId: string };
  const inputRef = useRef<HTMLInputElement>(null);
  const customerNameInputRef = useRef<HTMLInputElement>(null);
  const quoteInputRef = useRef<HTMLInputElement>(null);
  const totalPriceInputRef = useRef<HTMLInputElement>(null);
  const [isEditingTotalPrice, setIsEditingTotalPrice] = useState<boolean>(false);
  const [editingTotalPriceStr, setEditingTotalPriceStr] = useState<string>("");
  const [duplicatingTierId, setDuplicatingTierId] = useState<string | null>(null);
  const [isDuplicatePopoverOpen, setIsDuplicatePopoverOpen] = useState<boolean>(false);
  const [clearConfirmTierId, setClearConfirmTierId] = useState<string | null>(null);
  const [confirmingDeleteAllQuotes, setConfirmingDeleteAllQuotes] = useState<boolean>(false);
  const [isSelectingCustomer, setIsSelectingCustomer] = useState<boolean>(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [duplicateTargetTierIds, setDuplicateTargetTierIds] = useState<string[]>([]);
  const [duplicateNewTierCount, setDuplicateNewTierCount] = useState<number>(1);
  const [confirmingDeleteAllTiers, setConfirmingDeleteAllTiers] = useState<boolean>(false);
  const [editingAllTasksTierId, setEditingAllTasksTierId] = useState<string | null>(null);

  const selectedTierId = currentQuote?.selectedTierId;
  const isQuoteSentOrAccepted = currentQuote?.status === 'Sent' || currentQuote?.status === 'Accepted';
  const hasEmail = !!customer.email;
  const hasPhone = !!customer.phone;
  const canSend = !isQuoteSentOrAccepted && (hasEmail || hasPhone);
  const customerQuotes = quotes.filter((q) => q.customerId === customer.id);
  const baseQuoteNumber = customerQuotes[0]?.quoteNumber || "Q-ERR";

  useEffect(() => { if (editingTierId && inputRef.current) inputRef.current.focus(); }, [editingTierId]);
  useEffect(() => { if (isEditingCustomer && customerNameInputRef.current) customerNameInputRef.current.focus(); }, [isEditingCustomer]);
  useEffect(() => { if (customer && !isEditingCustomer) setEditableCustomer({ ...customer }); }, [customer, isEditingCustomer]);
  useEffect(() => { if (editingQuoteId && quoteInputRef.current) quoteInputRef.current.focus(); }, [editingQuoteId]);
  useEffect(() => { if (customer?.email && !isEditingSendEmail) setTempSendEmail(customer.email); if (customer?.phone && !isEditingSendSms) setTempSendSms(customer.phone); }, [customer, isEditingSendEmail, isEditingSendSms]);
  useEffect(() => { setInternalAvailableTiers(availableTiersProp); }, [availableTiersProp]);
  useEffect(() => { setClearConfirmTierId(null); }, [selectedTierId]);
  useEffect(() => { 
    if (!isQuoteDropdownOpen || currentQuoteId) {
        setConfirmingDeleteAllQuotes(false);
    }
    // Reset tier delete confirmation when quote dropdown state changes
    setConfirmingDeleteAllTiers(false); 
  }, [isQuoteDropdownOpen, currentQuoteId]);
  useEffect(() => { 
    if (!isSelectingCustomer || isEditingCustomer) {
        setCustomerSearchQuery('');
    }
    if (isSelectingCustomer) {
        setIsEditingCustomer(false);
    }
  }, [isSelectingCustomer, isEditingCustomer]);

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

  const formatCurrency = (amount: number): string => new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(amount);
  const getTierName = (tierId?: string): string => internalAvailableTiers.find(t => t.id === tierId)?.name || (tierId ? `Tier ${tierId}` : "None");
  const getStatusVariant = (status: Quote["status"]): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "Accepted": return "default";
      case "Sent": return "outline";
      case "Declined": case "Archived": return "destructive";
      default: return "secondary";
    }
  };

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
  const handleTrashClick = (tierId: string) => {
    console.log("handleTrashClick called for tier:", tierId);
    setTierConfirmDeleteId(tierId);
    setEditingTierId(null);
  };
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

  const filteredCustomers = useMemo(() => {
    const lowerCaseQuery = customerSearchQuery.toLowerCase().trim();
    if (!lowerCaseQuery) {
      return allCustomers;
    }
    return allCustomers.filter(customer => 
      customer.name.toLowerCase().includes(lowerCaseQuery) ||
      customer.email?.toLowerCase().includes(lowerCaseQuery) ||
      customer.phone?.toLowerCase().includes(lowerCaseQuery) ||
      customer.address?.toLowerCase().includes(lowerCaseQuery) 
    );
  }, [allCustomers, customerSearchQuery]);

  const handleInlineCustomerSelect = (customerId: string) => {
    onCustomerSelect(customerId);
    setIsSelectingCustomer(false);
  };

  const handleStartEditCustomer = () => { 
    setEditableCustomer({ ...customer }); 
    setIsEditingCustomer(true); 
    setIsSelectingCustomer(false);
  };
  const handleCancelEditCustomer = () => { 
      setEditableCustomer({ ...customer });
      setIsEditingCustomer(false); 
  };

  const handleSaveCustomer = () => { 
      if (editableCustomer) { 
          if (!editableCustomer.name.trim()) { 
              alert("Customer name cannot be empty."); 
              return; 
          } 
          onUpdateCustomer(editableCustomer); 
          setIsEditingCustomer(false); 
      } 
  };

  const handleCustomerInputChange = (event: React.ChangeEvent<HTMLInputElement>) => { const { name, value } = event.target; setEditableCustomer(prev => prev ? { ...prev, [name]: value } : null); };
  const handleCustomerKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => { if (event.key === 'Enter') handleSaveCustomer(); else if (event.key === 'Escape') handleCancelEditCustomer(); };
  const handleQuoteClick = (quoteId: string) => { 
    if (!quoteId || editingQuoteId === quoteId || confirmingDeleteQuoteId === quoteId) return;
    if (confirmingDeleteQuoteId !== null) setConfirmingDeleteQuoteId(null);
    if (editingQuoteId !== null) setEditingQuoteId(null);
    onQuoteSelect(quoteId);
  };
  const handleStartRenameQuote = (quoteToRename: Quote) => {
    setEditingQuoteId(quoteToRename.id);
    setEditingQuoteName(quoteToRename.name);
    setConfirmingDeleteQuoteId(null);
  };
  const handleCancelRenameQuote = () => { setEditingQuoteId(null); setEditingQuoteName(""); };
  const handleQuoteNameInputChange = (event: React.ChangeEvent<HTMLInputElement>) => { setEditingQuoteName(event.target.value); };
  const handleFinishRenameQuote = () => { 
    if (!editingQuoteId) { 
        handleCancelRenameQuote();
        return; 
    }
    
    const quoteToRename = customerQuotes.find(q => q.id === editingQuoteId);
    if (!quoteToRename) {
        console.error("Could not find quote to rename:", editingQuoteId);
        handleCancelRenameQuote();
        return;
    }

    const trimmedName = editingQuoteName.trim();
    let nameToSave: string;

    if (trimmedName === "") {
      nameToSave = quoteToRename.sequenceNumber.toString();
    } else {
      nameToSave = trimmedName;
    }

    if (nameToSave !== quoteToRename.name || trimmedName === "") { 
      onRenameQuote(editingQuoteId, nameToSave);
    }

    handleCancelRenameQuote();
  };
  const handleQuoteRenameKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => { if (event.key === 'Enter') handleFinishRenameQuote(); else if (event.key === 'Escape') handleCancelRenameQuote(); };
  const handleDeleteQuoteClick = (quoteId: string) => {
    if (confirmingDeleteQuoteId === quoteId) {
      onDeleteQuote(quoteId);
      setConfirmingDeleteQuoteId(null);

      if (currentQuote?.id === quoteId) { 
          const remainingQuotes = customerQuotes.filter(q => q.id !== quoteId);
          const nextQuote = remainingQuotes[0];
          if (nextQuote) {
              onQuoteSelect(nextQuote.id);
          } else {
              onQuoteSelect("");
              console.log("Last quote deleted. No quotes remaining.");
          }
      }
    } else {
      setConfirmingDeleteQuoteId(quoteId);
      setEditingQuoteId(null);
    }
  };
  const handleStartEditTaskPrice = (index: number, currentPrice: number) => { setEditingTaskPriceIndex(index); setEditingTaskPriceStr(currentPrice.toString()); };
  const handleCancelEditTaskPrice = () => { setEditingTaskPriceIndex(null); setEditingTaskPriceStr(""); };
  const handleSaveTaskPrice = (index: number) => { 
      const newPrice = parseFloat(editingTaskPriceStr); 
      if (editingTaskPriceIndex === index && !isNaN(newPrice) && selectedTierId && currentQuote) { 
          handleUpdateSingleTaskPrice(index, selectedTierId, newPrice); 
      } 
      handleCancelEditTaskPrice(); 
  };
  const handleTaskPriceKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, index: number) => { if (event.key === 'Enter') handleSaveTaskPrice(index); else if (event.key === 'Escape') handleCancelEditTaskPrice(); };
  const handleOpenEditTaskDialog = useCallback((task: QuoteTask, index: number, tierId: string) => {
    setEditingTaskDetails({ task, index, tierId });
    setIsEditDialogOpen(true);
  }, []);
  const handleOpenEditAllTasksDialog = useCallback(() => {
    if (!currentQuote?.selectedTierId) return;
    setEditingAllTasksTierId(currentQuote.selectedTierId);
    setIsEditAllTasksDialogOpen(true);
  }, [currentQuote?.selectedTierId]);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const handleTaskDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (selectedTierId && currentQuote && over && active.id !== over.id) {
      const oldIndex = reorderableTasks.findIndex(item => item.tempDndId === active.id);
      const newIndex = reorderableTasks.findIndex(item => item.tempDndId === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        // The UI will update when the parent state changes via onReorderTasks
        // No need to set local state here anymore.
        // const newOrder = arrayMove(reorderableTasks, oldIndex, newIndex);
        // setReorderableTasks(newOrder); // <-- REMOVE THIS LINE
        onReorderTasks(selectedTierId, oldIndex, newIndex);
      }
    }
  };
  const calculateTierTotalPrice = (tierId: string): number => {
    if (!currentQuote?.tierTasks?.[tierId]) return 0;
    return calculateQuoteTotalPriceFromTasks(currentQuote.tierTasks[tierId]);
  };
  const calculateTierSumOfBasePrices = (tierId: string): number => {
    if (!currentQuote?.tierTasks?.[tierId]) return 0;
    return currentQuote.tierTasks[tierId].reduce((sum, task) => sum + task.basePrice, 0);
  };
  const handleStartEditTotalPrice = (): void => {
    if (!currentQuote || showAdjustmentSlider) return;
    setEditingTotalPriceStr(currentQuote.totalPrice.toFixed(2));
    setIsEditingTotalPrice(true);
  };
  const handleCancelEditTotalPrice = (): void => { setIsEditingTotalPrice(false); setEditingTotalPriceStr(""); };
  const handleSaveTotalPrice = (): void => {
    if (!currentQuote) return;
    const newTotalPrice = parseFloat(editingTotalPriceStr);
    if (isNaN(newTotalPrice) || newTotalPrice < 0 || newTotalPrice === currentQuote.totalPrice) {
      handleCancelEditTotalPrice();
      return;
    }
    const currentSelectedTierId = currentQuote.selectedTierId;
    if (!currentSelectedTierId) { handleCancelEditTotalPrice(); return; }
    const currentTierTasks = currentQuote.tierTasks[currentSelectedTierId] || [];
    if (!currentTierTasks || currentTierTasks.length === 0) {
      handleCancelEditTotalPrice();
      return;
    }
    const adjustmentResult = applyProportionalAdjustment(newTotalPrice, currentTierTasks, currentSelectedTierId);
    if (!adjustmentResult) {
      handleCancelEditTotalPrice();
      return;
    }
    onUpdateAllTasks(currentSelectedTierId, adjustmentResult.updatedTasks);
    setAdjustmentPercentage(0);
    handleCancelEditTotalPrice();
  };
  const handleTotalPriceKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => { if (event.key === 'Enter') handleSaveTotalPrice(); else if (event.key === 'Escape') handleCancelEditTotalPrice(); };
  const handleUpdateSingleTaskPrice = (taskIndex: number, tierId: string, newBasePrice: number): void => {
    if (!currentQuote) return;
    const currentTierTasks = currentQuote.tierTasks[tierId];
    if (!currentTierTasks || taskIndex < 0 || taskIndex >= currentTierTasks.length) return;
    
    onUpdateTaskPrice(taskIndex, tierId, newBasePrice);
    setAdjustmentPercentage(0);
  };
  const handleStartDuplicate = (tierId: string, event: React.MouseEvent): void => {
    console.log("handleStartDuplicate called for tier:", tierId);
    event.stopPropagation(); 
    setDuplicatingTierId(tierId);
    setIsDuplicatePopoverOpen(true);
    setEditingTierId(null);
    setTierConfirmDeleteId(null);
  };
  const handleDuplicateToNew = (): void => { if (!duplicatingTierId || !currentQuote) return; const sourceTierName = getTierName(duplicatingTierId); let newTierName = `${sourceTierName} Copy`; let suffix = 1; while (internalAvailableTiers.some(t => t.name === newTierName)) { newTierName = `${sourceTierName} Copy ${++suffix}`; } onDuplicateTier(duplicatingTierId, null, newTierName); setIsDuplicatePopoverOpen(false); setDuplicatingTierId(null); };
  const handleDuplicateToExisting = (destinationTierId: string): void => { if (!duplicatingTierId || !currentQuote || destinationTierId === duplicatingTierId) return; onDuplicateTier(duplicatingTierId, destinationTierId); setIsDuplicatePopoverOpen(false); setDuplicatingTierId(null); };
  const handleInitiateClearAllTasks = (tierId: string): void => { setClearConfirmTierId(tierId); setTierConfirmDeleteId(null); };
  const handleConfirmClearAllTasks = (tierId: string): void => {
    if (!currentQuote || clearConfirmTierId !== tierId) return;
    onClearAllTasks(tierId);
    setClearConfirmTierId(null);
    setAdjustmentPercentage(0);
  };

  const handleAddNewQuote = () => {
    console.log("handleAddNewQuote called directly or from menu");
    const currentSequenceNumbers = customerQuotes.map(q => q.sequenceNumber);
    const nextSequenceNumber = currentSequenceNumbers.length > 0 ? Math.max(...currentSequenceNumbers) + 1 : 1;
    console.log(` - Calling onAddQuote with Next Sequence #: ${nextSequenceNumber}`);
    onAddQuote(nextSequenceNumber);
  };

  const handleInitiateDeleteAll = (event: Event) => {
      event.preventDefault();
      setConfirmingDeleteAllQuotes(true);
  };

  const handleConfirmDeleteAll = (event: Event) => {
      event.preventDefault();
      if (customer) {
          onDeleteAllQuotes(customer.id);
      }
      setConfirmingDeleteAllQuotes(false);
      // setIsQuoteDropdownOpen(false); // Remove this line to keep dropdown open
  };

  const handleDuplicateQuoteClick = (quoteId: string): void => {
    console.log("Duplicate quote clicked:", quoteId);
    onDuplicateQuote(quoteId); 
  };

  const handleConfirmDuplicate = (): void => {
    if (!duplicatingTierId || !currentQuote) return; // Guard against null ID

    const sourceTierName = getTierName(duplicatingTierId); // Checked non-null above
    let copyCounter = 1;

    // Function to find the next available copy name (consistent)
    const getNextCopyName = (baseName: string): string => {
        let newName: string;
        do {
            newName = `${baseName} Copy ${copyCounter++}`;
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

  // === NEW: Handler specifically for inline quantity updates ===
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

  }, [currentQuote, onUpdateTask]); // Depend on currentQuote and the main update handler

  return (
    <div className="flex flex-col h-full border-l bg-background">
      <div className="p-4 border-b flex justify-between items-center flex-shrink-0">
        <h2 className="text-lg font-semibold">Quote Details</h2>
      </div>

      <ScrollArea className="flex-grow">
        <div className="p-4 pr-6 space-y-6 min-w-0 overflow-hidden">
          {/* Customer Section */}
          <section className="px-4">
            <h3 className="text-sm font-semibold mb-2 flex items-center">
              <User className="h-4 w-4 mr-2" /> 
              Customer
              <div className="ml-auto flex items-center gap-1">
                {isEditingCustomer ? (
                  <>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-primary" onClick={handleSaveCustomer} title="Save Customer"><Check className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCancelEditCustomer} title="Cancel Edit"><CancelIcon className="h-4 w-4" /></Button>
                  </>
                ) : isSelectingCustomer ? (
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsSelectingCustomer(false)} title="Cancel Selection"><CancelIcon className="h-4 w-4" /></Button>
                ) : (
                  <>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => setIsSelectingCustomer(true)} title="Select Customer">
                        <Users className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={handleStartEditCustomer} title="Edit Customer Details">
                        <Pencil className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </h3>
            <div className="text-xs bg-muted p-3 rounded-md">
              {isSelectingCustomer ? (
                <div className="space-y-2">
                   <Input 
                      placeholder="Search customers..."
                      value={customerSearchQuery}
                      onChange={(e) => setCustomerSearchQuery(e.target.value)}
                      className="h-8 text-xs"
                      autoFocus
                   />
                   <ScrollArea className="h-[150px] border rounded-md">
                     <div className="p-1">
                       {filteredCustomers.length > 0 ? (
                         filteredCustomers.map(cust => (
                           <div 
                             key={cust.id}
                             onClick={() => handleInlineCustomerSelect(cust.id)}
                             className={`flex flex-col p-2 hover:bg-accent hover:text-accent-foreground rounded-sm cursor-pointer transition-colors duration-150 text-xs ${cust.id === customer.id ? 'bg-accent/50 font-medium' : ''}`}
                           >
                             <p className="font-semibold text-xs mb-0.5 truncate">{cust.name}</p>
                             <div className="flex items-center text-[11px] text-muted-foreground truncate">
                               <Mail className="h-2.5 w-2.5 mr-1 shrink-0"/>
                               <span>{cust.email || 'N/A'}</span>
                             </div>
                             <div className="flex items-center text-[11px] text-muted-foreground truncate">
                               <Phone className="h-2.5 w-2.5 mr-1 shrink-0"/>
                               <span>{cust.phone || 'N/A'}</span>
                             </div>
                           </div>
                         ))
                       ) : (
                         <p className="text-xs text-muted-foreground text-center p-4">No customers found.</p>
                       )}
                     </div>
                   </ScrollArea>
                 </div>
              ) : isEditingCustomer && editableCustomer ? (
                 <>
                  <div className="flex items-center h-6 mb-1"> 
                    <Label htmlFor="customerName" className="w-16 shrink-0 text-muted-foreground font-semibold font-sans text-xs leading-tight antialiased">Name</Label>
                    <Input 
                      ref={customerNameInputRef} 
                      id="customerName" 
                      name="name" 
                      value={editableCustomer.name} 
                      onChange={handleCustomerInputChange} 
                      onKeyDown={handleCustomerKeyDown} 
                      className="p-0 h-full font-sans text-foreground antialiased flex-grow bg-transparent border-0 shadow-none focus-visible:ring-0 rounded-none"
                      style={{ fontSize: '0.75rem', lineHeight: '1.25' }} /> 
                  </div>
                  <div className="flex items-center h-6 mb-1"> 
                    <Label htmlFor="customerEmail" className="w-16 shrink-0 text-muted-foreground font-semibold font-sans text-xs leading-tight antialiased">Email</Label>
                    <Input 
                      id="customerEmail" 
                      name="email" 
                      type="email" 
                      value={editableCustomer.email || ""} 
                      onChange={handleCustomerInputChange} 
                      onKeyDown={handleCustomerKeyDown} 
                      className="p-0 h-full font-sans text-foreground antialiased flex-grow bg-transparent border-0 shadow-none focus-visible:ring-0 rounded-none"
                      style={{ fontSize: '0.75rem', lineHeight: '1.25' }} /> 
                  </div>
                  <div className="flex items-center h-6 mb-1"> 
                    <Label htmlFor="customerPhone" className="w-16 shrink-0 text-muted-foreground font-semibold font-sans text-xs leading-tight antialiased">Phone</Label>
                    <Input 
                      id="customerPhone" 
                      name="phone" 
                      value={editableCustomer.phone || ""} 
                      onChange={handleCustomerInputChange} 
                      onKeyDown={handleCustomerKeyDown} 
                      className="p-0 h-full font-sans text-foreground antialiased flex-grow bg-transparent border-0 shadow-none focus-visible:ring-0 rounded-none"
                      style={{ fontSize: '0.75rem', lineHeight: '1.25' }} /> 
                  </div>
                  <div className="flex items-start h-auto mb-0"> 
                    <Label htmlFor="customerAddress" className="w-16 shrink-0 text-muted-foreground font-semibold font-sans text-xs leading-tight antialiased pt-px">Address</Label>
                    <textarea 
                      id="customerAddress" 
                      name="address" 
                      value={editableCustomer.address || ""} 
                      onChange={(e) => handleCustomerInputChange(e as any)} 
                      onKeyDown={(e) => handleCustomerKeyDown(e as any)} 
                      rows={1} 
                      className="p-0 font-sans text-foreground antialiased flex-grow bg-transparent border-0 shadow-none focus-visible:ring-0 rounded-none resize-none overflow-hidden min-h-[24px]"
                      style={{ fontSize: '0.75rem', lineHeight: '1.25' }} />
                  </div>
                 </>
              ) : (
                 <>
                  <div className="flex items-center h-6 mb-1"> 
                    <span className="w-16 shrink-0 text-muted-foreground font-semibold font-sans text-xs leading-tight antialiased">Name</span> 
                    <span className="text-xs font-sans text-foreground antialiased flex-grow truncate" style={{ lineHeight: '1.25' }}>{customer.name}</span>
                  </div>
                  <div className="flex items-center h-6 mb-1"> 
                    <span className="w-16 shrink-0 text-muted-foreground font-semibold font-sans text-xs leading-tight antialiased">Email</span> 
                    <span className="text-xs font-sans text-foreground antialiased flex-grow truncate" style={{ lineHeight: '1.25' }}>{customer.email || <span className="text-muted-foreground italic">N/A</span>}</span>
                  </div>
                  <div className="flex items-center h-6 mb-1"> 
                    <span className="w-16 shrink-0 text-muted-foreground font-semibold font-sans text-xs leading-tight antialiased">Phone</span> 
                    <span className="text-xs font-sans text-foreground antialiased flex-grow truncate" style={{ lineHeight: '1.25' }}>{customer.phone || <span className="text-muted-foreground italic">N/A</span>}</span>
                  </div>
                  <div className="flex items-start h-auto mb-0"> 
                    <span className="w-16 shrink-0 text-muted-foreground font-semibold font-sans text-xs leading-tight antialiased pt-px">Address</span>
                    <span className="text-xs font-sans text-foreground antialiased flex-grow break-words whitespace-normal min-h-[24px]" style={{ lineHeight: '1.25' }}>{customer.address || <span className="text-muted-foreground italic">N/A</span>}</span>
                  </div>
                 </>
              )}
            </div>
          </section>

          {/* Quote Dropdown Section */}
          <section className="/*px-4*/">
            <Label className="text-xs text-muted-foreground block mb-1">Current Quote</Label>
            <DropdownMenu 
              open={isQuoteDropdownOpen} 
              onOpenChange={(open) => {
                  // Only allow manual opening if a quote is selected
                  if (currentQuote) {
                      setIsQuoteDropdownOpen(open);
                  }
              }}
              modal={false}
            >
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full h-8 text-sm justify-between font-regular" 
                  onClick={(e) => {
                      if (!currentQuote) {
                          e.preventDefault(); // Stop dropdown opening
                          handleAddNewQuote(); // Call add directly
                      }
                      // Otherwise, let default trigger behavior happen (opens dropdown)
                  }}
                >
                  <span>
                    {currentQuote ? (
                      <>
                        {baseQuoteNumber} / {currentQuote.sequenceNumber}
                        {currentQuote.name !== currentQuote.sequenceNumber.toString() && ` - ${currentQuote.name}`}
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
                  // Prevent closing if clicking inside while renaming/confirming
                  onCloseAutoFocus={(e) => {
                      if (editingQuoteId || confirmingDeleteQuoteId) {
                          e.preventDefault();
                      }
                  }}
                >
                  {customerQuotes.length > 0 ? (
                    customerQuotes
                      .sort((a, b) => a.sequenceNumber - b.sequenceNumber)
                      .map((q) => (
                        <div 
                          key={q.id} 
                          onClick={() => {
                            if (editingQuoteId !== q.id && confirmingDeleteQuoteId !== q.id) {
                                onQuoteSelect(q.id); 
                                setIsQuoteDropdownOpen(false);
                            }
                          }}
                          className={`group flex justify-between items-center text-xs px-2 py-2 cursor-pointer rounded-sm outline-none focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground ${q.id === currentQuote?.id ? 'bg-accent' : ''} ${editingQuoteId === q.id ? 'bg-muted' : ''} ${confirmingDeleteQuoteId === q.id ? 'bg-destructive/10' : ''}`}
                        >
                          <div className="flex-grow flex items-center gap-2 mr-2 overflow-hidden min-w-0">
                            {editingQuoteId === q.id ? (
                              <div className="flex-grow flex items-center gap-1">
                                <Input
                                  ref={quoteInputRef}
                                  type="text"
                                  value={editingQuoteName}
                                  onChange={handleQuoteNameInputChange}
                                  onKeyDown={handleQuoteRenameKeyDown}
                                  onBlur={handleFinishRenameQuote}
                                  onClick={(e) => e.stopPropagation()}
                                  className="h-6 text-xs flex-grow"
                                />
                                <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0" onClick={(e) => { e.stopPropagation(); handleFinishRenameQuote(); }} title="Save Name"><Check className="h-3 w-3 text-primary" /></Button>
                                <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0" onClick={(e) => { e.stopPropagation(); handleCancelRenameQuote(); }} title="Cancel Rename"><CancelIcon className="h-3 w-3" /></Button>
                              </div>
                            ) : (
                              <span
                                className="flex-grow truncate cursor-default"
                                title={(typeof q.sequenceNumber === 'number' && q.name === q.sequenceNumber.toString()) 
                                  ? `${baseQuoteNumber} / ${q.sequenceNumber}` 
                                  : `${baseQuoteNumber} / ${q.sequenceNumber ?? 'N/A'} - ${q.name} (${q.status})`}
                              >
                                {baseQuoteNumber} / {q.sequenceNumber ?? 'N/A'} {/* Display N/A if missing */}
                                {(typeof q.sequenceNumber === 'number' && q.name !== q.sequenceNumber.toString()) && ` - ${q.name}`}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center shrink-0">
                            {confirmingDeleteQuoteId === q.id ? (
                              <div className="flex items-center">
                                <Button variant="destructive" size="sm" className="h-6 text-xs px-2 mr-1" onClick={(e) => { e.stopPropagation(); handleDeleteQuoteClick(q.id); }} title="Confirm Delete">Confirm?</Button>
                                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => { e.stopPropagation(); setConfirmingDeleteQuoteId(null); }} title="Cancel Delete"><CancelIcon className="h-3 w-3"/></Button>
                              </div>
                            ) : editingQuoteId === q.id ? (
                                null
                            ) : (
                              <div className={`flex items-center opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity`}>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={(e) => { e.stopPropagation(); handleStartRenameQuote(q); }} title={`Rename Quote ${q.sequenceNumber}`} disabled={editingQuoteId !== null || confirmingDeleteQuoteId !== null}><Pencil className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={(e) => { e.stopPropagation(); handleDuplicateQuoteClick(q.id); }} title={`Duplicate Quote ${q.sequenceNumber}`} disabled={editingQuoteId !== null || confirmingDeleteQuoteId !== null}><Copy className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); setConfirmingDeleteQuoteId(q.id); }} title={`Delete Quote ${q.sequenceNumber}`} disabled={editingQuoteId !== null || confirmingDeleteQuoteId !== null}><Trash2 className="h-4 w-4" /></Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                  ) : (
                    <DropdownMenuItem disabled className="text-xs text-muted-foreground italic justify-center">No quotes for this customer.</DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="my-1" />
                  <DropdownMenuItem 
                    onSelect={(e) => { e.preventDefault(); handleAddNewQuote(); }}
                    className="text-xs text-muted-foreground italic cursor-pointer flex items-center"
                  >
                     <PlusCircle className="h-4 w-4 mr-2" /> Add New Quote...
                  </DropdownMenuItem>
                  {customerQuotes.length > 1 && (
                      <>
                        <DropdownMenuSeparator className="my-1" />
                        <DropdownMenuItem 
                          onSelect={confirmingDeleteAllQuotes ? handleConfirmDeleteAll : handleInitiateDeleteAll}
                          className="text-xs text-destructive focus:bg-destructive focus:text-destructive-foreground cursor-pointer flex items-center"
                        >
                          <Trash className="h-4 w-4 mr-2" /> 
                          {confirmingDeleteAllQuotes ? "Confirm Delete All?" : "Delete All Quotes..."}
                        </DropdownMenuItem>
                      </>
                  )}
                </DropdownMenuContent>
              </DropdownMenuPortal>
            </DropdownMenu>
          </section>

          {/* Tier Dropdown Section */}
          <section className="/*px-4*/">
             <Label className="text-xs text-muted-foreground block mb-1">Selected Tier</Label>
             <DropdownMenu 
                open={isTierDropdownOpen} 
                onOpenChange={(open) => {
                    // Prevent closing the dropdown if EITHER popover is open
                    if (!open && isDuplicatePopoverOpen) { 
                      return; // Do nothing, keep dropdown open
                    }
                    // Otherwise, update the dropdown state normally
                    if (currentQuote) {
                      setIsTierDropdownOpen(open);
                      // If we are closing the main dropdown, ensure other states are reset
                      if (!open) {
                        //setIsDeleteConfirmPopoverOpen(false); // This line is removed
                        setTierConfirmDeleteId(null);
                        setEditingTierId(null); // Also cancel renaming
                        // Reset popover state ONLY if dropdown closes naturally
                        setIsDuplicatePopoverOpen(false); 
                        setDuplicatingTierId(null);
                        setConfirmingDeleteAllTiers(false); // Reset delete all confirmation
                      }
                    } 
                }}
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
                      onCloseAutoFocus={(e) => {
                          // Prevent focus-related close if editing/confirming delete, a popover is open, or confirming delete all
                          if (editingTierId || tierConfirmDeleteId || isDuplicatePopoverOpen || confirmingDeleteAllTiers) { // Added confirmingDeleteAllTiers
                              e.preventDefault();
                          }
                      }}
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
                                         <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0" onClick={(e) => { e.stopPropagation(); handleCancelRename(); }} title="Cancel Rename"><CancelIcon className="h-3 w-3" /></Button>
                                     </div>
                                 ) : (
                                     <span className="flex-grow truncate cursor-default" title={tier.name}>{tier.name}</span>
                                 )}
                              </div>
                               <div className="flex items-center shrink-0">
                                   {tierConfirmDeleteId === tier.id ? (
                                       <div className="flex items-center">
                                           <Button variant="destructive" size="sm" className="h-6 text-xs px-2 mr-1" onClick={(e) => { e.stopPropagation(); handleDeleteConfirmClick(tier.id); }} title="Confirm Delete">Confirm?</Button>
                                           <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => { e.stopPropagation(); setTierConfirmDeleteId(null); }} title="Cancel Delete"><CancelIcon className="h-3 w-3"/></Button>
                                       </div>
                                   ) : editingTierId === tier.id ? (
                                       null // No buttons while actively editing name inline
                                   ) : (
                                       <div className={`flex items-center opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity`}>
                                           <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={(e) => { e.stopPropagation(); handleStartRename(tier); }} title={`Rename ${tier.name}`} disabled={editingTierId !== null || tierConfirmDeleteId !== null || isDuplicatePopoverOpen}><Pencil className="h-4 w-4" /></Button>
                                           <Popover 
                                             open={isDuplicatePopoverOpen && duplicatingTierId === tier.id} // Correct condition
                                             onOpenChange={(open) => {
                                                // Only manage popover state. Reset ID only on explicit close.
                                                setIsDuplicatePopoverOpen(open);
                                                if (!open) {
                                                  setDuplicatingTierId(null);
                                                }
                                            }}
                                            >
                                              <PopoverTrigger asChild>
                                                <Button 
                                                  variant="ghost" 
                                                  size="icon" 
                                                  className="h-6 w-6 text-muted-foreground hover:text-foreground" 
                                                  onClick={(e: React.MouseEvent) => { 
                                                    e.stopPropagation(); // Prevent event bubbling
                                                    setDuplicatingTierId(tier.id); // Set the target tier ID
                                                    setIsDuplicatePopoverOpen(true); // Explicitly open the popover
                                                    setDuplicateTargetTierIds([]); // Reset duplication state defined at top level
                                                    setDuplicateNewTierCount(1); // Reset duplication state defined at top level
                                                  }} 
                                                  title={`Duplicate ${tier.name}`} 
                                                  disabled={isProcessingAction || editingTierId !== null || tierConfirmDeleteId !== null}
                                                >
                                                  <Copy className="h-4 w-4" />
                                                </Button>
                                              </PopoverTrigger>
                                              <PopoverContent 
                                                className="w-64 p-2" 
                                                side="right" 
                                                align="start" 
                                                // Prevent closing dropdown when interacting outside popover
                                                onInteractOutside={(e) => {
                                                    // Allow interacting with other dropdown items without closing popover/dropdown
                                                    const target = e.target as HTMLElement;
                                                    if (target.closest('[role=\"menuitem\"]') || target.closest('[role=\"menu\"]')) {
                                                        e.preventDefault(); 
                                                    } else {
                                                      // Otherwise, close the popover normally
                                                      setIsDuplicatePopoverOpen(false);
                                                      setDuplicatingTierId(null);
                                                    }
                                                }}
                                               >
                                                  <div className="space-y-2 text-xs">
                                                      <div className="font-semibold text-center mb-2 border-b pb-1">Duplicate '{duplicatingTierId ? getTierName(duplicatingTierId) : ''}</div>
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
                                                        onClick={(e) => { 
                                                          e.stopPropagation(); // Prevent event bubbling
                                                          handleConfirmDuplicate(); // Call the component handler
                                                        }} 
                                                        disabled={duplicateNewTierCount === 0 && duplicateTargetTierIds.length === 0}
                                                      >
                                                        Create Duplicate
                                                      </Button>
                                                  </div>
                                              </PopoverContent>
                                           </Popover>
                                           <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); setTierConfirmDeleteId(tier.id); }} title={`Delete ${tier.name}`} disabled={editingTierId !== null || tierConfirmDeleteId !== null || internalAvailableTiers.length <= 1 || isDuplicatePopoverOpen}><Trash2 className="h-4 w-4" /></Button>
                                       </div>
                                   )}
                               </div>
                           </div>
                       ))}
                       <DropdownMenuSeparator className="my-1" />
                       <DropdownMenuItem 
                         onSelect={(e) => { e.preventDefault(); onAddTier(); /* Dropdown remains open due to preventDefault */ }}
                         className="text-xs text-muted-foreground italic cursor-pointer flex items-center"
                       >
                          <PlusCircle className="h-4 w-4 mr-2" /> Add New Tier...
                       </DropdownMenuItem>
                       {internalAvailableTiers.length > 1 && (
                            <>
                              <DropdownMenuSeparator className="my-1" />
                              <DropdownMenuItem 
                                onSelect={(e) => {
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
            {currentQuote && selectedTierId ? (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleTaskDragEnd}>
                <SortableContext items={reorderableTasks.map(t => t.tempDndId)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-1"> {/* Reduced space slightly */} 
                    {reorderableTasks.length > 0 ? (
                      reorderableTasks.map((task, index) => (
                        <SortableTaskItem
                          key={task.tempDndId} // Use stable ID for key
                          id={task.tempDndId}  // Use stable ID for dnd-kit
                          task={task}
                          index={index}
                          tierId={selectedTierId}
                          onDelete={() => { 
                            if (selectedTierId) { 
                              console.log(`[CurrentQuoteSidebar] onDelete triggered for task index: ${index}, tierId: ${selectedTierId}`);
                              onDeleteTask(index, selectedTierId);
                            } else {
                              console.warn("[CurrentQuoteSidebar] onDelete ignored: No selectedTierId");
                            }
                          }}
                          onEdit={() => handleOpenEditTaskDialog(task, index, selectedTierId)}
                          // === Pass the new quantity update handler ===
                          onUpdateQuantity={(newQuantity) => handleUpdateTaskQuantity(index, selectedTierId, newQuantity)}
                        />
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">No tasks for this tier.</p>
                    )}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">{currentQuote ? "Select a tier to view tasks." : "Select a quote to view tasks."}</p>
            )}
          </section>

          <Separator />

          {/* Pricing Section */}
          <section>
            <h3 className="text-sm font-semibold mb-2 flex items-center"><DollarSign className="h-4 w-4 mr-2" /> Pricing</h3>
            <div className="text-xs space-y-2 bg-muted p-3 rounded-md">
              {currentQuote && selectedTierId ? (
                <>
                  <div className="flex justify-between">
                    <span>Tier:</span><span className="font-semibold">{getTierName(selectedTierId)}</span>
                  </div>
                  <Separator className="my-4" />
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
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={handleCancelEditTotalPrice} title="Cancel" disabled={!currentQuote}><CancelIcon className="h-3 w-3"/></Button>
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
        </div>
      </ScrollArea>

      <div className="p-4 border-t bg-background space-y-2 flex-shrink-0">
        <Button variant="secondary" className="w-full" onClick={onPreviewQuote} disabled={!currentQuote}><Eye className="mr-2 h-4 w-4" /> Preview Quote</Button>
        <DropdownMenu
            onOpenChange={(open: boolean) => {
                if (open && currentQuote) {
                    setIsEditingSendEmail(false); setIsEditingSendSms(false);
                    setTempSendEmail(customer?.email || ""); setTempSendSms(customer?.phone || "");
                    setDisabledEmailSendClicks(0); setDisabledSmsSendClicks(0);
                    setShowEmailSelectWarning(false); setShowSmsSelectWarning(false);
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
                  if (newClickCount > 2) { setShowEmailSelectWarning(true); setTimeout(() => setShowEmailSelectWarning(false), 2500); setDisabledEmailSendClicks(0); }
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
                          if (newClickCount > 2) { setShowEmailSelectWarning(true); setTimeout(() => setShowEmailSelectWarning(false), 2500); setDisabledEmailSendClicks(0); }
                          e.preventDefault(); return;
                        }
                        console.log('Action: Send via Email to (Edited): ', tempSendEmail); setIsEditingSendEmail(false); setQuotesToSendIds([]);
                      } else if (e.key === 'Escape') { setIsEditingSendEmail(false); setTempSendEmail(customer.email || ""); }
                    }} className="h-6 text-xs flex-grow" />
                    <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0" onClick={(e: React.MouseEvent) => { e.stopPropagation(); setIsEditingSendEmail(false); setTempSendEmail(customer.email || ""); }} title="Cancel Edit"><CancelIcon className="h-3 w-3"/></Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center overflow-hidden">
                      <Mail className="mr-2 h-4 w-4 shrink-0" />
                      {/* Remove Tooltip */} 
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
                  if (newClickCount > 2) { setShowSmsSelectWarning(true); setTimeout(() => setShowSmsSelectWarning(false), 2500); setDisabledSmsSendClicks(0); }
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
                          if (newClickCount > 2) { setShowSmsSelectWarning(true); setTimeout(() => setShowSmsSelectWarning(false), 2500); setDisabledSmsSendClicks(0); }
                          e.preventDefault(); return;
                        }
                        console.log('Action: Send via SMS to (Edited): ', tempSendSms); setIsEditingSendSms(false); setQuotesToSendIds([]);
                      } else if (e.key === 'Escape') { setIsEditingSendSms(false); setTempSendSms(customer.phone || ""); }
                    }} className="h-6 text-xs flex-grow" />
                    <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0" onClick={(e: React.MouseEvent) => { e.stopPropagation(); setIsEditingSendSms(false); setTempSendSms(customer.phone || ""); }} title="Cancel Edit"><CancelIcon className="h-3 w-3"/></Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center overflow-hidden">
                      <Smartphone className="mr-2 h-4 w-4 shrink-0" />
                      {/* Remove Tooltip */} 
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

      {isEditDialogOpen && editingTaskDetails && (
        <EditTaskDialog
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          taskDetails={editingTaskDetails}
          onUpdateTask={onUpdateTask}
        />
      )}
      {isEditAllTasksDialogOpen && currentQuote && selectedTierId && (
        <EditAllTasksDialog
          isOpen={isEditAllTasksDialogOpen}
          onOpenChange={setIsEditAllTasksDialogOpen}
          tierId={editingAllTasksTierId}
          tierName={getTierName(editingAllTasksTierId || undefined)}
          tasks={reorderableTasks}
          onUpdateAllTasks={(updatedTasks: QuoteTask[]) => { // Add type
            if(editingAllTasksTierId) onUpdateAllTasks(editingAllTasksTierId, updatedTasks);
         }}
        />
      )}
    </div>
  );
} 