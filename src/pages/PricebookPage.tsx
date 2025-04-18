import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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
  Menu,
  Search,
  ClipboardPlus,
  Camera,
  Sparkles,
  PanelRightClose, // Added
  PanelRightOpen,  // Added
  Bug,
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeToggle } from '@/components/ui/ThemeToggle'; // Added ThemeToggle import
import { useLocation, useSearchParams, useParams } from 'react-router-dom'; // Add this import

// --- NEW IMPORTS ---
import { CurrentQuoteSidebar } from '@/components/pricebook/CurrentQuoteSidebar';
import { Quote, Customer, Tier, QuoteTask } from '@/types/quote';
import { v4 as uuidv4 } from 'uuid';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { fetchServiceM8Customers, updateServiceM8Customer, createServiceM8Customer, fetchServiceM8Customer } from '@/lib/servicem8';
import { AddCustomerDialog } from '@/components/pricebook/AddCustomerDialog';
import { useToast } from "@/hooks/use-toast"; // <<< IMPORT useToast
import { customers as mockCustomers } from '@/mock/customers';
import { useCustomers } from "@/contexts/CustomerContext"; // Add CustomerContext import
import { useQuotes } from "@/contexts/QuoteContext"; // Add QuoteContext import

// --- Define Default Tier Constant ---
const CUSTOM_CATEGORY_NAME = "Custom Tasks"; // Define constant for custom category

// --- Mock Data (Replace with actual data fetching/management later) ---
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

// --- Updated Data Structure for Categories ---
interface SubSubcategory {
  id: string;
  name: string;
}

interface Subcategory {
  id: string;
  name: string;
  subSubcategories?: SubSubcategory[];
}

interface ServiceCategory {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  description: string;
  subcategories?: Subcategory[]; // Optional subcategories
}

// Add some mock subcategories/sub-subcategories for demonstration
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
    subcategories: [
      { id: 'service-general', name: 'General Maintenance' },
      { id: 'service-tuneup', name: 'System Tune-up' },
    ]
  },
  {
    id: 'hot-water',
    name: 'Hot Water',
    icon: Droplet,
    color: 'text-red-500',
    description: 'Hot water system repairs and installations',
    subcategories: [
      { 
        id: 'hw-electric', 
        name: 'Electric Systems', 
        subSubcategories: [
          { id: 'hw-elec-replace', name: 'Replacement' },
          { id: 'hw-elec-repair', name: 'Repair' },
        ]
      },
      { id: 'hw-gas', name: 'Gas Systems' },
      { id: 'hw-heatpump', name: 'Heat Pump' },
    ]
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
  onSaveTaskToLibrary: (task: QuoteTask, tierId: string) => void; // Added prop
}

