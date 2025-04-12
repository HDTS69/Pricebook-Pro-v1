import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Star,
  Wrench,
  Droplet,
  Toilet,
  CircleDot,
  Plug,
  Wind,
  Flame,
  Home,
  ChevronLeft,
  ChevronRight,
  Menu,
  Search,
  ClipboardPlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CategoryView } from '@/components/pricebook/CategoryView';
import { DashboardMenu } from '@/components/layout/DashboardMenu';
import { services, Service } from '@/lib/services';
import { arrayMove } from '@dnd-kit/sortable';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip';

// --- NEW IMPORTS ---
import { CurrentQuoteSidebar } from '@/components/pricebook/CurrentQuoteSidebar';
import { PageHeaderActions } from '@/components/layout/PageHeaderActions';
import { Quote, Customer, Tier, QuoteTask, Addon } from '@/types/quote';
import { v4 as uuidv4 } from 'uuid';

// --- Define Default Tier Constant ---
const DEFAULT_TIER: Tier = {
  id: 'tier-bronze',
  name: 'Bronze',
  multiplier: 1.0,
  warranty: "Standard",
  perks: [],
};

// --- Mock Data (Replace with actual data fetching/management later) ---
const mockCustomers: Customer[] = [
  {
    id: 'cust-1',
    name: 'John Doe Plumbing Co.',
    email: 'john.doe@example.com',
    phone: '0412 345 678',
    address: '123 Example St, Sydney NSW 2000',
  },
  {
    id: 'cust-2',
    name: 'Jane Smith Renovations',
    email: 'jane@example.com',
    phone: '0423 456 789',
    address: '456 Another Ave, Melbourne VIC 3000',
  },
  {
    id: 'cust-3',
    name: 'Coastal Electrics Pty Ltd',
    email: 'support@coastalelectrics.com.au',
    phone: '07 5555 1234',
    address: '789 Beach Rd, Gold Coast QLD 4217',
  },
];

const mockAvailableTiers: Tier[] = [
  { id: 'tier-bronze', name: 'Bronze', multiplier: 1.0, warranty: "Std", perks: [] },
  { id: 'tier-silver', name: 'Silver', multiplier: 1.2, warranty: "1 Year", perks: ["Priority Booking"] },
  { id: 'tier-gold', name: 'Gold', multiplier: 1.5, warranty: "2 Years", perks: ["Priority Booking", "Free Checkup"] },
];

// Define a function to get initial quotes for a customer (simulates fetching)
const getInitialQuotesForCustomer = (customerId: string): Quote[] => {
  if (customerId === 'cust-1') {
    return [
      {
        id: 'quote-initial-1',
        quoteNumber: 'Q-1001',
        sequenceNumber: 1,
        name: "1",
        customerId: 'cust-1',
        status: 'Draft',
        tierTasks: { 'tier-bronze': [], 'tier-silver': [], 'tier-gold': [] },
        selectedTierId: 'tier-gold',
        adjustments: [],
        totalPrice: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];
  } else if (customerId === 'cust-2') {
     return [
      {
        id: 'quote-jane-1',
        quoteNumber: 'Q-1002',
        sequenceNumber: 1,
        name: "Initial Reno Consult",
        customerId: 'cust-2',
        status: 'Sent',
        tierTasks: { 
          'tier-bronze': [{
            taskId: 'task-consult', 
            name: 'Consultation', 
            description: 'Initial consultation',
            basePrice: 150, 
            addons: []
          }], 
          'tier-silver': [], 
          'tier-gold': [] 
        },
        selectedTierId: 'tier-bronze',
        adjustments: [],
        totalPrice: 150,
        createdAt: new Date(Date.now() - 86400000*2).toISOString(), 
        updatedAt: new Date(Date.now() - 86400000*2).toISOString(),
        sentAt: new Date(Date.now() - 86400000).toISOString(), 
      }
    ];
  }
  return []; // Default to no quotes for other customers
};
// --- End Mock Data ---

// Define a list of potential color names for new tiers
const TIER_COLORS: string[] = [
  "Red", "Blue", "Green", "Yellow", "Purple", "Orange", 
  "Pink", "Cyan", "Magenta", "Lime", "Teal", "Indigo", 
  "Maroon", "Navy", "Olive" 
  // Add more colors as needed
];

interface ServiceCategory {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  description: string;
}

const serviceCategories: ServiceCategory[] = [
  {
    id: 'favourites',
    name: 'Favourites',
    icon: Star,
    color: 'text-yellow-500',
    description: 'Your most used services and tasks',
  },
  {
    id: 'service',
    name: 'Service',
    icon: Wrench,
    color: 'text-blue-500',
    description: 'General service and maintenance tasks',
  },
  {
    id: 'hot-water',
    name: 'Hot Water',
    icon: Droplet,
    color: 'text-red-500',
    description: 'Hot water system repairs and installations',
  },
  {
    id: 'plumbing',
    name: 'Plumbing',
    icon: Toilet,
    color: 'text-indigo-500',
    description: 'General plumbing repairs and installations',
  },
  {
    id: 'drains',
    name: 'Drains',
    icon: CircleDot,
    color: 'text-green-500',
    description: 'Drain cleaning and repairs',
  },
  {
    id: 'air-conditioning',
    name: 'Air Conditioning',
    icon: Wind,
    color: 'text-sky-500',
    description: 'AC installation, service, and repairs',
  },
  {
    id: 'gas',
    name: 'Gas',
    icon: Flame,
    color: 'text-orange-500',
    description: 'Gas fitting and appliance installation',
  },
  {
    id: 'roofing',
    name: 'Roofing & Rainwater',
    icon: Home,
    color: 'text-slate-500',
    description: 'Roof repairs and rainwater solutions',
  },
  {
    id: 'electrical',
    name: 'Electrical',
    icon: Plug,
    color: 'text-purple-500',
    description: 'Electrical repairs and installations',
  },
];

// --- Add Custom Task Dialog Component ---
interface AddCustomTaskDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  availableTiers: Tier[];
  currentQuoteSelectedTierId: string | null; // Pass the tier selected in the main UI as default
  onAddCustomTask: (newTask: QuoteTask, tierId: string) => void;
}

function AddCustomTaskDialog({ 
  isOpen, 
  onOpenChange, 
  availableTiers, 
  currentQuoteSelectedTierId,
  onAddCustomTask 
}: AddCustomTaskDialogProps) {
  const [taskName, setTaskName] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskPrice, setTaskPrice] = useState("");
  const [selectedTierId, setSelectedTierId] = useState<string>("");

  // Set default tier selection when dialog opens or available tiers/default changes
  useEffect(() => {
    if (isOpen) {
        if (currentQuoteSelectedTierId && availableTiers.some(t => t.id === currentQuoteSelectedTierId)) {
            setSelectedTierId(currentQuoteSelectedTierId);
        } else if (availableTiers.length > 0) {
            setSelectedTierId(availableTiers[0].id); // Fallback to first available tier
        } else {
            setSelectedTierId(""); // No tiers available
        }
    } else {
        // Reset form when closing
        setTaskName("");
        setTaskDesc("");
        setTaskPrice("");
        setSelectedTierId("");
    }
  }, [isOpen, availableTiers, currentQuoteSelectedTierId]);

  const handleSave = () => {
    const priceValue = parseFloat(taskPrice);
    if (!taskName.trim() || isNaN(priceValue) || !selectedTierId) {
      console.error("Invalid custom task input.");
      // TODO: Better validation feedback
      return;
    }

    const newTask: QuoteTask = {
      taskId: `custom-${uuidv4()}`,
      name: taskName.trim(),
      description: taskDesc.trim(),
      basePrice: priceValue,
      addons: [],
    };

    onAddCustomTask(newTask, selectedTierId);
    onOpenChange(false);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Custom Task</DialogTitle>
          <DialogDescription>Enter the details for the custom task and select the target tier.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Name, Description, Price inputs similar to EditServiceDialog */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="custom-task-name" className="text-right">Name*</Label>
            <Input id="custom-task-name" value={taskName} onChange={(e) => setTaskName(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="custom-task-desc" className="text-right pt-2">Description</Label>
            <Textarea id="custom-task-desc" value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} className="col-span-3" rows={3} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="custom-task-price" className="text-right">Price*</Label>
            <Input id="custom-task-price" type="number" value={taskPrice} onChange={(e) => setTaskPrice(e.target.value)} className="col-span-3" step="0.01" />
          </div>
           {/* Target Tier Dropdown */}
          <div className="grid grid-cols-4 items-center gap-4">
             <Label htmlFor="custom-task-tier" className="text-right">Target Tier*</Label>
             <Select 
               value={selectedTierId} 
               onValueChange={setSelectedTierId} 
               disabled={availableTiers.length === 0}
             >
               <SelectTrigger className="col-span-3">
                 <SelectValue placeholder="Select a tier..." />
               </SelectTrigger>
               <SelectContent>
                 {availableTiers.map(tier => (
                   <SelectItem key={tier.id} value={tier.id}>{tier.name}</SelectItem>
                 ))}
                 {availableTiers.length === 0 && <SelectItem value="" disabled>No tiers available</SelectItem>}
               </SelectContent>
             </Select>
           </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" onClick={handleSave} disabled={!taskName.trim() || !selectedTierId || isNaN(parseFloat(taskPrice))}>
            Add Task to Quote
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
// --- End Add Custom Task Dialog ---

// Utility function (can be defined inside or outside component)
function recalculateQuoteTotalForSelectedTier(quote: Quote): number {
    if (!quote || !quote.selectedTierId || !quote.tierTasks[quote.selectedTierId]) {
      return 0;
    }
    const tasks = quote.tierTasks[quote.selectedTierId];
    return tasks.reduce((sum, task) => {
      const quantity = task.quantity ?? 1;
      const taskAddonTotal = task.addons?.reduce((addonSum: number, addon: Addon) => addonSum + addon.price, 0) ?? 0;
      const taskTotal = (task.basePrice + taskAddonTotal) * quantity;
      return sum + taskTotal;
    }, 0);
}

export function PricebookPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mainMenuOpen, setMainMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isHovering, setIsHovering] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    categories: typeof serviceCategories;
    services: typeof services;
  }>({
    categories: serviceCategories,
    services: [],
  });

  // --- NEW STATE ---
  const [isQuoteSidebarVisible, setIsQuoteSidebarVisible] = useState(true);
  const [allCustomers, setAllCustomers] = useState<Customer[]>(mockCustomers);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(allCustomers[0] || null);
  const [customerQuotes, setCustomerQuotes] = useState<Quote[]>(() => 
    currentCustomer ? getInitialQuotesForCustomer(currentCustomer.id) : []
  );
  const [currentQuoteId, setCurrentQuoteId] = useState<string | null>(null);
  const [availableTiers, setAvailableTiers] = useState<Tier[]>(mockAvailableTiers);
  const [activeBaseQuoteNumber, setActiveBaseQuoteNumber] = useState<string | null>(null);
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [canRedo, setCanRedo] = useState<boolean>(false);
  const [isProcessingAction, setIsProcessingAction] = useState<boolean>(false);
  const [isCustomTaskDialogOpen, setIsCustomTaskDialogOpen] = useState(false);

  // --- CURRENT QUOTE LOGIC ---
  const currentQuote = useMemo(() => {
    if (!currentQuoteId) return null;
    return customerQuotes.find(q => q.id === currentQuoteId) || null;
  }, [currentQuoteId, customerQuotes]);

  // --- NEW HANDLERS ---
  const handleToggleQuoteSidebar = useCallback(() => {
    setIsQuoteSidebarVisible(prev => !prev);
  }, []);

  const handleUndo = useCallback(() => {
    console.log("UNDO action triggered");
  }, []);

  const handleRedo = useCallback(() => {
    console.log("REDO action triggered");
  }, []);

  const handleQuoteSelect = useCallback((quoteId: string) => {
    console.log("Select Quote:", quoteId);
    setCurrentQuoteId(quoteId);
  }, []);

  const handleTierSelect = useCallback((tierId: string) => {
    console.log("Select Tier:", tierId);
    setCustomerQuotes(prevQuotes => 
      prevQuotes.map(q => 
        q.id === currentQuoteId 
          ? { ...q, selectedTierId: tierId, updatedAt: new Date().toISOString() } 
          : q
      )
    );
  }, [currentQuoteId]);

  const handleDeleteTask = useCallback((taskIndex: number, tierId: string) => {
    console.log(`[PricebookPage] handleDeleteTask called: index=${taskIndex}, tierId=${tierId}, currentQuoteId=${currentQuoteId}`);
    if (!currentQuoteId) {
      console.error("[handleDeleteTask] No current quote selected.");
      return;
    }

    setCustomerQuotes(prevQuotes => 
      prevQuotes.map(quote => {
        if (quote.id === currentQuoteId) {
          console.log(`[handleDeleteTask] Found matching quote: ${quote.id}`);
          // Ensure the tier exists in the quote
          if (!quote.tierTasks || !(tierId in quote.tierTasks)) {
            console.error(`[handleDeleteTask] Tier ${tierId} not found in quote ${quote.id}`);
            return quote; // Return unchanged quote if tier doesn't exist
          }

          const currentTasks = quote.tierTasks[tierId] || [];
          console.log(`[handleDeleteTask] Tasks before deletion in tier ${tierId}:`, currentTasks);

          // Validate task index
          if (taskIndex < 0 || taskIndex >= currentTasks.length) {
            console.error(`[handleDeleteTask] Invalid task index ${taskIndex} for tier ${tierId} with ${currentTasks.length} tasks.`);
            return quote; // Return unchanged quote if index is invalid
          }

          // Create a new array without the task at the specified index
          const updatedTasks = currentTasks.filter((_, index) => index !== taskIndex);
          console.log(`[handleDeleteTask] Tasks after deletion in tier ${tierId}:`, updatedTasks);
          
          // Create a new tierTasks object with the updated task list for the specific tier
          const updatedTierTasks = {
            ...quote.tierTasks,
            [tierId]: updatedTasks,
          };
          
          // Create the updated quote object
          let updatedQuote = {
            ...quote,
            tierTasks: updatedTierTasks,
            updatedAt: new Date().toISOString(),
          };

          // Recalculate total price *only if* the deleted task was in the currently selected tier
          if (tierId === quote.selectedTierId) {
             console.log(`[handleDeleteTask] Recalculating total price as deleted task was in selected tier ${tierId}`);
             updatedQuote.totalPrice = recalculateQuoteTotalForSelectedTier(updatedQuote);
          } else {
              console.log(`[handleDeleteTask] Not recalculating total price as deleted task was in tier ${tierId}, not selected tier ${quote.selectedTierId}`);
          }

          console.log(`[handleDeleteTask] Final updated quote state for ${quote.id}:`, updatedQuote);
          return updatedQuote;
        }
        return quote; // Return other quotes unchanged
      })
    );
  }, [currentQuoteId]);

  const handleAddTier = useCallback((): void => {
    console.log("Add Tier action triggered");
    setAvailableTiers(prevTiers => {
      const existingNamesLower = prevTiers.map(t => t.name.toLowerCase());
      let newTierName: string | null = null;

      const hasGold = existingNamesLower.includes('gold');
      const hasSilver = existingNamesLower.includes('silver');
      const hasBronze = existingNamesLower.includes('bronze');

      // Prioritize standard tiers in order: Gold -> Silver -> Bronze
      if (!hasGold) {
        newTierName = "Gold";
      } else if (!hasSilver) { // Gold must exist if we reach here
        newTierName = "Silver";
      } else if (!hasBronze) { // Gold and Silver must exist
        newTierName = "Bronze";
      } else {
        // If standard tiers exist, use colors
        for (const color of TIER_COLORS) { // Assumes TIER_COLORS is defined outside
          const colorLower = color.toLowerCase();
          if (!existingNamesLower.includes(colorLower)) {
            newTierName = color; // Use the original casing (e.g., "Red")
            break;
          }
        }
        // Fallback if all colors are used
        if (!newTierName) {
          let counter = 1;
          do {
            newTierName = `Custom Tier ${counter}`;
            counter++;
          } while (existingNamesLower.includes(newTierName.toLowerCase()));
        }
      }

      const newTier: Tier = {
        id: `tier-${uuidv4()}`, // Make sure uuidv4 is imported
        name: newTierName,
        // Sensible defaults
        multiplier: 1.0,
        warranty: "Standard",
        perks: [],
      };

      console.log("Adding new tier:", newTier);
      return [...prevTiers, newTier]; // Add to end of list
    });
  }, []);

  const handleDeleteTier = useCallback((tierIdToDelete: string, index: number) => {
    console.log("Delete Tier:", tierIdToDelete, "at index:", index);
    setAvailableTiers(prevTiers => prevTiers.filter(t => t.id !== tierIdToDelete));
    setCustomerQuotes(prevQuotes => 
      prevQuotes.map(q => {
        if (q.tierTasks[tierIdToDelete]) {
          const { [tierIdToDelete]: _, ...remainingTierTasks } = q.tierTasks;
          let newSelectedTierId = q.selectedTierId;
          if (q.selectedTierId === tierIdToDelete) {
            newSelectedTierId = Object.keys(remainingTierTasks)[0] || null;
          }
          return { ...q, tierTasks: remainingTierTasks, selectedTierId: newSelectedTierId };
        } 
        return q;
      })
    );
  }, []);

  const handleRenameTier = useCallback((tierIdToRename: string, newName: string) => {
    console.log("Rename Tier:", tierIdToRename, "to:", newName);
    setAvailableTiers(prevTiers => 
      prevTiers.map(t => t.id === tierIdToRename ? { ...t, name: newName } : t)
    );
  }, []);

  const handlePreviewQuote = useCallback(() => console.log("Preview Quote"), []);
  const handleUpdateCustomer = useCallback((updatedCustomer: Customer) => {
    console.log("Update Customer:", updatedCustomer);
    setCurrentCustomer(updatedCustomer);
  }, []);

  const handleCustomerSelect = useCallback((customerId: string) => {
    console.log("Selecting Customer:", customerId);
    const selectedCustomer = allCustomers.find(c => c.id === customerId);
    if (selectedCustomer) {
      setCurrentCustomer(selectedCustomer);
    } else {
      console.warn("Selected customer not found:", customerId);
      setCurrentCustomer(null);
    }
  }, [allCustomers]);

  const handleAddQuote = useCallback((nextSequenceNumber: number) => {
    if (!currentCustomer) {
      console.error("Cannot add quote without a current customer.");
      return;
    }

    // Use the stored activeBaseQuoteNumber state
    const baseQuoteNumberToUse = activeBaseQuoteNumber;

    if (!baseQuoteNumberToUse) {
      console.error(`Cannot add quote: No active base quote number found for customer ${currentCustomer.id}.`);
      // Optionally generate a fallback, but ideally the state should be set correctly.
      // baseQuoteNumberToUse = `Q-${Date.now().toString().slice(-6)}`; 
      return; // Prevent adding quote if base number is missing
    }

    const newQuote: Quote = {
      id: `quote-${uuidv4()}`,
      quoteNumber: baseQuoteNumberToUse, // Use the state variable
      sequenceNumber: nextSequenceNumber, 
      name: `${nextSequenceNumber}`, 
      customerId: currentCustomer.id,
      status: "Draft",
      tierTasks: availableTiers.reduce((acc, tier) => {
        acc[tier.id] = [];
        return acc;
      }, {} as { [key: string]: QuoteTask[] }), 
      selectedTierId: DEFAULT_TIER.id, 
      adjustments: [],
      totalPrice: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    console.log("Creating new quote:", newQuote);
    setCustomerQuotes(prev => [...prev, newQuote]);
    setCurrentQuoteId(newQuote.id);
    
  // Depend on activeBaseQuoteNumber now
  }, [currentCustomer, activeBaseQuoteNumber, availableTiers]); 

  const handleDeleteQuote = useCallback((quoteIdToDelete: string) => {
    console.log("Delete Quote:", quoteIdToDelete);
    setCustomerQuotes(prevQuotes => prevQuotes.filter(q => q.id !== quoteIdToDelete));
    if (currentQuoteId === quoteIdToDelete) {
      setCurrentQuoteId(prevId => {
        const remainingQuotes = customerQuotes.filter(q => q.id !== quoteIdToDelete);
        return remainingQuotes.length > 0 ? remainingQuotes[0].id : null;
      });
    }
  }, [currentQuoteId, customerQuotes]);

  const handleRenameQuote = useCallback((quoteIdToRename: string, newName: string) => {
    console.log("Rename Quote:", quoteIdToRename, "to:", newName);
    setCustomerQuotes(prevQuotes => 
      prevQuotes.map(q => q.id === quoteIdToRename ? { ...q, name: newName } : q)
    );
  }, []);

  const handleUpdateTaskPrice = useCallback((taskIndex: number, tierId: string, newPrice: number) => {
    console.log("Update Task Price:", taskIndex, "in Tier:", tierId, "to:", newPrice);
    setCustomerQuotes(prevQuotes => 
      prevQuotes.map(q => {
        if (q.id === currentQuoteId && q.tierTasks[tierId]) {
          const updatedTasks = [...q.tierTasks[tierId]];
          if (updatedTasks[taskIndex]) {
            updatedTasks[taskIndex] = { ...updatedTasks[taskIndex], basePrice: newPrice };
          }
          const newTotalPrice = updatedTasks.reduce((sum: number, task: QuoteTask) => sum + task.basePrice + (task.addons?.reduce((aSum: number, a: Addon) => aSum + a.price, 0) ?? 0), 0);
          return { ...q, tierTasks: { ...q.tierTasks, [tierId]: updatedTasks }, totalPrice: newTotalPrice, updatedAt: new Date().toISOString() };
        }
        return q;
      })
    );
  }, [currentQuoteId]);

  const handleUpdateTask = useCallback((taskIndex: number, tierId: string, updatedTask: QuoteTask) => {
    console.log(`[handleUpdateTask] Updating task index ${taskIndex} in tier ${tierId}`, updatedTask);
    setCustomerQuotes(prevQuotes =>
      prevQuotes.map(quote => {
        if (quote.id === currentQuoteId && quote.tierTasks[tierId]) {
          const updatedTierTasks = [...quote.tierTasks[tierId]];
          if (taskIndex >= 0 && taskIndex < updatedTierTasks.length) {
            updatedTierTasks[taskIndex] = updatedTask;
            const updatedQuote = {
              ...quote,
              tierTasks: { ...quote.tierTasks, [tierId]: updatedTierTasks },
              updatedAt: new Date().toISOString(),
            };
            // Recalculate total ONLY if the updated tier is the currently selected one
            if (tierId === updatedQuote.selectedTierId) {
                updatedQuote.totalPrice = recalculateQuoteTotalForSelectedTier(updatedQuote);
            }
            console.log(` -> Task updated, new total for quote ${quote.id} (if selected tier): ${updatedQuote.totalPrice}`);
            return updatedQuote;
          } else {
             console.warn(`[handleUpdateTask] Invalid taskIndex ${taskIndex} for tier ${tierId}`);
          }
        }
        return quote;
      })
    );
  }, [currentQuoteId]);

  const handleApplyPercentageAdjustment = useCallback((percentage: number) => console.log("Apply Percentage Adjustment:", percentage), []);
  const handleUpdateAllTasks = useCallback((tierId: string, updatedTasks: QuoteTask[]) => {
      console.log(`[handleUpdateAllTasks] Updating all tasks for tier ${tierId}`, updatedTasks);
      setCustomerQuotes(prevQuotes => 
          prevQuotes.map(quote => {
              if (quote.id === currentQuoteId) {
                  const updatedQuote = {
                      ...quote,
                      tierTasks: { ...quote.tierTasks, [tierId]: updatedTasks },
                      updatedAt: new Date().toISOString(),
                  };
                  // Recalculate total ONLY if the updated tier is the currently selected one
                  if (tierId === updatedQuote.selectedTierId) {
                      updatedQuote.totalPrice = recalculateQuoteTotalForSelectedTier(updatedQuote);
                      console.log(` -> All tasks updated, new total for quote ${quote.id}: ${updatedQuote.totalPrice}`);
                  } else {
                      console.log(` -> All tasks updated for tier ${tierId}, but it's not the selected tier (${updatedQuote.selectedTierId}). Total remains ${updatedQuote.totalPrice}.`);
                  }
                  return updatedQuote;
              }
              return quote;
          })
      );
  }, [currentQuoteId]);

  const handleReorderTasks = useCallback((tierId: string, oldIndex: number, newIndex: number) => {
    console.log("Reorder Tasks in Tier:", tierId, "from", oldIndex, "to", newIndex);
    setCustomerQuotes(prevQuotes => 
      prevQuotes.map(q => {
        if (q.id === currentQuoteId && q.tierTasks[tierId]) {
           const currentTasks = q.tierTasks[tierId];
           const reorderedTasks = arrayMove(currentTasks, oldIndex, newIndex);
           return { ...q, tierTasks: { ...q.tierTasks, [tierId]: reorderedTasks }, updatedAt: new Date().toISOString() };
        }
        return q;
      })
    );
  }, [currentQuoteId]);

  const handleDuplicateTier = useCallback((sourceTierId: string, destinationTierId: string | null, newTierName?: string) => {
    console.log("Duplicate Tier:", sourceTierId, "to", destinationTierId || "New Tier:", newTierName);
    const sourceTier = availableTiers.find(t => t.id === sourceTierId);
    if (!sourceTier) return;

    if (destinationTierId) {
      setCustomerQuotes(prevQuotes => 
        prevQuotes.map(q => {
          if (q.tierTasks[sourceTierId]) {
            const sourceTasks = q.tierTasks[sourceTierId];
            return { ...q, tierTasks: { ...q.tierTasks, [destinationTierId]: sourceTasks }, updatedAt: new Date().toISOString() };
          }
          return q;
        })
      );
    } else {
      const newTierId = `tier-${Date.now()}`;
      const newTier: Tier = {
        ...sourceTier,
        id: newTierId,
        name: newTierName || `${sourceTier.name} Copy`,
      };
      setAvailableTiers(prevTiers => [...prevTiers, newTier]);
      setCustomerQuotes(prevQuotes => 
        prevQuotes.map(q => {
          if (q.tierTasks[sourceTierId]) {
            const sourceTasks = q.tierTasks[sourceTierId];
            return { ...q, tierTasks: { ...q.tierTasks, [newTierId]: sourceTasks }, updatedAt: new Date().toISOString() };
          }
          return q;
        })
      );
    }
  }, [availableTiers]);

  const handleClearAllTasks = useCallback((tierId: string) => {
    console.log("Clear All Tasks for Tier:", tierId);
    setCustomerQuotes(prevQuotes => 
      prevQuotes.map(q => {
        if (q.id === currentQuoteId && q.tierTasks[tierId]) {
           const newTotalPrice = 0;
           return { ...q, tierTasks: { ...q.tierTasks, [tierId]: [] }, totalPrice: newTotalPrice, updatedAt: new Date().toISOString() };
        }
        return q;
      })
    );
  }, [currentQuoteId]);

  const handleDeleteAllQuotes = useCallback((customerId: string) => {
    console.log(`Deleting all quotes for customer: ${customerId}`);
    setCustomerQuotes(prev => prev.filter(q => q.customerId !== customerId));
    if (currentCustomer?.id === customerId) {
      setCurrentQuoteId(null);
    }
  }, [currentCustomer?.id]);

  const handleDuplicateQuote = useCallback((quoteIdToDuplicate: string): void => {
    console.log('Parent: Duplicating quote', quoteIdToDuplicate);
    setCustomerQuotes(prevQuotes => {
      const originalQuote = prevQuotes.find(q => q.id === quoteIdToDuplicate);
      if (!originalQuote) { console.error("Quote to duplicate not found:", quoteIdToDuplicate); return prevQuotes; }
      const relatedQuotes = prevQuotes.filter(q => q.quoteNumber === originalQuote.quoteNumber);
      const maxSequence = Math.max(0, ...relatedQuotes.map(q => q.sequenceNumber));
      const nextSequence = maxSequence + 1;
      const newQuote: Quote = {
        ...originalQuote, id: `quote-${uuidv4()}`, sequenceNumber: nextSequence,
        name: `${originalQuote.name || originalQuote.sequenceNumber} (Copy)`, status: 'Draft',
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        sentAt: undefined, acceptedAt: undefined,
        tierTasks: JSON.parse(JSON.stringify(originalQuote.tierTasks)),
        adjustments: JSON.parse(JSON.stringify(originalQuote.adjustments)),
        selectedTierId: originalQuote.selectedTierId,
        totalPrice: originalQuote.totalPrice,
      };
      const updatedQuotes = [...prevQuotes, newQuote];
      setCurrentQuoteId(newQuote.id); // Select the new quote
      return updatedQuotes;
    });
  }, []);

  const handleDeleteAllTiers = useCallback(() => {
    console.log("Deleting ALL tiers...");
    setAvailableTiers([]); // Clear available tiers
    const defaultTierIds: string[] = []; // No tiers left
    setCustomerQuotes(prevQuotes =>
      prevQuotes.map(q => {
        const newTierTasks = {}; // All tier tasks removed
        const newSelectedTierId = null;
        const newTotalPrice = 0;
        return { ...q, tierTasks: newTierTasks, selectedTierId: newSelectedTierId, totalPrice: newTotalPrice, updatedAt: new Date().toISOString() };
      })
    );
  }, []);

  const handleAddOrIncrementTask = useCallback((serviceData: Service, tierId: string, wasModified: boolean) => {
    console.log(`[handleAddOrIncrementTask] Called. Modified: ${wasModified}, Tier: ${tierId}, Service:`, serviceData);
    if (!currentQuoteId) { console.error("Error: No current quote selected."); return; }

    setCustomerQuotes(prevQuotes =>
      prevQuotes.map(quote => {
        if (quote.id === currentQuoteId) {
          if (!(tierId in quote.tierTasks)) {
            console.warn(`Target tier ${tierId} does not exist in quote ${quote.id}. Skipping.`);
            return quote;
          }

          const updatedQuote = JSON.parse(JSON.stringify(quote)); // Deep copy needed for modification
          let taskAddedOrIncremented = false;

          // Check for existing task *only* if the service was NOT modified
          let existingTaskIndex = -1;
          if (!wasModified) {
              existingTaskIndex = updatedQuote.tierTasks[tierId].findIndex(
                  (task: QuoteTask) => task.originalServiceId === serviceData.id
              );
          }

          if (existingTaskIndex !== -1) {
            // --- Increment existing task --- 
            const existingTask = updatedQuote.tierTasks[tierId][existingTaskIndex];
            existingTask.quantity = (existingTask.quantity ?? 1) + 1;
            console.log(` -> Incremented quantity for task ${existingTask.name} (original ID: ${serviceData.id}) in tier ${tierId}`);
            taskAddedOrIncremented = true;
          } else {
            // --- Add new task --- 
            const newTask: QuoteTask = {
              taskId: uuidv4(),
              originalServiceId: serviceData.id, // Store link to original service
              name: serviceData.name,
              description: serviceData.description,
              basePrice: serviceData.price,
              quantity: 1, // Always starts at 1
              addons: [],
            };
            updatedQuote.tierTasks[tierId].push(newTask);
            console.log(` -> Added NEW task ${newTask.name} (original ID: ${serviceData.id}) to tier ${tierId}`);
            taskAddedOrIncremented = true;
          }

          // Recalculate total if the tier is selected and something changed
          if (taskAddedOrIncremented && tierId === updatedQuote.selectedTierId) {
            updatedQuote.totalPrice = recalculateQuoteTotalForSelectedTier(updatedQuote);
          }
          updatedQuote.updatedAt = new Date().toISOString();
          return updatedQuote;
        }
        return quote;
      })
    );
  }, [currentQuoteId]);

  const handleQuickAddToQuote = useCallback((serviceId: string) => {
    const selectedTierId = currentQuote?.selectedTierId;
    if (!selectedTierId) { console.error("[Quick Add] No tier selected."); return; }
    const originalService = services.find(s => s.id === serviceId);
    if (!originalService) { console.error(`[Quick Add] Original service ${serviceId} not found.`); return; }
    console.log(`[Quick Add] Triggering add for original service ${serviceId} to tier ${selectedTierId}`);
    // Call core logic, indicating service was NOT modified
    handleAddOrIncrementTask(originalService, selectedTierId, false);
  }, [currentQuote?.selectedTierId, handleAddOrIncrementTask]);

  const handleAddToQuote = useCallback((serviceId: string, tierIds: string[]) => { // Multi-tier add
    console.log(`[Multi-Add] Adding service ${serviceId} to tiers:`, tierIds);
    const originalService = services.find(s => s.id === serviceId);
    if (!originalService) { console.error(`[Multi-Add] Original service ${serviceId} not found.`); return; }
    
    // Call core logic for each selected tier, indicating service was NOT modified
    tierIds.forEach(tierId => {
      handleAddOrIncrementTask(originalService, tierId, false);
    });
  }, [handleAddOrIncrementTask]); // Depends only on the core handler

  const handleAddCustomTask = useCallback((newTask: QuoteTask, tierId: string) => {
    console.log("[handleAddCustomTask] Adding:", newTask, "to Tier:", tierId);
     if (!currentQuoteId) { /* Error handling */ return; }
     // Custom tasks always add as new, don't increment
     setCustomerQuotes(prevQuotes => 
      prevQuotes.map(quote => {
        if (quote.id === currentQuoteId) {
          if (!(tierId in quote.tierTasks)) { /* Warning */ return quote; }
          const updatedQuote = JSON.parse(JSON.stringify(quote));
          updatedQuote.tierTasks[tierId].push(newTask); // Push directly
          updatedQuote.updatedAt = new Date().toISOString();
          if (tierId === updatedQuote.selectedTierId) {
             updatedQuote.totalPrice = recalculateQuoteTotalForSelectedTier(updatedQuote);
          }
          console.log(` -> Added custom task ${newTask.name} to tier ${tierId}`);
          return updatedQuote;
        }
        return quote;
      })
     );
    console.log("[handleAddCustomTask] Finished adding custom task.");
  }, [currentQuoteId]);

  // --- RENDER LOGIC ---
  const selectedCategoryData = useMemo(() => {
    return serviceCategories.find((cat) => cat.id === selectedCategory);
  }, [selectedCategory]);

  // Filter services for the selected category
  const categoryServices = useMemo(() => {
    if (!selectedCategory) return [];
    return services.filter(service => service.categoryId === selectedCategory);
  }, [selectedCategory]);

  // --- EFFECTS (Restore relevant ones) ---
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults({ categories: serviceCategories, services: [] });
      // Don't reset selectedCategory if search is cleared
      // setSelectedCategory(null);
      return;
    }
    const query = searchQuery.toLowerCase();
    const matchedCategories = serviceCategories.filter(cat => cat.name.toLowerCase().includes(query) || cat.description.toLowerCase().includes(query));
    const matchedServices = services.filter(svc => svc.name.toLowerCase().includes(query) || svc.description.toLowerCase().includes(query));
    setSearchResults({ categories: matchedCategories, services: matchedServices });
    setSelectedCategory(null); // Clear category selection when searching
  }, [searchQuery]);

  // Update quotes and selected quote when customer changes
  useEffect(() => {
    if (currentCustomer) {
      const initialQuotes = getInitialQuotesForCustomer(currentCustomer.id); 
      const baseNumber = initialQuotes[0]?.quoteNumber;
      if (baseNumber) { setActiveBaseQuoteNumber(baseNumber); }
       else { const newBase = `Q-${Date.now().toString().slice(-6)}`; setActiveBaseQuoteNumber(newBase); console.warn(`Generated new base number: ${newBase}`); }
      setCustomerQuotes(initialQuotes);
      setCurrentQuoteId(initialQuotes[0]?.id || null);
    } else {
      setCustomerQuotes([]); setCurrentQuoteId(null); setActiveBaseQuoteNumber(null);
    }
  }, [currentCustomer]);

  // RESTORE: Handler for sidebar hover
  const handleSidebarHover = useCallback((hovering: boolean) => { 
    if (!sidebarOpen) setIsHovering(hovering); 
  }, [sidebarOpen]);

  // RESTORE: Handler for category selection
  const handleCategorySelect = useCallback((categoryId: string | null) => { 
    setSelectedCategory(categoryId); 
    setSearchQuery(''); 
  }, []);

  // RESTORE: Handler to open the custom task dialog
  const handleOpenCustomTaskDialog = useCallback(() => {
      if (!currentQuoteId) {
          console.warn("Cannot add custom task: No quote selected.");
          return;
      }
      setIsCustomTaskDialogOpen(true);
  }, [currentQuoteId]);

  return (
    <TooltipProvider>
      <DashboardMenu isOpen={mainMenuOpen} onClose={() => setMainMenuOpen(false)} />
      
      <PageHeaderActions
        isSidebarVisible={isQuoteSidebarVisible}
        onToggleSidebar={handleToggleQuoteSidebar}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        isProcessingAction={isProcessingAction}
      />

      <div className="h-screen flex">
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 left-4 z-50"
          onClick={() => setMainMenuOpen(!mainMenuOpen)}
        >
          <Menu className="h-6 w-6" />
        </Button>

        <div
          className={cn(
            "h-full bg-card border-r transition-all duration-300 ease-in-out flex flex-col",
            (sidebarOpen || isHovering) ? "w-64" : "w-16"
          )}
          onMouseEnter={() => handleSidebarHover(true)}
          onMouseLeave={() => handleSidebarHover(false)}
        >
          <div
            className={cn(
              "flex items-center border-b transition-all duration-300 ease-in-out h-16",
              "justify-center", 
              (sidebarOpen || isHovering) ? "px-4" : "", 
              "sticky top-0 bg-card z-10 flex-shrink-0"
            )}
          >
             {(sidebarOpen || isHovering) && (
                <h2 className="font-semibold transition-opacity duration-200 text-lg">
                  Categories
                </h2>
             )}
             {!sidebarOpen && !isHovering && (
                <div className="w-6 h-6" />
             )}
          </div>

          {(sidebarOpen || isHovering) && (
            <div className="p-3 border-b flex-shrink-0 flex items-center space-x-2">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
              <Tooltip>
                 <TooltipTrigger asChild>
                   <div className={!currentQuoteId ? 'cursor-not-allowed' : ''}>
                     <Button 
                       variant="outline"
                       size="icon" 
                       className="h-9 w-9 flex-shrink-0" 
                       onClick={handleOpenCustomTaskDialog}
                       disabled={!currentQuoteId}
                       style={!currentQuoteId ? { pointerEvents: 'none' } : {}}
                       title="Add Custom Task to Quote"
                     >
                       <ClipboardPlus className="h-4 w-4" />
                     </Button>
                   </div>
                 </TooltipTrigger>
                 <TooltipContent>
                    <p>{currentQuoteId ? 'Add Custom Task to Current Quote' : 'Select a quote first'}</p>
                 </TooltipContent>
               </Tooltip>
            </div>
          )}

          <div className="flex-grow overflow-y-auto">
             {searchQuery.trim() === '' ? (
                 serviceCategories.map((category) => (
                   <button
                     key={category.id}
                     className={cn(
                       "w-full text-left p-3 hover:bg-accent transition-colors duration-150 flex items-center gap-3",
                       selectedCategory === category.id ? "bg-accent font-semibold" : "",
                       (sidebarOpen || isHovering) ? "" : "justify-center"
                     )}
                     onClick={() => handleCategorySelect(category.id)}
                     title={category.name}
                   >
                     <category.icon className={cn("h-5 w-5 flex-shrink-0", category.color)} />
                     {(sidebarOpen || isHovering) && (
                         <span className="truncate text-sm">{category.name}</span>
                     )}
                   </button>
                 ))
             ) : (
                  <>
                    {searchResults.categories.length > 0 && (
                        <div className="p-2 pt-3 text-xs font-semibold text-muted-foreground">CATEGORIES</div>
                    )}
                    {searchResults.categories.map((category) => (
                         <button
                            key={category.id}
                            className={cn("w-full text-left p-3 hover:bg-accent transition-colors duration-150 flex items-center gap-3", (sidebarOpen || isHovering) ? "" : "justify-center")}
                            onClick={() => handleCategorySelect(category.id)} title={category.name}
                          >
                            <category.icon className={cn("h-5 w-5 flex-shrink-0", category.color)} />
                            {(sidebarOpen || isHovering) && <span className="truncate text-sm">{category.name}</span>}
                         </button>
                    ))}
                    {searchResults.services.length > 0 && (
                        <div className="p-2 pt-3 text-xs font-semibold text-muted-foreground">SERVICES</div>
                    )}
                    {searchResults.services.map((service) => (
                         <div key={service.id} className="p-3 text-sm text-muted-foreground flex items-center gap-3" title={service.name}>
                             {(() => {
                                const cat = serviceCategories.find(c => c.id === service.categoryId);
                                const Icon = cat ? cat.icon : Wrench;
                                const color = cat ? cat.color : 'text-gray-500';
                                return <Icon className={cn("h-5 w-5 flex-shrink-0", color)} />;
                              })()}
                              {(sidebarOpen || isHovering) && <span className="truncate">{service.name}</span>}
                         </div>
                    ))}
                    {searchResults.categories.length === 0 && searchResults.services.length === 0 && (
                        <div className="p-4 text-center text-sm text-muted-foreground">No results found.</div>
                    )}
                  </>
              )}
          </div>
        </div>

        <main className="flex-1 p-6 overflow-auto bg-muted/40">
          {selectedCategoryData ? (
            <div className="flex-1 overflow-auto p-6">
              <CategoryView
                key={selectedCategoryData.id} 
                services={categoryServices}
                tiers={availableTiers} 
                selectedTierId={currentQuote?.selectedTierId || null}
                onAddToQuote={handleAddToQuote}
                onAddOrIncrementTask={handleAddOrIncrementTask}
                onQuickAddToQuote={handleQuickAddToQuote}
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Select a category to view services.
            </div>
          )}
        </main>

        {isQuoteSidebarVisible && currentCustomer && (
            <div className="w-80 flex-shrink-0 h-screen">
                <CurrentQuoteSidebar
                    quotes={customerQuotes}
                    currentQuoteId={currentQuoteId}
                    customer={currentCustomer}
                    availableTiers={availableTiers}
                    allCustomers={allCustomers}
                    onCustomerSelect={handleCustomerSelect}
                    onQuoteSelect={handleQuoteSelect}
                    onTierSelect={handleTierSelect}
                    onDeleteTask={handleDeleteTask}
                    onAddTier={handleAddTier}
                    onDeleteTier={handleDeleteTier}
                    onRenameTier={handleRenameTier}
                    onPreviewQuote={handlePreviewQuote}
                    onUpdateCustomer={handleUpdateCustomer}
                    onAddQuote={handleAddQuote}
                    onDeleteQuote={handleDeleteQuote}
                    onRenameQuote={handleRenameQuote}
                    onUpdateTaskPrice={handleUpdateTaskPrice}
                    onUpdateTask={handleUpdateTask}
                    onApplyPercentageAdjustment={handleApplyPercentageAdjustment}
                    onUpdateAllTasks={handleUpdateAllTasks}
                    onReorderTasks={handleReorderTasks}
                    onDuplicateTier={handleDuplicateTier}
                    onClearAllTasks={handleClearAllTasks}
                    onDeleteAllQuotes={handleDeleteAllQuotes}
                    onDuplicateQuote={handleDuplicateQuote}
                    onDeleteAllTiers={handleDeleteAllTiers}
                />
            </div>
        )}
      </div>
      <AddCustomTaskDialog 
          isOpen={isCustomTaskDialogOpen}
          onOpenChange={setIsCustomTaskDialogOpen}
          availableTiers={availableTiers}
          currentQuoteSelectedTierId={currentQuote?.selectedTierId || null}
          onAddCustomTask={handleAddCustomTask}
      />
    </TooltipProvider>
  );
} 