function AddCustomTaskDialog({ 
  isOpen, 
  onOpenChange, 
  availableTiers, 
  currentQuoteSelectedTierId,
  onAddCustomTask}: AddCustomTaskDialogProps) { // No need for intersection type here
  const [taskName, setTaskName] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPrice, setTaskPrice] = useState("");
  const [selectedTierId, setSelectedTierId] = useState<string>("");
  // const [saveToLibrary, setSaveToLibrary] = useState<boolean>(false); // State for checkbox (currently removed)

  const supabase = useSupabaseClient(); // Get Supabase client

  // Effect to set default tier when dialog opens
  useEffect(() => {
    if (isOpen && availableTiers.length > 0) {
      // Use the tier selected in the main UI if available, otherwise default to first tier
      const defaultTier = currentQuoteSelectedTierId && availableTiers.find(t => t.id === currentQuoteSelectedTierId)
        ? currentQuoteSelectedTierId
        : availableTiers[0]?.id;
      setSelectedTierId(defaultTier || "");
    } else if (!isOpen) {
      // Reset form when dialog closes
      closeAndReset();
    }
    // Ensure dependency array includes all props that could affect the default selection
  }, [isOpen, availableTiers, currentQuoteSelectedTierId]);

  // Reset form fields
  const closeAndReset = () => {
    setTaskName("");
    setTaskDescription("");
    setTaskPrice("");
    // setSaveToLibrary(false); // Reset save to library flag
    // Don't reset selectedTierId here to keep the default selection logic in the effect
    onOpenChange(false); // Also close the dialog
  };

  // Handler for adding the task to the quote only (inside the dialog)
  const handleAddTaskToQuoteDialog = () => {
    const price = parseFloat(taskPrice);
    if (taskName.trim() && !isNaN(price) && selectedTierId) {
    const newTask: QuoteTask = {
      taskId: `custom-${uuidv4()}`,
      name: taskName.trim(),
        description: taskDescription.trim(),
        basePrice: price,
        category: CUSTOM_CATEGORY_NAME, // Assign to custom category
        addons: [], // Initialize addons
        quantity: 1, // Initialize quantity
      };
      onAddCustomTask(newTask, selectedTierId); // Call the parent's handler
      closeAndReset(); // Close and reset form
      } else {
      // Basic validation feedback (consider using a more robust validation library)
      alert("Please enter a valid task name, price, and select a tier.");
    }
  };

  // Handler for saving to library AND adding to quote (currently commented out in JSX)

  // Handle image upload click
  const handleImageButtonClick = () => {
    console.log("Image upload clicked");
    // Trigger file input click or open a modal
    const fileInput = document.getElementById('task-image-upload');
    fileInput?.click();
  };

  // --- Placeholder AI Handlers ---
  const [isEnhancingName, setIsEnhancingName] = useState(false);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);

  const handleEnhanceName = useCallback(async () => {
    if (!taskName.trim() || !supabase) return;
    setIsEnhancingName(true);
    console.log("AI Enhancing Name:", taskName);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setTaskName(taskName + " (Enhanced)"); // Placeholder enhancement
    setIsEnhancingName(false);
  }, [taskName, supabase]);

  const handleGenerateDescription = useCallback(async () => {
    if (!taskName.trim() || !supabase) return;
    setIsGeneratingDesc(true);
    console.log("AI Generating Desc for:", taskName);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setTaskDescription(`This is an AI-generated description based on "${taskName}". It details the work involved and potential benefits.`);
    setIsGeneratingDesc(false);
  }, [taskName, supabase]);
  // --- End Placeholder AI Handlers ---

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <ClipboardPlus className="mr-2 h-5 w-5" /> Add Custom Task
          </DialogTitle>
          <DialogDescription>
            Create a one-off task for the current quote. Optionally save it to your library.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
           {/* Name Input with AI Button */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="task-name" className="text-right">
              Name*
            </Label>
              <div className="col-span-3 flex items-center gap-1.5"> 
                <Input 
                  id="task-name"
                  value={taskName} 
                  onChange={(e) => setTaskName(e.target.value)} 
                  className="flex-grow" 
                  placeholder="e.g., Special Consultation Fee"
                />
                 <Tooltip>
                   <TooltipTrigger asChild>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-purple-500 hover:bg-purple-100 disabled:opacity-50" 
                  onClick={handleEnhanceName} 
                  disabled={!taskName.trim() || isEnhancingName}
                >
                  <Sparkles className={`h-4 w-4 ${isEnhancingName ? 'animate-pulse' : ''}`} />
                </Button>
                   </TooltipTrigger>
                   <TooltipContent>
                     <p>Enhance Name with AI</p>
                   </TooltipContent>
                 </Tooltip>
              </div>
            </div>
           {/* Description Textarea with AI Button */}
          <div className="grid grid-cols-4 items-start gap-4"> {/* Use items-start for multiline */}
            <Label htmlFor="task-description" className="text-right pt-2"> {/* Add padding-top */}
              Description
            </Label>
              <div className="col-span-3 flex items-start gap-1.5"> 
                 <Textarea 
                  id="task-description"
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                    className="flex-grow" 
                  placeholder="(Optional) Add more details about the task"
                    rows={3} 
                 />
                 <Tooltip>
                   <TooltipTrigger asChild>
                 <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                        className="h-8 w-8 text-purple-500 hover:bg-purple-100 disabled:opacity-50 mt-1.5" // Align button slightly lower
                        onClick={handleGenerateDescription}
                        disabled={!taskName.trim() || isGeneratingDesc} // Disable if no name or generating
                      >
                        <Sparkles className={`h-4 w-4 ${isGeneratingDesc ? 'animate-pulse' : ''}`} />
                 </Button>
                   </TooltipTrigger>
                   <TooltipContent>
                     <p>Generate Description with AI (uses Name)</p>
                   </TooltipContent>
                 </Tooltip>
              </div>
            </div>
           {/* Price Input */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="task-price" className="text-right">
              Price*
            </Label>
            <Input
              id="task-price"
              type="number"
              value={taskPrice}
              onChange={(e) => setTaskPrice(e.target.value)}
              className="col-span-3"
              placeholder="e.g., 150.00"
              step="0.01"
              required // Add required attribute
            />
            </div>
           {/* Tier Selection */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="task-tier" className="text-right">
              Add to Tier*
            </Label>
            <Select value={selectedTierId} onValueChange={setSelectedTierId} required>
                 <SelectTrigger className="col-span-3">
                   <SelectValue placeholder="Select a tier..." />
                 </SelectTrigger>
                 <SelectContent>
                {availableTiers.length > 0 ? (
                  availableTiers.map((tier) => (
                    <SelectItem key={tier.id} value={tier.id}>
                      {tier.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="" disabled>No tiers available</SelectItem>
                )}
                 </SelectContent>
               </Select>
             </div>
           {/* Hidden File Input and Image Upload Button */}
            <input type="file" id="task-image-upload" accept="image/*" className="hidden" onChange={(e) => console.log("File selected:", e.target.files)} />
            <div className="grid grid-cols-4 items-center gap-4">
               <Label className="text-right">Image</Label>
               <Button variant="outline" onClick={handleImageButtonClick} className="col-span-3">
                 <Camera className="mr-2 h-4 w-4" /> Upload Image
            </Button>
                </div>
          {/* Save to Library Checkbox - currently removed */}
          {/*
           <div className="grid grid-cols-4 items-center gap-4">
             <Label htmlFor="save-library" className="text-right">
               Save
             </Label>
             <div className="col-span-3 flex items-center space-x-2">
               <Checkbox
                 id="save-library"
                 checked={saveToLibrary}
                 onCheckedChange={(checked) => setSaveToLibrary(checked === true)} // Handle boolean conversion
               />
               <label htmlFor="save-library" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                 Save this task to library for future use
               </label>
                         </div>
                       </div>
           */}
                       </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
                           </Button>
          {/* Conditional Button Text - Call the correct handler */}
          <Button onClick={handleAddTaskToQuoteDialog} disabled={!taskName.trim() || isNaN(parseFloat(taskPrice)) || !selectedTierId}>
            Add Task to Quote
                     </Button>
           {/* Add "Save to Library & Add" button if needed - currently commented out */}
          {/*
           <Button onClick={handleSaveToLibraryAndQuote} disabled={!taskName.trim() || isNaN(parseFloat(taskPrice)) || !selectedTierId}>
             Save to Library & Add
           </Button>
           */}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to recalculate total price for a specific tier
function calculateTierTotalPrice(quote: Quote, tierId: string): number {
  if (!quote || !quote.tierTasks || !quote.tierTasks[tierId]) {
      return 0;
    }
  const tierTasks = quote.tierTasks[tierId];
  return tierTasks.reduce((sum, task) => {
    const basePrice = Number(task.basePrice) || 0;
    const quantity = Number(task.quantity) || 1;
    const addonTotal = task.addons?.reduce((addonSum, addon) => addonSum + (Number(addon.price) || 0), 0) ?? 0;
    const taskTotal = (basePrice + addonTotal) * quantity;
      return sum + taskTotal;
    }, 0);
}

// Helper function to recalculate total for the currently selected tier
function recalculateQuoteTotalForSelectedTier(quote: Quote): number {
  if (!quote || !quote.selectedTierId) {
    return 0;
  }
  return calculateTierTotalPrice(quote, quote.selectedTierId);
}

// --- Main Pricebook Page Component ---
export function PricebookPage() {
  // Remove unused navigate
  const params = useParams();
  const location = useLocation();
  
  // Extract quoteId from either URL params or query params
  const quoteIdFromParams = params.quoteId;
  const quoteIdFromQuery = new URLSearchParams(location.search).get('quoteId');
  const quoteId = quoteIdFromParams || quoteIdFromQuery;
  
  // Find and select the quote only once when the component mounts or quoteId changes
  useEffect(() => {
    if (quoteId) {
      console.log(`Loading quote: ${quoteId}`);
      findAndSelectQuote(quoteId);
    }
  }, [quoteId]); // Only depend on quoteId, not other state variables
  
  // Update findAndSelectQuote to accept a quoteId parameter
  const findAndSelectQuote = async (id: string) => {
    console.log(`[DEBUG] Trying to find quote ID: ${id}`);
    
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select('*, customer:customers(*)')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error("[DEBUG] Error fetching quote from Supabase:", error);
        toast({
          title: "Quote Not Found",
          description: "The requested quote could not be found. Error: " + error.message,
          variant: "destructive"
        });
        return;
      }
      
      console.log("[DEBUG] Found quote in Supabase:", data);
      
      // Set the customer if it's included in the response
      if (data.customer) {
        setCurrentCustomer(data.customer);
      }
      
      // Format the quote to match your local structure with ALL required fields
      const formattedQuote: Quote = {
        id: data.id,
        quoteNumber: data.quote_number,
        sequenceNumber: data.sequence_number || 1,
        name: data.name,
        customerId: data.customer_id,
        status: data.status || 'Draft',
        tierTasks: data.tier_tasks || {},
        selectedTierId: data.selected_tier_id,
        adjustments: data.adjustments || [],
        totalPrice: data.total_price || 0,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        sentAt: data.sent_at,
        acceptedAt: data.accepted_at
      };
      
      console.log("[DEBUG] Formatted quote for state:", formattedQuote);
      
      // Add to quotes state
      setCustomerQuotes([formattedQuote]);
      setCurrentQuoteId(formattedQuote.id);
      
      // Make sure sidebar is visible
      setIsQuoteSidebarVisible(true);
      
      toast({
        title: "Quote Loaded",
        description: `Quote ${formattedQuote.quoteNumber} loaded successfully.`
      });
      
    } catch (err) {
      console.error("[DEBUG] Critical error in findAndSelectQuote:", err);
      toast({
        title: "Error Loading Quote",
        description: "An unexpected error occurred while loading the quote.",
        variant: "destructive"
      });
    }
  };
  
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);
  // Sidebar state
  const [_sidebarOpen, _setSidebarOpen] = useState<boolean>(false);
  const [mainMenuOpen, setMainMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  // Hovering state
  const [_isHovering, _setIsHovering] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<{
    categories: ServiceCategory[];
    services: Service[];
  }>({
    categories: serviceCategories,
    services: [],
  });

  // --- Quote and Customer State ---
  const [isQuoteSidebarVisible, setIsQuoteSidebarVisible] = useState(true);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState<boolean>(true);
  const [_errorCustomers, setErrorCustomers] = useState<string | null>(null);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [customerQuotes, setCustomerQuotes] = useState<Quote[]>([]);
  const [currentQuoteId, setCurrentQuoteId] = useState<string | null>(null);
  const [availableTiers, setAvailableTiers] = useState<Tier[]>(mockAvailableTiers);
  const [activeBaseQuoteNumber, setActiveBaseQuoteNumber] = useState<string | null>(null);
  const [isCustomTaskDialogOpen, setIsCustomTaskDialogOpen] = useState(false);
  const [isAddCustomerDialogOpen, setIsAddCustomerDialogOpen] = useState(false);

  const supabase = useSupabaseClient();

  const [allServices, setAllServices] = useState<Service[]>(services);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);

  const { toast } = useToast();
  
  // Access context data
  const { selectedCustomer: contextCustomer, selectCustomer: contextSelectCustomer, allCustomers: contextCustomers } = useCustomers();
  const { getQuoteById } = useQuotes();

  const [searchParams] = useSearchParams();

  // --- Calculate Current Quote ---
  const currentQuote = useMemo(() => {
    if (!currentQuoteId) return null;
    return customerQuotes.find(q => q.id === currentQuoteId) || null;
  }, [currentQuoteId, customerQuotes]);

  // --- Callback Functions ---

  // UPDATED: Now increments quantity if the task already exists in the tier.

  // Handler for adding a custom task (from dialog)
  const handleAddCustomTask = useCallback((newTask: QuoteTask, tierId: string) => {
    if (!currentQuoteId) {
        console.warn("Cannot add custom task: No current quote selected.");
        return;
    }
    console.log("Adding custom task:", newTask, "to tier:", tierId);
    setCustomerQuotes((prevQuotes: Quote[]) => // Add type
      prevQuotes.map((q: Quote) => { // Add type
        if (q.id === currentQuoteId) {
          // Ensure the target tier exists
           if (!q.tierTasks || !(tierId in q.tierTasks)) {
             console.warn(`Target tier ${tierId} does not exist in quote ${q.id}. Cannot add task.`);
             return q; // Return quote unchanged
           }
          const updatedTierTasks = {
            ...q.tierTasks,
            [tierId]: [...(q.tierTasks[tierId]), { ...newTask, quantity: 1, addons: [] }] // Add with default quantity/addons
          };
          const updatedQuote = {
            ...q,
            tierTasks: updatedTierTasks,
            updatedAt: new Date().toISOString(),
          };
          // Recalculate total for the selected tier if it matches the tier the task was added to
          if (tierId === q.selectedTierId) {
            updatedQuote.totalPrice = recalculateQuoteTotalForSelectedTier(updatedQuote);
          }
          return updatedQuote;
        }
        return q;
      })
    );
  }, [currentQuoteId]);

  const handleDeleteTask = useCallback((taskIndex: number, tierId: string) => {
      console.log(`[PricebookPage] Deleting task index ${taskIndex} from tier ${tierId}`);
    if (!currentQuoteId) {
          console.warn("Cannot delete task: No current quote selected.");
      return;
    }

      setCustomerQuotes((prevQuotes: Quote[]) => // Add type
          prevQuotes.map((quote: Quote) => { // Add type
        if (quote.id === currentQuoteId) {
          if (!quote.tierTasks || !(tierId in quote.tierTasks)) {
                      console.warn(`Tier ${tierId} not found in quote ${quote.id}`);
                      return quote; // Tier doesn't exist, return unchanged
          }

                  const currentTasks = quote.tierTasks[tierId];
          if (taskIndex < 0 || taskIndex >= currentTasks.length) {
                      console.warn(`Invalid task index ${taskIndex} for tier ${tierId}`);
                      return quote; // Index out of bounds
          }

                  // Create new tasks array excluding the task at taskIndex
          const updatedTasks = currentTasks.filter((_, index) => index !== taskIndex);

                  // Create updated tierTasks object
                  const updatedTierTasks = { ...quote.tierTasks, [tierId]: updatedTasks };

                  // Create updated quote object
                  const updatedQuote = {
            ...quote,
            tierTasks: updatedTierTasks,
            updatedAt: new Date().toISOString(),
          };

                  // Recalculate total price if the deletion happened in the selected tier
                  if (tierId === updatedQuote.selectedTierId) {
             updatedQuote.totalPrice = recalculateQuoteTotalForSelectedTier(updatedQuote);
                      console.log(` -> Task deleted, new total for quote ${quote.id}: ${updatedQuote.totalPrice}`);
                  }
          return updatedQuote;
        }
        return quote; // Return other quotes unchanged
      })
    );
  }, [currentQuoteId]);

  const handleQuoteSelect = useCallback((quoteId: string) => {
    console.log("PricebookPage.handleQuoteSelect called with quoteId:", quoteId);
    
    try {
      if (!quoteId) {
        console.error("Invalid quoteId provided to handleQuoteSelect");
        return;
      }
      
      // Verify the quote exists
      const quoteExists = customerQuotes.some(q => q.id === quoteId);
      if (!quoteExists) {
        console.error("Quote not found in customerQuotes:", quoteId);
        toast({
          title: "Error",
          description: "The selected quote could not be found.",
          variant: "destructive"
        });
        return;
      }
      
      // Force a state update to make sure we trigger a re-render
      setCurrentQuoteId(current => {
        console.log("Setting currentQuoteId from", current, "to", quoteId);
        return quoteId;
      });
      
      // Ensure the sidebar is visible when selecting a quote
      setIsQuoteSidebarVisible(true);
      
      // Show success toast
      toast({
        title: "Quote Selected",
        description: "The quote has been loaded for editing.",
      });
    } catch (error) {
      console.error("Error in handleQuoteSelect:", error);
      toast({
        title: "Error",
        description: "Failed to select quote. Please try again.",
        variant: "destructive"
      });
    }
  }, [customerQuotes, toast]);

  const handleTierSelect = useCallback((tierId: string) => {
    console.log("Selecting Tier:", tierId);
    if (!currentQuoteId) return;
    setCustomerQuotes((prevQuotes: Quote[]) => // Add type
      prevQuotes.map((q: Quote) => { // Add type
         if (q.id === currentQuoteId) {
            const updatedQuote = {
               ...q,
               selectedTierId: tierId,
               updatedAt: new Date().toISOString(),
            };
            // Recalculate total price based on the NEWLY selected tier
            updatedQuote.totalPrice = calculateTierTotalPrice(updatedQuote, tierId);
            return updatedQuote;
         }
         return q;
      })
    );
  }, [currentQuoteId]);

  // Handler for adding a new quote
  const handleAddQuote = useCallback((nextSequenceNumber: number) => {
    if (!currentCustomer) {
      console.error("Cannot add quote: No customer selected.");
      return;
    }

    const newQuoteId = `quote-${uuidv4()}`;
    
    // *** Initialize tierTasks ONLY with standard tiers for a NEW quote ***
    const standardTierIds = ['tier-gold', 'tier-silver', 'tier-bronze'];
    const initialTierTasks = standardTierIds.reduce((acc, tierId) => {
      acc[tierId] = [];
      return acc;
    }, {} as Record<string, QuoteTask[]>);

    const newQuote: Quote = {
      id: newQuoteId,
      quoteNumber: activeBaseQuoteNumber || `Q-${uuidv4().substring(0, 4)}`, 
      sequenceNumber: nextSequenceNumber,
      name: `${nextSequenceNumber}`, 
      customerId: currentCustomer.id,
      status: 'Draft',
      tierTasks: initialTierTasks, // Use initialized tasks with standard tiers only
      selectedTierId: 'tier-gold', // Default to Gold for new quotes
      adjustments: [],
      totalPrice: 0, 
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setCustomerQuotes(prevQuotes => [...prevQuotes, newQuote]);
    setCurrentQuoteId(newQuoteId); // *** SELECT THE NEW QUOTE ***

    console.log("Added new quote:", newQuote);

  }, [currentCustomer, customerQuotes, availableTiers, activeBaseQuoteNumber, setCustomerQuotes, setCurrentQuoteId]); // Add missing dependencies

  // Handler for adding a new tier
  const handleAddTier = useCallback(() => {
    const existingTierNames = availableTiers.map(t => t.name.toLowerCase());
    const standardTierNames = ['Gold', 'Silver', 'Bronze']; // Order matters for checking
    let newName: string | null = null;

    // 1. Try standard names first (Gold, Silver, Bronze)
    for (const stdName of standardTierNames) {
      if (!existingTierNames.includes(stdName.toLowerCase())) {
        newName = stdName;
        break;
      }
    }

    // 2. If standard names are taken, try color names
    if (!newName) {
      for (const colorName of TIER_COLORS) { // TIER_COLORS defined elsewhere
        if (!existingTierNames.includes(colorName.toLowerCase())) {
          newName = colorName;
          break;
        }
      }
    }

    // 3. Fallback if all standard and color names are used
    if (!newName) {
      let counter = 1;
      do {
        newName = `Custom Tier ${counter}`;
        counter++;
      } while (existingTierNames.includes(newName.toLowerCase()));
    }

    const newTierId = `tier-${uuidv4()}`;
    const newTier: Tier = {
      id: newTierId,
      name: newName,
      multiplier: 1.0, // Default multiplier
      warranty: "Standard", // Default warranty
      perks: [],       // Default perks
    };

    // Add the new tier to the available tiers state
    setAvailableTiers(prevTiers => [...prevTiers, newTier]);

    // *** ALSO add the new tier key to all existing quotes for the current customer ***
    setCustomerQuotes(prevQuotes =>
      prevQuotes.map(quote => ({
        ...quote,
        tierTasks: {
          ...quote.tierTasks,
          [newTierId]: [], // Initialize with empty task array
        },
      }))
    );

    console.log("Added new tier:", newTier);

  }, [availableTiers, setAvailableTiers, setCustomerQuotes]); // Add dependencies

  // Handler for deleting a tier
  const handleDeleteTier = useCallback((tierIdToDelete: string) => { // Removed unused index
    console.log("Delete Tier:", tierIdToDelete);
    // Remove from available tiers first
    setAvailableTiers((prevTiers: Tier[]) => prevTiers.filter(t => t.id !== tierIdToDelete));

    // Update quotes
    setCustomerQuotes((prevQuotes: Quote[]) => // Add type
      prevQuotes.map((q: Quote) => { // Add type
        if (q.tierTasks && tierIdToDelete in q.tierTasks) {
          const { [tierIdToDelete]: _, ...remainingTierTasks } = q.tierTasks;
          let newSelectedTierId = q.selectedTierId;

          // If the deleted tier was selected, select the first remaining tier or null
          if (q.selectedTierId === tierIdToDelete) {
            const remainingTierIds = Object.keys(remainingTierTasks);
            newSelectedTierId = remainingTierIds.length > 0 ? remainingTierIds[0] : null;
          }
          // Create the updated quote with removed tier and potentially new selected tier
          const updatedQuote = {
              ...q,
              tierTasks: remainingTierTasks,
              selectedTierId: newSelectedTierId,
              updatedAt: new Date().toISOString(),
          };
          // Recalculate total price based on the (potentially new) selected tier
          updatedQuote.totalPrice = newSelectedTierId
              ? calculateTierTotalPrice(updatedQuote, newSelectedTierId)
              : 0;
          return updatedQuote;
        }
        return q; // Return quote unchanged if the tier wasn't present
      })
    );
  }, []);

  const handleRenameTier = useCallback((tierIdToRename: string, newName: string) => {
    console.log("Rename Tier:", tierIdToRename, "to:", newName);
    setAvailableTiers((prevTiers: Tier[]) => // Add type
      prevTiers.map((t: Tier) => (t.id === tierIdToRename ? { ...t, name: newName } : t)) // Add type
    );
    // No need to update quotes here as the tier ID remains the same
  }, []);

  const handlePreviewQuote = useCallback(() => console.log("Preview Quote"), []);

  const handleCustomerSelect = useCallback((customerId: string) => {
    console.log("Selecting Customer:", customerId);
    
    // First check if this customer is already selected to prevent unnecessary re-renders
    if (currentCustomer && currentCustomer.id === customerId) {
      console.log("Customer already selected, skipping re-selection:", customerId);
      return;
    }
    
    // Set a loading state to prevent interactions during state transitions
    setIsLoadingCustomers(true);
    
    try {
      // Clear current quote selection first to prevent potential UI issues
      setCurrentQuoteId(null);
      
      const selectedCustomer = allCustomers.find(c => c.id === customerId) || contextCustomers.find(c => c.id === customerId);
      if (!selectedCustomer) {
        console.warn("Selected customer not found:", customerId);
        setCurrentCustomer(null);
        setCustomerQuotes([]); // Clear quotes if customer not found
        setActiveBaseQuoteNumber(null);
        setIsLoadingCustomers(false);
        return;
      }
      
      // Update customer state
      setCurrentCustomer(selectedCustomer);
      
      // Fetch/set quotes for the newly selected customer
      const initialQuotes = getInitialQuotesForCustomer(selectedCustomer.id);
      
      // Update base quote number
      const baseNumber = initialQuotes[0]?.quoteNumber;
      if (baseNumber) {
        setActiveBaseQuoteNumber(baseNumber);
      } else {
        // If no quotes exist, generate a base number for potential new quotes
        const newBase = `Q-${Date.now().toString().slice(-6)}`;
        setActiveBaseQuoteNumber(newBase);
        console.warn(`Generated new base quote number for ${selectedCustomer.name}: ${newBase}`);
      }
      
      // If there are quotes, select the first one
      if (initialQuotes.length > 0) {
        setCustomerQuotes(initialQuotes);
        // Update quote ID after quotes are loaded
        setCurrentQuoteId(initialQuotes[0].id);
      } else {
        // If no quotes exist, create a new quote synchronously
        const newQuoteId = `quote-${uuidv4()}`;
        
        // Initialize tierTasks with standard tiers
        const standardTierIds = ['tier-gold', 'tier-silver', 'tier-bronze'];
        const initialTierTasks = standardTierIds.reduce((acc, tierId) => {
          acc[tierId] = [];
          return acc;
        }, {} as Record<string, QuoteTask[]>);
        
        const newQuote: Quote = {
          id: newQuoteId,
          quoteNumber: activeBaseQuoteNumber || `Q-${Date.now().toString().slice(-6)}`,
          sequenceNumber: 1, // First quote for this customer
          name: "1", // Default name
          customerId: selectedCustomer.id,
          status: 'Draft',
          tierTasks: initialTierTasks,
          selectedTierId: 'tier-gold', // Default to Gold
          adjustments: [],
          totalPrice: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        // Update state synchronously to avoid race conditions
        const newQuotes = [newQuote];
        setCustomerQuotes(newQuotes);
        // Set quote ID after quotes are created
        setCurrentQuoteId(newQuoteId);
        
        console.log("Created new quote for customer:", newQuote);
        
        // Show toast notification for the automatically created quote
        toast({
          title: "New Quote Created",
          description: `Created a new quote for ${selectedCustomer.name}. You can start adding services now.`,
        });
      }
    } catch (error) {
      console.error("Error in handleCustomerSelect:", error);
      toast({
        title: "Error",
        description: "Failed to select customer. Please try again.",
        variant: "destructive"
      });
    } finally {
      // Always reset loading state
      setIsLoadingCustomers(false);
    }
  }, [allCustomers, contextCustomers, activeBaseQuoteNumber, toast, currentCustomer]);

  const handleDeleteQuote = useCallback((quoteIdToDelete: string) => {
    console.log("Delete Quote:", quoteIdToDelete);
    const quotesAfterDeletion = customerQuotes.filter(q => q.id !== quoteIdToDelete);
    setCustomerQuotes(quotesAfterDeletion);
    if (currentQuoteId === quoteIdToDelete) {
      // Select the first remaining quote if the current one was deleted
      setCurrentQuoteId(quotesAfterDeletion.length > 0 ? quotesAfterDeletion[0].id : null);
    }
  }, [currentQuoteId, customerQuotes]);

  const handleRenameQuote = useCallback((quoteIdToRename: string, newName: string) => {
    console.log("Rename Quote:", quoteIdToRename, "to:", newName);
    setCustomerQuotes((prevQuotes: Quote[]) => // Add type
      prevQuotes.map((q: Quote) => (q.id === quoteIdToRename ? { ...q, name: newName, updatedAt: new Date().toISOString() } : q)) // Add type
    );
  }, []);

  const handleUpdateTask = useCallback((taskIndex: number, tierId: string, updatedTaskData: Partial<QuoteTask>) => {
    console.log(`[handleUpdateTask] Updating task index ${taskIndex} in tier ${tierId}`, updatedTaskData);
    setCustomerQuotes((prevQuotes: Quote[]) => // Add type
      prevQuotes.map((quote: Quote) => { // Add type
        if (quote.id === currentQuoteId && quote.tierTasks && tierId in quote.tierTasks) {
          const updatedTierTasks = [...quote.tierTasks[tierId]]; // Shallow copy tasks for the tier
          if (taskIndex >= 0 && taskIndex < updatedTierTasks.length) {
             // Merge existing task with updated data
             const mergedTask = { ...updatedTierTasks[taskIndex], ...updatedTaskData };
             updatedTierTasks[taskIndex] = mergedTask; // Replace task in the copied array

            const updatedQuote = {
              ...quote,
               tierTasks: { ...quote.tierTasks, [tierId]: updatedTierTasks }, // Update tierTasks with modified array
              updatedAt: new Date().toISOString(),
            };
            // Recalculate total ONLY if the updated tier is the currently selected one
            if (tierId === updatedQuote.selectedTierId) {
                updatedQuote.totalPrice = recalculateQuoteTotalForSelectedTier(updatedQuote);
            }
            console.log(` -> Task updated, new total for quote ${quote.id} (if selected tier): ${updatedQuote.totalPrice}`);
             // TODO: Add history tracking if needed
            return updatedQuote;
          } else {
             console.warn(`[handleUpdateTask] Invalid taskIndex ${taskIndex} for tier ${tierId}`);
          }
        }
        return quote;
      })
    );
  }, [currentQuoteId]);

  const handleUpdateAllTasks = useCallback((tierId: string, updatedTasks: QuoteTask[]) => {
      console.log(`[handleUpdateAllTasks] Updating all tasks for tier ${tierId}`, updatedTasks);
      setCustomerQuotes((prevQuotes: Quote[]) => // Add type
          prevQuotes.map((quote: Quote) => { // Add type
              if (quote.id === currentQuoteId) {
                  const updatedQuote = {
                      ...quote,
                      tierTasks: { ...quote.tierTasks, [tierId]: updatedTasks }, // Replace tasks for the tier
                      updatedAt: new Date().toISOString(),
                  };
                  // Recalculate total ONLY if the updated tier is the currently selected one
                  if (tierId === updatedQuote.selectedTierId) {
                      updatedQuote.totalPrice = recalculateQuoteTotalForSelectedTier(updatedQuote);
                      console.log(` -> All tasks updated, new total for quote ${quote.id}: ${updatedQuote.totalPrice}`);
                  } else {
                      console.log(` -> All tasks updated for tier ${tierId}, but it's not the selected tier (${updatedQuote.selectedTierId}). Total remains ${updatedQuote.totalPrice}.`);
                  }
                  // TODO: Add history tracking if needed
                  return updatedQuote;
              }
              return quote;
          })
      );
  }, [currentQuoteId]);

  const handleReorderTasks = useCallback((tierId: string, oldIndex: number, newIndex: number) => {
    console.log("Reorder Tasks in Tier:", tierId, "from", oldIndex, "to", newIndex);
    setCustomerQuotes((prevQuotes: Quote[]) => // Add type
      prevQuotes.map((q: Quote) => { // Add type
        if (q.id === currentQuoteId && q.tierTasks && tierId in q.tierTasks) {
           const currentTasks = q.tierTasks[tierId];
           // Ensure indices are valid before attempting move
           if (oldIndex >= 0 && oldIndex < currentTasks.length && newIndex >= 0 && newIndex < currentTasks.length) {
           const reorderedTasks = arrayMove(currentTasks, oldIndex, newIndex);
              const updatedQuote = { ...q, tierTasks: { ...q.tierTasks, [tierId]: reorderedTasks }, updatedAt: new Date().toISOString() };
              // TODO: Add history tracking if needed
              return updatedQuote;
           } else {
               console.warn(`[handleReorderTasks] Invalid indices (old: ${oldIndex}, new: ${newIndex}) for tier ${tierId} with ${currentTasks.length} tasks.`);
           }
        }
        return q;
      })
    );
  }, [currentQuoteId]);

  const handleDuplicateTier = useCallback((sourceTierId: string, destinationTierId: string | null, newTierName?: string) => {
    console.log("Duplicate Tier:", sourceTierId, "to", destinationTierId || "New Tier:", newTierName);
    const sourceTier = availableTiers.find(t => t.id === sourceTierId);
    if (!sourceTier) {
        console.error(`Source tier ${sourceTierId} not found.`);
        return;
    }

    if (destinationTierId) {
      // Overwrite existing tier - Copy tasks from source to destination
      setCustomerQuotes((prevQuotes: Quote[]) => // Add type
        prevQuotes.map((q: Quote) => { // Add type
          if (q.id === currentQuoteId && q.tierTasks && sourceTierId in q.tierTasks && destinationTierId in q.tierTasks) {
             // Deep copy tasks to avoid shared references if necessary, though structure might be simple enough
             const sourceTasks = JSON.parse(JSON.stringify(q.tierTasks[sourceTierId]));
             const updatedQuote = {
                 ...q,
                 tierTasks: { ...q.tierTasks, [destinationTierId]: sourceTasks },
                 updatedAt: new Date().toISOString()
             };
             // Recalculate total price if the overwritten tier is the selected one
             if (destinationTierId === updatedQuote.selectedTierId) {
                 updatedQuote.totalPrice = recalculateQuoteTotalForSelectedTier(updatedQuote);
             }
             // TODO: Add history tracking if needed
             return updatedQuote;
          }
          return q;
        })
      );
    } else {
      // Create new tier
      const newTierId = `tier-${uuidv4()}`;
      const newTier: Tier = {
        ...sourceTier, // Copy properties from source tier
        id: newTierId,
        name: newTierName || `${sourceTier.name} Copy`,
      };
      // Add new tier to available tiers
      setAvailableTiers((prevTiers: Tier[]) => [...prevTiers, newTier]); // Add type

      // Add new tier and copy tasks in the current quote
      setCustomerQuotes((prevQuotes: Quote[]) => // Add type
        prevQuotes.map((q: Quote) => { // Add type
          if (q.id === currentQuoteId && q.tierTasks && sourceTierId in q.tierTasks) {
             // Deep copy tasks
             const sourceTasks = JSON.parse(JSON.stringify(q.tierTasks[sourceTierId]));
             const updatedQuote = {
                ...q,
                tierTasks: { ...q.tierTasks, [newTierId]: sourceTasks },
                updatedAt: new Date().toISOString()
             };
             // TODO: Add history tracking if needed
             return updatedQuote;
          }
          return q;
        })
      );
    }
  }, [availableTiers, currentQuoteId]);

  const handleClearAllTasks = useCallback((tierId: string) => {
    console.log("Clear All Tasks for Tier:", tierId);
    setCustomerQuotes((prevQuotes: Quote[]) => // Add type
      prevQuotes.map((q: Quote) => { // Add type
        if (q.id === currentQuoteId && q.tierTasks && tierId in q.tierTasks) {
           const updatedQuote = {
               ...q,
               tierTasks: { ...q.tierTasks, [tierId]: [] }, // Set tasks to empty array
               updatedAt: new Date().toISOString()
            };
           // Recalculate total price if the cleared tier is the selected one
            if (tierId === updatedQuote.selectedTierId) {
                updatedQuote.totalPrice = 0; // Total becomes 0
            }
           // TODO: Add history tracking if needed
           return updatedQuote;
        }
        return q;
      })
    );
  }, [currentQuoteId]);

  const handleDeleteAllQuotes = useCallback((customerId: string) => {
    console.log(`Delete All Quotes for Customer: ${customerId}`);
    const quotesToDelete = customerQuotes.filter(q => q.customerId === customerId);
    if (quotesToDelete.length === 0) return; // No quotes for this customer

    setCustomerQuotes((prevQuotes: Quote[]) => prevQuotes.filter(q => q.customerId !== customerId)); // Add type
    // If the current quote belonged to this customer, reset currentQuoteId
    if (currentQuoteId && quotesToDelete.some(q => q.id === currentQuoteId)) {
      setCurrentQuoteId(null);
        setActiveBaseQuoteNumber(null); // Also reset base number if relevant
    }
    // TODO: Add history tracking if needed
  }, [customerQuotes, currentQuoteId]);

  const handleDuplicateQuote = useCallback((quoteId: string) => {
    console.log("Duplicate Quote:", quoteId);
    const sourceQuote = customerQuotes.find(q => q.id === quoteId);
    if (!sourceQuote || !currentCustomer) {
        console.error("Cannot duplicate: Source quote or current customer not found.");
        return;
    }

    const currentSequenceNumbers = customerQuotes
        .filter(q => q.customerId === currentCustomer.id && q.quoteNumber === sourceQuote.quoteNumber) // Filter for same base number and customer
        .map(q => q.sequenceNumber);
    const nextSequenceNumber = currentSequenceNumbers.length > 0 ? Math.max(...currentSequenceNumbers) + 1 : 1;

      const newQuote: Quote = {
      ...sourceQuote, // Spread existing properties
      id: `quote-${uuidv4()}`, // New unique ID
      sequenceNumber: nextSequenceNumber,
      name: `${nextSequenceNumber}`, // Default name to sequence number
      status: "Draft", // Always reset status to Draft
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sentAt: undefined, // Clear sent/accepted dates
      acceptedAt: undefined,
      // Deep copy tierTasks and adjustments to prevent shared references
      tierTasks: JSON.parse(JSON.stringify(sourceQuote.tierTasks)),
      adjustments: JSON.parse(JSON.stringify(sourceQuote.adjustments)),
    };

    setCustomerQuotes((prev: Quote[]) => [...prev, newQuote]); // Add type
    setCurrentQuoteId(newQuote.id); // Select the newly duplicated quote
    // TODO: Add history tracking if needed
  }, [customerQuotes, currentCustomer, setCustomerQuotes, setCurrentQuoteId]); // Added dependencies

  // Handler for deleting all tiers (Revised: Deletes ALL tiers)
  const handleDeleteAllTiers = useCallback(() => {
    console.log("Delete All Tiers");
    if (!currentQuoteId) {
        console.warn("Cannot delete tiers: No quote selected.");
        return;
    }

    // Set available tiers to an empty array
    setAvailableTiers([]); 

    // Update the current quote: remove all tier tasks, select null tier
    setCustomerQuotes((prevQuotes: Quote[]) =>
        prevQuotes.map((q: Quote) => {
            if (q.id === currentQuoteId) {
               const updatedQuote = {
                   ...q,
                   tierTasks: {}, // Remove all tier tasks
                   selectedTierId: null, // Select null tier
                   totalPrice: 0, // Total becomes 0
                   updatedAt: new Date().toISOString(),
               };
               // TODO: Add history tracking if needed
               return updatedQuote;
            }
            return q;
        })
    );
  }, [currentQuoteId, setAvailableTiers, setCustomerQuotes]); // Added dependencies

  // Placeholder handler for saving the task to a library/database
  const handleSaveTaskToLibrary = useCallback((taskData: QuoteTask, _tierId: string) => {
    // In a real application, this would interact with your API/database
    console.log("[handleSaveTaskToLibrary] Request to save task:", taskData, "Tier context:", _tierId);
    // Example: Add to Supabase 'library_tasks' table
    // try {
    //   const { error } = await supabase.from('library_tasks').insert([taskData]);
    //   if (error) throw error;
    //   console.log("Task saved to library successfully.");
    // } catch (error) {
    //   console.error("Error saving task to library:", error);
    // }
  }, [supabase]); // Add supabase dependency if used


  // --- Placeholder Handlers for CategoryView ---
  // These might need refinement based on CategoryView's final props/behavior

  // Adds a service to MULTIPLE tiers (called from CategoryView potentially)
  const handleAddToQuoteMultiTier = useCallback((serviceId: string, tierIds: string[], quantity: number = 1) => {
    console.log(`[Placeholder] Add Service ${serviceId} (Qty: ${quantity}) to Tiers:`, tierIds);
    const service = services.find(s => s.id === serviceId);
    if (!service) {
      console.error(`Service ${serviceId} not found.`);
      return;
    }
    if (!currentQuoteId) {
        console.warn("Cannot add task to multiple tiers: No current quote selected.");
        return;
    }

    setCustomerQuotes((prevQuotes: Quote[]): Quote[] => // Add type
      prevQuotes.map((quote: Quote): Quote => { // Add type
        if (quote.id === currentQuoteId) {
          let updatedQuote = { ...quote }; // Start with a copy
          let needsRecalculation = false;

    tierIds.forEach(tierId => {
             if (updatedQuote.tierTasks && tierId in updatedQuote.tierTasks) {
                const currentTasks = updatedQuote.tierTasks[tierId] || [];
                let updatedTierTasks = [...currentTasks];
                let taskFound = false;

                // Check if service already exists in this tier
                updatedTierTasks = updatedTierTasks.map((existingTask: QuoteTask) => { // Add type
                   if (existingTask.originalServiceId === serviceId) {
                      taskFound = true;
                      return { ...existingTask, quantity: (existingTask.quantity || 1) + quantity };
                   }
                   return existingTask;
                });

                // If not found, add as new
                if (!taskFound) {
                   const newTask: QuoteTask = {
                      taskId: `task-${uuidv4()}`,
                      originalServiceId: service.id,
                      name: service.name,
                      description: service.description,
                      basePrice: service.price,
                      quantity: quantity,
                      addons: [],
                      category: service.categoryId,
                   };
                   updatedTierTasks.push(newTask);
                }

                // Update the tierTasks for this specific tier
                updatedQuote.tierTasks = { ...updatedQuote.tierTasks, [tierId]: updatedTierTasks };

                // Mark for recalculation if this tier is the selected one
                if (tierId === updatedQuote.selectedTierId) {
                    needsRecalculation = true;
                }
             } else {
                 console.warn(`Tier ${tierId} not found in quote ${quote.id}. Skipping addition for this tier.`);
             }
          }); // End forEach tierId

          // Recalculate if needed
          if (needsRecalculation) {
             updatedQuote.totalPrice = recalculateQuoteTotalForSelectedTier(updatedQuote);
          }
          updatedQuote.updatedAt = new Date().toISOString();
          // TODO: Add history tracking if needed
          return updatedQuote;
        }
        return quote;
      })
     );
  }, [currentQuoteId]);

  // Handles adding/incrementing from CategoryView (might be simplified)
  const handleAddOrIncrementTask = useCallback((serviceData: Service, tierId: string, _wasModified: boolean, quantity: number = 1) => {
    console.log(`[Placeholder] Add/Increment Task for Service ${serviceData.id} (Qty: ${quantity}) in Tier ${tierId}.`);
    // This now essentially calls the multi-tier add function for a single tier
    handleAddToQuoteMultiTier(serviceData.id, [tierId], quantity);
  }, [handleAddToQuoteMultiTier]);

  // Handles quick add (likely adds to the currently selected tier)
  const handleQuickAddToQuote = useCallback((serviceId: string, quantity: number = 1) => {
    const currentSelectedTier = currentQuote?.selectedTierId;
    if (!currentSelectedTier) {
      console.error("Cannot Quick Add: No tier selected.");
      return;
    }
    console.log(`[Placeholder] Quick Add Service ${serviceId} (Qty: ${quantity}) to selected tier ${currentSelectedTier}.`);
    // Call the multi-tier add function for the selected tier
    handleAddToQuoteMultiTier(serviceId, [currentSelectedTier], quantity);
  }, [currentQuote?.selectedTierId, handleAddToQuoteMultiTier]);

  // --- END Callback Functions ---

  // --- EFFECTS ---

  // Update customer state management - Select first customer initially
  useEffect(() => {
    if (!currentCustomer && allCustomers.length > 0) {
      handleCustomerSelect(allCustomers[0].id);
    }
  }, [currentCustomer, allCustomers, handleCustomerSelect]);

  // Effect for search
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults({ categories: serviceCategories, services: [] });
      // Don't reset selectedCategory if search is cleared
      return;
    }
    const query = searchQuery.toLowerCase();
    const matchedCategories = serviceCategories.filter(cat => cat.name.toLowerCase().includes(query) || cat.description.toLowerCase().includes(query));
    const matchedServices = services.filter(svc => svc.name.toLowerCase().includes(query) || svc.description.toLowerCase().includes(query));
    setSearchResults({ categories: matchedCategories, services: matchedServices });
    // Clear category selection *only if* search yields category results, otherwise keep selection
    // if (matchedCategories.length > 0) { // Maybe don't clear category on search?
    setSelectedCategory(null); // Clear category when searching
    // }
  }, [searchQuery]);

  // Commented out as this function is never used
  /*
  const handleSidebarHover = useCallback((hovering: boolean) => { 
    // Keeping sidebar expanded for now, hover doesn't change width
    // if (!sidebarOpen) setIsHovering(hovering);
    setIsHovering(hovering);
  }, [sidebarOpen]); // Dependency kept for potential future use
  */

  // --- Category Selection Handler ---
  const handleCategorySelect = useCallback((categoryId: string) => {
    const category = serviceCategories.find(c => c.id === categoryId);
    setSelectedCategory(category || null); // Set the found category object or null
    setSearchQuery(''); // Clear search when a category is explicitly selected
  }, []);

  // --- Sidebar Toggle Handler ---
  const handleToggleQuoteSidebar = useCallback(() => {
      setIsQuoteSidebarVisible(prev => !prev);
  }, []);

  // --- Handler to Open Custom Task Dialog ---
  const handleOpenCustomTaskDialog = useCallback(() => {
      if (!currentQuoteId) {
          console.warn("Cannot add custom task: No quote selected.");
          // Maybe show a toast notification here
          return;
       }
       setIsCustomTaskDialogOpen(true);
  }, [currentQuoteId]);

  // Debugging logs for state changes
  useEffect(() => console.log("Customer Quotes Updated:", customerQuotes), [customerQuotes]);
  useEffect(() => console.log("Current Quote ID Updated:", currentQuoteId), [currentQuoteId]);
  useEffect(() => console.log("Current Customer Updated:", currentCustomer), [currentCustomer]);
  useEffect(() => console.log("Available Tiers Updated:", availableTiers), [availableTiers]);

  // --- DEBUG: Log Supabase session on mount ---
  useEffect(() => {
    const checkSession = async () => {
      if (!supabase) {
          console.warn("Supabase client not available on mount.");
        return;
      }
      const { data: sessionData, error } = await supabase.auth.getSession();
        if (error) {
        console.error("Error getting Supabase session:", error);
        } else {
        console.log("Supabase Session:", sessionData.session);
      }
    };
    checkSession();
  }, [supabase]);
  // --- END DEBUG ---

  const handleToggleFavorite = useCallback((serviceId: string, isFavorite: boolean) => {
    setAllServices(prevServices => 
      prevServices.map(service => 
        service.id === serviceId ? { ...service, isFavorite } : service
      )
    );
    // TODO: Add API call here to persist the favorite status to the backend
    console.log(`Toggled favorite for ${serviceId} to ${isFavorite}`);
  }, []);

  useEffect(() => {
    // Filter services based on the selected category
    if (selectedCategory) {
      if (selectedCategory.id === 'favourites') {
        // Show only favorited services
        setFilteredServices(allServices.filter(service => service.isFavorite));
      } else {
        // Show services matching the selected category ID
        setFilteredServices(allServices.filter(service => service.categoryId === selectedCategory.id));
      }
    } else {
      // If no category is selected, show all services (or handle as needed)
      setFilteredServices(allServices); // Show all by default, or an empty array: []
    }
  }, [selectedCategory, allServices]); // Depend on allServices now

  // State for Category Sidebar Width
  const [categorySidebarWidth, setCategorySidebarWidth] = useState<number>(256); // Default width (w-64)
  const isCategoryResizing = useRef<boolean>(false);
  const categorySidebarRef = useRef<HTMLDivElement>(null);

  // Min/Max Width for Category Sidebar
  const minCategoryWidth = 180;
  const maxCategoryWidth = 500;

  // Mouse handlers for Category Sidebar Resizing
  const handleCategoryMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isCategoryResizing.current = true;
    document.addEventListener('mousemove', handleCategoryMouseMove);
    document.addEventListener('mouseup', handleCategoryMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const handleCategoryMouseMove = useCallback((e: MouseEvent) => {
    if (!isCategoryResizing.current || !categorySidebarRef.current) return;
    
    // Calculate new width based on mouse position relative to the *left* edge of the viewport
    // This assumes the sidebar is docked left
    const newWidth = e.clientX;
    
    // Apply constraints
    const constrainedWidth = Math.max(minCategoryWidth, Math.min(newWidth, maxCategoryWidth));
    setCategorySidebarWidth(constrainedWidth);
  }, [minCategoryWidth, maxCategoryWidth]); // Add dependencies

  const handleCategoryMouseUp = () => {
    if (isCategoryResizing.current) {
      isCategoryResizing.current = false;
      document.removeEventListener('mousemove', handleCategoryMouseMove);
      document.removeEventListener('mouseup', handleCategoryMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  };

  // Cleanup listener for Category Sidebar
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleCategoryMouseMove);
      document.removeEventListener('mouseup', handleCategoryMouseUp);
      // No need to reset cursor/userSelect here if handleMouseUp always fires
    };
  }, [handleCategoryMouseMove]); // Add dependency

  // --- Customer Handlers ---
  const loadCustomers = useCallback(async () => {
    console.log("Attempting to load customers from ServiceM8...");
    setIsLoadingCustomers(true);
    setErrorCustomers(null);
    try {
      let fetchedCustomers;
      try {
        fetchedCustomers = await fetchServiceM8Customers();
        console.log("Successfully fetched customers from ServiceM8:", fetchedCustomers);
      } catch (apiError) {
        console.warn("Failed to fetch from ServiceM8, falling back to context:", apiError);
        fetchedCustomers = contextCustomers;
        if (!fetchedCustomers || fetchedCustomers.length === 0) {
          console.warn("Context had no customers, falling back to mock data");
          fetchedCustomers = mockCustomers;
        }
      }
      
      const sortedCustomers = fetchedCustomers.sort((a, b) => a.name.localeCompare(b.name));
      setAllCustomers(sortedCustomers);
      
      // Select first customer automatically if none is selected
      if (!currentCustomer && sortedCustomers.length > 0) {
          setCurrentCustomer(sortedCustomers[0]); // Auto-select first loaded customer
      }
    } catch (err: any) {
      console.error("Failed to load customers:", err);
      setErrorCustomers(err.message || "An error occurred while fetching customers.");
      
      // Fallback to context if available
      if (contextCustomers && contextCustomers.length > 0) {
        console.log("Error recovery: Using customers from context");
        setAllCustomers(contextCustomers);
        if (!currentCustomer && contextCustomers.length > 0) {
          setCurrentCustomer(contextCustomers[0]);
        }
      }
    } finally {
      setIsLoadingCustomers(false);
    }
  }, [currentCustomer, contextCustomers]); // Add contextCustomers dependency

  const handleAddNewCustomer = useCallback(async (customerData: Omit<Customer, 'id'>) => {
    console.log("Attempting to add new customer via ServiceM8:", customerData);
    try {
      const newCustomerId = await createServiceM8Customer(customerData);
      if (newCustomerId) {
        console.log("Successfully created customer in ServiceM8 with ID:", newCustomerId);
        const newCustomer = await fetchServiceM8Customer(newCustomerId);
        if (newCustomer) {
          console.log("Successfully fetched new customer details:", newCustomer);
          setAllCustomers(prev => [...prev, newCustomer].sort((a, b) => a.name.localeCompare(b.name)));
          setCurrentCustomer(newCustomer); // Select the new customer
          const initialQuotes = getInitialQuotesForCustomer(newCustomerId);
          setCustomerQuotes(initialQuotes);
          setCurrentQuoteId(initialQuotes.length > 0 ? initialQuotes[0].id : null);
          setIsAddCustomerDialogOpen(false);
          toast({ // <<< SUCCESS TOAST
            title: "Customer Added",
            description: `Successfully added ${newCustomer.name}.`,
          });
        } else {
          console.error("Created customer but failed to fetch details. Refreshing list.");
          await loadCustomers();
          setIsAddCustomerDialogOpen(false);
          toast({ // <<< WARNING TOAST (added but couldn't fetch)
            variant: "default", // Or maybe 'warning' if you add that variant
            title: "Customer Added (Refresh Needed)",
            description: `Added customer, but couldn't fetch details immediately. List refreshed.`,
          });
        }
      } else {
        console.error("Failed to create customer in ServiceM8 (API returned null ID).");
        throw new Error("Failed to create customer. ServiceM8 did not return an ID.");
      }
    } catch (error: any) {
      console.error("Error in handleAddNewCustomer:", error);
      toast({ // <<< ERROR TOAST
          variant: "destructive",
          title: "Error Adding Customer",
          description: error.message || "An unexpected error occurred.",
      });
      throw error; // Re-throw for dialog internal error handling
    }
  }, [loadCustomers, toast]); // <<< Added toast dependency

  const handleUpdateCustomer = useCallback(async (updatedCustomer: Customer) => {
    console.log("handleUpdateCustomer called with:", updatedCustomer);
    const previousCustomers = allCustomers;
    const previousSelectedCustomer = currentCustomer;

    // Optimistic Update
    setAllCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
    if (currentCustomer?.id === updatedCustomer.id) {
      setCurrentCustomer(updatedCustomer);
    }

    try {
      console.log(`Attempting to update customer ${updatedCustomer.id} in ServiceM8...`);
      const success = await updateServiceM8Customer(updatedCustomer);
      if (success) {
          console.log(`Successfully updated customer ${updatedCustomer.id} in ServiceM8.`);
          toast({ // <<< SUCCESS TOAST
            title: "Customer Updated",
            description: `Successfully updated ${updatedCustomer.name}.`,
          });
      } else {
        console.error(`Failed to update customer ${updatedCustomer.id} in ServiceM8 (API returned failure).`);
        // Rollback optimistic update
        setAllCustomers(previousCustomers);
        setCurrentCustomer(previousSelectedCustomer);
        toast({ // <<< FAILURE TOAST
            variant: "destructive",
            title: "Update Failed",
            description: `Could not save changes for ${updatedCustomer.name}. Please try again.`,
        });
      }
    } catch (error: any) {
      console.error(`Error calling updateServiceM8Customer for ${updatedCustomer.id}:`, error);
      // Rollback optimistic update
      setAllCustomers(previousCustomers);
      setCurrentCustomer(previousSelectedCustomer);
      toast({ // <<< ERROR TOAST
          variant: "destructive",
          title: "Update Error",
          description: error.message || "An unexpected error occurred.",
      });
    }
  }, [allCustomers, currentCustomer, toast]); // <<< Added toast dependency

  // --- END Customer Handlers ---

  // --- EFFECTS ---
  // Initial customer load
  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]); // Run once on mount via loadCustomers dependency

  // Load quotes when customer changes
  useEffect(() => {
      // Skip this effect if currentCustomer doesn't exist
      // The quotes will be handled by handleCustomerSelect
      if (!currentCustomer) {
          // Clear quotes if no customer is selected
          setCustomerQuotes([]);
          setCurrentQuoteId(null);
          setActiveBaseQuoteNumber(null);
          return;
      }
      
      // If we already have quotes for this customer, no need to reload
      const existingQuotesForCustomer = customerQuotes.filter(q => q.customerId === currentCustomer.id);
      if (existingQuotesForCustomer.length > 0) {
          // We have quotes, make sure one is selected
          if (!currentQuoteId || customerQuotes.find(q => q.id === currentQuoteId)?.customerId !== currentCustomer.id) {
             setCurrentQuoteId(existingQuotesForCustomer[0].id);
          }
          return;
      }
      
      // If we get here, we need to load quotes
      const initialQuotes = getInitialQuotesForCustomer(currentCustomer.id);
      const baseNumber = initialQuotes[0]?.quoteNumber;
      setActiveBaseQuoteNumber(baseNumber || `Q-${Date.now().toString().slice(-6)}`);
      setCustomerQuotes(initialQuotes);
      
      // If quotes were found, select one
      if (initialQuotes.length > 0) {
         setCurrentQuoteId(initialQuotes[0].id);
         // Optionally add a toast notification that quotes were loaded
         toast({
           title: "Quotes Loaded",
           description: `Loaded ${initialQuotes.length} quote(s) for ${currentCustomer.name}.`,
         });
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCustomer, toast]);

  // ... Other Effects (Search, Debug logs, Session) ...
  
  // Now that handleCustomerSelect is defined, we can add the useEffect hooks
  // Sync context customer with local state
  useEffect(() => {
    if (contextCustomer && (!currentCustomer || currentCustomer.id !== contextCustomer.id)) {
      // Context customer changed, update local state
      handleCustomerSelect(contextCustomer.id);
    }
  }, [contextCustomer, currentCustomer, handleCustomerSelect]);

  // Update context when local customer changes
  useEffect(() => {
    if (currentCustomer && contextCustomer?.id !== currentCustomer.id) {
      contextSelectCustomer(currentCustomer.id);
    }
  }, [currentCustomer, contextCustomer, contextSelectCustomer]);

  // Effect to handle URL parameters for quote selection
  useEffect(() => {
    const quoteId = searchParams.get('quoteId') || (location.state && 'quoteId' in location.state ? location.state.quoteId : null);
    
    // Log to help with debugging
    console.log(`[PricebookPage] URL Parameter or State quoteId: ${quoteId}`);
    console.log(`[PricebookPage] Current Customer: ${currentCustomer?.id}, Quotes: ${customerQuotes.length}`);
    
    if (!quoteId) return;
    
    // Function to find and select the quote
    const findAndSelectQuote = async () => {
      // Check if quote is already in loaded quotes
      const quoteExists = customerQuotes.some(q => q.id === quoteId);
      
      if (quoteExists) {
        console.log(`[PricebookPage] Quote found in loaded quotes: ${quoteId}`);
        
        // Select the quote
        setCurrentQuoteId(quoteId);
        
        // Find customer for this quote
        const quote = customerQuotes.find(q => q.id === quoteId);
        if (quote && quote.customerId && (!currentCustomer || currentCustomer.id !== quote.customerId)) {
          const customerForQuote = allCustomers.find(c => c.id === quote.customerId);
          if (customerForQuote) {
            console.log(`[PricebookPage] Setting customer: ${customerForQuote.id} for quote: ${quoteId}`);
            setCurrentCustomer(customerForQuote);
          }
        }
        
        // Make sure sidebar is visible
        setIsQuoteSidebarVisible(true);
      } else {
        console.log(`[PricebookPage] Quote not found in currently loaded quotes: ${quoteId}`);
        
        // Try to fetch the quote from Supabase
        try {
          const fetchedQuote = await getQuoteById(quoteId);
          
          if (!fetchedQuote) {
            console.error(`Quote ${quoteId} not found in database`);
            toast({
              variant: "destructive",
              title: "Quote Not Found",
              description: "The requested quote could not be found in the database."
            });
            return;
          }
          
          console.log(`[PricebookPage] Quote loaded from database: ${fetchedQuote.id}`);
          
          // Find customer for this quote
          const customerForQuote = allCustomers.find(c => c.id === fetchedQuote.customerId);
          
          if (!customerForQuote) {
            console.warn(`Customer ${fetchedQuote.customerId} for quote ${quoteId} not found`);
            toast({
              variant: "destructive",
              title: "Customer Not Found",
              description: "The customer associated with this quote could not be found."
            });
            return;
          }
          
          // Transform from QuoteContext.Quote to our local Quote type
          // We need to handle potential differences in the structure
          const transformedQuote: Quote = {
            id: fetchedQuote.id,
            quoteNumber: fetchedQuote.quoteNumber,
            sequenceNumber: fetchedQuote.sequenceNumber,
            name: fetchedQuote.name,
            customerId: fetchedQuote.customerId,
            status: fetchedQuote.status,
            selectedTierId: fetchedQuote.selectedTierId,
            totalPrice: fetchedQuote.totalPrice,
            createdAt: fetchedQuote.createdAt,
            updatedAt: fetchedQuote.updatedAt,
            sentAt: fetchedQuote.sentAt,
            acceptedAt: fetchedQuote.acceptedAt,
            // Transform tierTasks - handle potential differences in QuoteTask and Addon structures
            tierTasks: Object.entries(fetchedQuote.tierTasks || {}).reduce((acc, [tierId, tasks]) => {
              acc[tierId] = tasks.map(task => ({
                taskId: task.taskId,
                originalServiceId: task.originalServiceId,
                name: task.name,
                description: task.description,
                basePrice: task.basePrice,
                quantity: task.quantity,
                category: task.category,
                // Transform addons to match the local Addon type
                addons: task.addons?.map(addon => ({
                  addonId: addon.id,
                  name: addon.name,
                  price: addon.price
                }))
              }));
              return acc;
            }, {} as Record<string, QuoteTask[]>),
            // Transform adjustments
            adjustments: (fetchedQuote.adjustments || []).map(adj => ({
              adjustmentId: adj.id,
              description: adj.description,
              value: adj.amount, // Assuming amount maps to value
              amount: adj.amount,
              type: adj.type === 'percentage' ? 'percentage' : 'manual'
            }))
          };
          
          // Update state in the correct order
          setCurrentCustomer(customerForQuote);
          
          // Add the transformed quote to our local state
          setCustomerQuotes(prev => {
            // Don't add duplicates
            if (prev.some(q => q.id === transformedQuote.id)) return prev;
            return [...prev, transformedQuote];
          });
          
          // Then select it
          setCurrentQuoteId(transformedQuote.id);
          
          // Make sure sidebar is visible
          setIsQuoteSidebarVisible(true);
          
          toast({
            title: "Quote Loaded",
            description: `Quote has been loaded for editing.`
          });
        } catch (error) {
          console.error("Error loading quote from database:", error);
          toast({
            variant: "destructive",
            title: "Error Loading Quote",
            description: "There was a problem loading this quote. Please try again."
          });
        }
      }
    };
    
    // Run the function
    findAndSelectQuote();
    
  }, [searchParams, location.search, customerQuotes, allCustomers, currentCustomer, getQuoteById, toast, setCurrentQuoteId, setCurrentCustomer, setCustomerQuotes, setIsQuoteSidebarVisible]);

  // --- Return JSX ---
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  const DebugPanel = () => {
    if (!showDebugPanel) return null;
    
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-black/90 text-white p-4 rounded-md shadow-lg max-w-md max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold">Debug Info</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-white hover:bg-white/20" 
            onClick={() => setShowDebugPanel(false)}
          >Close</Button>
        </div>
        <div className="space-y-2">
          <div>
            <span className="font-semibold">Current Quote ID:</span> 
            <span className="ml-2 px-2 py-1 bg-primary/20 rounded-md">{currentQuoteId || 'None'}</span>
          </div>
          <div>
            <span className="font-semibold">Current Customer:</span> 
            <span className="ml-2">{currentCustomer?.name || 'None'}</span>
          </div>
          <div>
            <span className="font-semibold">Loaded Quotes:</span> 
            <span className="ml-2">{customerQuotes.length}</span>
          </div>
          <div className="mt-4">
            <span className="font-semibold">Quote IDs:</span>
            <div className="ml-2 mt-1 space-y-1">
              {customerQuotes.map(q => (
                <div 
                  key={q.id} 
                  className={`px-2 py-1 rounded-md ${q.id === currentQuoteId ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                  onClick={() => handleQuoteSelect(q.id)}
                >
                  {q.id} - {q.quoteNumber}: {q.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <TooltipProvider>
      <div className={`flex h-screen bg-background ${mainMenuOpen ? 'overflow-hidden' : ''}`}>
          {/* Main Menu Overlay - Conditionally Rendered */}
          {mainMenuOpen && (
              <div
                  className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
                  onClick={() => setMainMenuOpen(false)} // Close on overlay click
                  style={{ animationDuration: '200ms' }} // Adjust duration as needed
              ></div>
          )}

          {/* Dashboard Menu - Always Rendered, controlled by state */}
        <DashboardMenu isOpen={mainMenuOpen} onClose={() => setMainMenuOpen(false)} />
        
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
              {/* Header */}
              <header className="h-14 flex items-center gap-4 border-b bg-muted/40 px-6 sticky top-0 z-30">
                  {/* Hamburger Menu for Mobile/Tablet */}
                  <Button
                      variant="ghost"
                      size="icon"
                      className="lg:hidden -ml-4" // Hide on large screens
                      onClick={() => setMainMenuOpen(true)}
                      aria-label="Toggle Menu"
                  >
                      <Menu className="h-6 w-6" />
                  </Button>

                  {/* Search Bar - Removed from header as it's now in category sidebar */}
                  <div className="flex-1"></div>

                  {/* Header Actions Area */}
                  <div className="flex items-center gap-2 ml-auto">
                      {/* Remove Save and Publish buttons */}
                      {/* <Button size="sm" variant="outline">Save Draft</Button> */}
                      {/* <Button size="sm">Publish Quote</Button> */}
                      {/* Theme Toggle */}
                      <ThemeToggle />
                      {/* Sidebar Toggle Button */}
                      <Tooltip>
                          <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
                                  onClick={handleToggleQuoteSidebar}
                                  className="h-8 w-8" // Consistent size
                                  aria-label={isQuoteSidebarVisible ? "Hide Quote Panel" : "Show Quote Panel"}
          >
                                  {isQuoteSidebarVisible ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
          </Button>
                          </TooltipTrigger>
                           <TooltipContent side="bottom">
                              <p>{isQuoteSidebarVisible ? "Hide Quote Panel" : "Show Quote Panel"}</p>
                          </TooltipContent>
                      </Tooltip>
                      {/* Removed Undo/Redo buttons from header */}
                  </div>
              </header>

              {/* Main Content Body */}
              <main className="flex-1 flex overflow-hidden">
                  {/* --- Category Sidebar (Resizable) --- */}
                  <div
                    ref={categorySidebarRef} // Add ref
                    className={cn(
                      "h-full bg-card border-r transition-none duration-300 ease-in-out flex flex-col relative flex-shrink-0" // Use transition-none during resize, add relative
                    )}
                    style={{ width: `${categorySidebarWidth}px` }} // Apply dynamic width
                    // onMouseEnter={() => handleSidebarHover(true)} // Consider removing hover effects if resizing
                    // onMouseLeave={() => handleSidebarHover(false)}
                  >
                      {/* Category Resize Handle (Right side) */}
                      <div 
                        onMouseDown={handleCategoryMouseDown}
                        className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize bg-transparent hover:bg-border/50 transition-colors duration-200 z-10"
                        title="Drag to resize"
                      />
                      {/* Sidebar Header */}
                      <div
                        className={cn(
                          "flex items-center border-b transition-all duration-300 ease-in-out h-[57px]", 
                          "justify-between",
                          "px-4",
                          "sticky top-0 bg-card z-10 flex-shrink-0" 
                        )}
                      >
                        {/* Add Menu Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="-ml-1 mr-2 h-8 w-8" // Adjust margin as needed
                          onClick={() => setMainMenuOpen(true)}
                          aria-label="Toggle Menu"
                        >
                          <Menu className="h-5 w-5" />
                        </Button>
                        {/* Categories Title */}
                        <h2 className="font-semibold transition-opacity duration-200 text-lg flex-grow">
                          Categories
                        </h2>
                        {/* Add Custom Task Button */}
                        <Tooltip>
                           <TooltipTrigger asChild>
                                  <div className={!currentQuoteId ? 'cursor-not-allowed' : ''}> {/* Wrapper for disabled state tooltip */}
                         <Button 
                                            variant="ghost"
                                   size="icon" 
                                  className="h-8 w-8" // Smaller icon button
                                   onClick={handleOpenCustomTaskDialog}
                                   disabled={!currentQuoteId}
                                  style={!currentQuoteId ? { pointerEvents: 'none' } : {}} // Ensure tooltip works when disabled
                         >
                                   <ClipboardPlus className="h-4 w-4" />
                                 </Button>
                               </div>
                             </TooltipTrigger>
                                <TooltipContent side="bottom">
                                    <p>{currentQuoteId ? 'Add Custom Task' : 'Select a quote first'}</p>
                             </TooltipContent>
                           </Tooltip>
                        </div>

                        {/* Category Search - Added below the header */}
                        <div className="p-3 border-b">
                          <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="search"
                              placeholder="Search categories..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="pl-8 h-9 w-full"
                            />
                          </div>
                        </div>

                        {/* Category List */}
                        <ScrollArea className="flex-grow overflow-y-auto">
                           {searchQuery.trim() === '' ? (
                                  // Show all categories if not searching
                         serviceCategories.map((category) => (
                           <button
                             key={category.id}
                             className={cn(
                               "w-full text-left p-3 hover:bg-accent transition-colors duration-150 flex items-center gap-3",
                               selectedCategory?.id === category.id ? "bg-accent font-semibold" : "", // Use optional chaining and compare IDs
                                                // Adjust display based on hover/open state if needed
                             )}
                             onClick={() => handleCategorySelect(category.id)} // Keep using handleCategorySelect here
                           >
                                 <category.icon className={cn("h-5 w-5", category.color)} />
                                     <span className="truncate text-sm">{category.name}</span>
                               </button>
                             ))
                         ) : (
                                  // Show search results if searching
                                  searchResults.categories.length === 0 && searchResults.services.length === 0 ? (
                                    <div className="p-4 text-center text-sm text-muted-foreground">No results found.</div>
                                  ) : (
                                    searchResults.categories.map((category) => (
                               <button
                                  key={category.id}
                                            className={cn(
                                                "w-full text-left p-3 hover:bg-accent transition-colors duration-150 flex items-center gap-3",
                                                selectedCategory?.id === category.id ? "bg-accent font-semibold" : "", // Highlight if selected even in search results
                                                " " // Always show text
                                            )}
                                            onClick={() => handleCategorySelect(category.id)} // Keep using handleCategorySelect here
                                            title={category.name}
                                  >
                                    <category.icon className={cn("h-5 w-5", category.color)} />
                                            <span className="truncate text-sm">{category.name}</span>
                               </button>
                                  ))
                                  // Do not show matched services in the category list
                                )
                            )}
                        </ScrollArea>
                      </div>
                  {/* --- End Category Sidebar --- */}

                  {/* Price Book Services (Main Area) */}
                  <div className="flex-1 overflow-y-auto p-6">
                      { /* Display services based on selected category or search */ }
                      {selectedCategory || (searchQuery && searchResults.services.length > 0) ? (
                <CategoryView
                              services={filteredServices} // Use filtered services
                  tiers={availableTiers} 
                  selectedTierId={currentQuote?.selectedTierId || null}
                              onAddToQuote={handleAddToQuoteMultiTier} // Use the multi-tier adder
                              onAddOrIncrementTask={handleAddOrIncrementTask} // Use the unified handler
                              onQuickAddToQuote={handleQuickAddToQuote} // Use the quick add handler
                              onToggleFavorite={handleToggleFavorite} // Pass down the favorite handler
                          />
                      ) : (
                          <div className="flex h-full items-center justify-center text-muted-foreground">
                              {searchQuery ? "No services match your search." : "Select a category to view services."}
              </div>
            )}
                  </div>

                  {/* Quote Sidebar (Right) */}
                  {isQuoteSidebarVisible && (
                      <CurrentQuoteSidebar
                        quotes={customerQuotes}
                        currentQuoteId={currentQuoteId}
                        customer={currentCustomer}
                        availableTiers={availableTiers}
                        _allCustomers={allCustomers} // Pass all customers for selection
                        onQuoteSelect={handleQuoteSelect}
                        onTierSelect={handleTierSelect}
                        onDeleteTask={handleDeleteTask} // Pass down
                        onAddTier={handleAddTier}
                        onDeleteTier={handleDeleteTier}
                        onRenameTier={handleRenameTier}
                        onPreviewQuote={handlePreviewQuote}
                        onUpdateCustomer={handleUpdateCustomer} // <<< Should now be found
                        onCustomerSelect={handleCustomerSelect} // Pass down
                        onAddQuote={handleAddQuote} // Pass down
                        onDeleteQuote={handleDeleteQuote} // Pass down
                        onRenameQuote={handleRenameQuote} // Pass down
                        onUpdateTask={handleUpdateTask} // Pass down
                        onUpdateAllTasks={handleUpdateAllTasks} // Pass down
                        onReorderTasks={handleReorderTasks} // Pass down
                        onDuplicateTier={handleDuplicateTier} // Pass down
                        onClearAllTasks={handleClearAllTasks} // Pass down
                        onDeleteAllQuotes={handleDeleteAllQuotes} // Pass down
                        onDuplicateQuote={handleDuplicateQuote} // Pass down
                        onDeleteAllTiers={handleDeleteAllTiers} // Pass down
                        _isLoadingCustomers={isLoadingCustomers} // Add this prop
                      />
                      )}
              </main>
        </div>

         {/* Custom Task Dialog */}
        <AddCustomTaskDialog 
          isOpen={isCustomTaskDialogOpen}
          onOpenChange={setIsCustomTaskDialogOpen}
          availableTiers={availableTiers}
          currentQuoteSelectedTierId={currentQuote?.selectedTierId || null}
            onAddCustomTask={handleAddCustomTask} // Use the correct handler
            onSaveTaskToLibrary={handleSaveTaskToLibrary} // Pass the placeholder save function
          />
          <AddCustomerDialog
            isOpen={isAddCustomerDialogOpen}
            onOpenChange={setIsAddCustomerDialogOpen}
            onSubmit={handleAddNewCustomer}
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="fixed bottom-4 left-4 z-50 h-10 w-10 rounded-full bg-muted"
                onClick={() => setShowDebugPanel(!showDebugPanel)}
              >
                <Bug className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Toggle Debug Panel</p>
            </TooltipContent>
          </Tooltip>
          <DebugPanel />
      </div>
    </TooltipProvider>
  );
}
