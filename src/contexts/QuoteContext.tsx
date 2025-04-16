import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

// Types
export interface Quote {
  id: string;
  quoteNumber: string;
  sequenceNumber: number;
  name: string;
  customerId: string;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Declined';
  tierTasks: Record<string, QuoteTask[]>;
  selectedTierId: string | null;
  adjustments: QuoteAdjustment[];
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
  acceptedAt?: string;
}

export interface QuoteTask {
  taskId: string;
  originalServiceId?: string;
  name: string;
  description: string;
  basePrice: number;
  quantity?: number;
  addons?: QuoteTaskAddon[];
  category?: string;
}

export interface QuoteTaskAddon {
  id: string;
  name: string;
  price: number;
}

export interface QuoteAdjustment {
  id: string;
  description: string;
  amount: number;
  type: 'fixed' | 'percentage';
}

// Context type
interface QuoteContextType {
  isLoading: boolean;
  error: string | null;
  quotes: Quote[];
  refreshQuotes: () => Promise<void>;
  getCustomerQuotes: (customerId: string) => Quote[];
  countCustomerQuotes: (customerId: string) => number;
  getLastQuoteDate: (customerId: string) => string | null;
  createQuote: (quote: Omit<Quote, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateQuote: (quoteId: string, updates: Partial<Quote>) => Promise<void>;
  deleteQuote: (quoteId: string) => Promise<void>;
  getQuoteById: (quoteId: string) => Promise<Quote | null>;
  getTiersForQuote: (quoteId: string) => Promise<any[]>;
}

// Create context
const QuoteContext = createContext<QuoteContextType | undefined>(undefined);

// Provider component
export function QuoteProvider({ children }: { children: ReactNode }) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch all quotes on load
  useEffect(() => {
    refreshQuotes();
  }, []);

  // Refresh quotes from Supabase
  const refreshQuotes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('quote_details')
        .select('*')
        .order('updatedAt', { ascending: false });

      if (error) throw error;

      if (data) {
        // Transform data if needed
        setQuotes(data as Quote[]);
      }
    } catch (error: any) {
      console.error('Error fetching quotes:', error);
      setError(error.message || 'Failed to fetch quotes');
      toast({
        variant: 'destructive',
        title: 'Error loading quotes',
        description: error.message || 'Failed to fetch quotes',
      });
      // Fallback to empty array
      setQuotes([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Get quotes for a specific customer
  const getCustomerQuotes = (customerId: string) => {
    return quotes.filter((quote) => quote.customerId === customerId);
  };

  // Count quotes for a specific customer
  const countCustomerQuotes = (customerId: string) => {
    return getCustomerQuotes(customerId).length;
  };

  // Get the date of the last quote for a customer
  const getLastQuoteDate = (customerId: string) => {
    const customerQuotes = getCustomerQuotes(customerId);
    if (customerQuotes.length === 0) return null;
    
    // Sort by updatedAt and get the most recent
    const sortedQuotes = [...customerQuotes].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    
    return sortedQuotes[0].updatedAt;
  };

  // Create a new quote
  const createQuote = async (quoteData: Omit<Quote, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const now = new Date().toISOString();
      
      // Transform from our frontend format to database format
      const dbQuoteData = {
        quote_number: quoteData.quoteNumber,
        sequence_number: quoteData.sequenceNumber,
        name: quoteData.name || null,
        customer_id: quoteData.customerId,
        status: quoteData.status,
        selected_tier_id: quoteData.selectedTierId,
        total_price: quoteData.totalPrice,
        created_at: now,
        updated_at: now,
      };

      const { data, error } = await supabase
        .from('quotes')
        .insert([dbQuoteData])
        .select('id')
        .single();

      if (error) throw error;

      if (!data || !data.id) {
        throw new Error('Failed to create quote - no ID returned');
      }
      
      // Add tasks if they exist
      if (quoteData.tierTasks && Object.keys(quoteData.tierTasks).length > 0) {
        for (const tierId in quoteData.tierTasks) {
          const tasks = quoteData.tierTasks[tierId];
          
          for (const task of tasks) {
            // Insert task
            const dbTaskData = {
              quote_id: data.id,
              tier_id: tierId,
              task_id: task.taskId || null,
              original_service_id: task.originalServiceId || null,
              name: task.name,
              description: task.description || null,
              base_price: task.basePrice,
              quantity: task.quantity || 1,
              category: task.category || null,
            };
            
            const { data: taskData, error: taskError } = await supabase
              .from('quote_tasks')
              .insert([dbTaskData])
              .select('id')
              .single();
              
            if (taskError) throw taskError;
            
            // Insert addons if they exist
            if (task.addons && task.addons.length > 0 && taskData.id) {
              const addonInserts = task.addons.map(addon => ({
                quote_task_id: taskData.id,
                name: addon.name,
                price: addon.price
              }));
              
              const { error: addonError } = await supabase
                .from('quote_task_addons')
                .insert(addonInserts);
                
              if (addonError) throw addonError;
            }
          }
        }
      }
      
      // Add adjustments if they exist
      if (quoteData.adjustments && quoteData.adjustments.length > 0) {
        const adjustmentInserts = quoteData.adjustments.map(adjustment => ({
          quote_id: data.id,
          description: adjustment.description,
          amount: adjustment.amount,
          type: adjustment.type
        }));
        
        const { error: adjustmentError } = await supabase
          .from('quote_adjustments')
          .insert(adjustmentInserts);
          
        if (adjustmentError) throw adjustmentError;
      }
      
      // Refresh quotes to get the latest data
      await refreshQuotes();
      
      toast({
        title: 'Quote Created',
        description: 'Quote has been successfully created.'
      });
      
      return data.id;
    } catch (error: any) {
      console.error('Error creating quote:', error);
      toast({
        variant: 'destructive',
        title: 'Error creating quote',
        description: error.message || 'Failed to create quote',
      });
      throw error;
    }
  };

  // Update an existing quote
  const updateQuote = async (quoteId: string, updates: Partial<Quote>) => {
    try {
      // Transform from our frontend format to database format
      const dbUpdates: Record<string, any> = {};
      
      if (updates.quoteNumber !== undefined) dbUpdates.quote_number = updates.quoteNumber;
      if (updates.sequenceNumber !== undefined) dbUpdates.sequence_number = updates.sequenceNumber;
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.customerId !== undefined) dbUpdates.customer_id = updates.customerId;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.selectedTierId !== undefined) dbUpdates.selected_tier_id = updates.selectedTierId;
      if (updates.totalPrice !== undefined) dbUpdates.total_price = updates.totalPrice;
      if (updates.sentAt !== undefined) dbUpdates.sent_at = updates.sentAt;
      if (updates.acceptedAt !== undefined) dbUpdates.accepted_at = updates.acceptedAt;
      
      // Always update the updated_at timestamp
      dbUpdates.updated_at = new Date().toISOString();

      // Update the quote
      const { error } = await supabase
        .from('quotes')
        .update(dbUpdates)
        .eq('id', quoteId);

      if (error) throw error;
      
      // Handle tier tasks updates if provided
      if (updates.tierTasks) {
        // First, delete existing tasks for this quote
        const { error: deleteTasksError } = await supabase
          .from('quote_tasks')
          .delete()
          .eq('quote_id', quoteId);
          
        if (deleteTasksError) throw deleteTasksError;
        
        // Then add the new tasks
        for (const tierId in updates.tierTasks) {
          const tasks = updates.tierTasks[tierId];
          
          for (const task of tasks) {
            // Insert task
            const dbTaskData = {
              quote_id: quoteId,
              tier_id: tierId,
              task_id: task.taskId || null,
              original_service_id: task.originalServiceId || null,
              name: task.name,
              description: task.description || null,
              base_price: task.basePrice,
              quantity: task.quantity || 1,
              category: task.category || null,
            };
            
            const { data: taskData, error: taskError } = await supabase
              .from('quote_tasks')
              .insert([dbTaskData])
              .select('id')
              .single();
              
            if (taskError) throw taskError;
            
            // Insert addons if they exist
            if (task.addons && task.addons.length > 0 && taskData.id) {
              const addonInserts = task.addons.map(addon => ({
                quote_task_id: taskData.id,
                name: addon.name,
                price: addon.price
              }));
              
              const { error: addonError } = await supabase
                .from('quote_task_addons')
                .insert(addonInserts);
                
              if (addonError) throw addonError;
            }
          }
        }
      }
      
      // Handle adjustments updates if provided
      if (updates.adjustments) {
        // First, delete existing adjustments for this quote
        const { error: deleteAdjustmentsError } = await supabase
          .from('quote_adjustments')
          .delete()
          .eq('quote_id', quoteId);
          
        if (deleteAdjustmentsError) throw deleteAdjustmentsError;
        
        // Then add the new adjustments
        if (updates.adjustments.length > 0) {
          const adjustmentInserts = updates.adjustments.map(adjustment => ({
            quote_id: quoteId,
            description: adjustment.description,
            amount: adjustment.amount,
            type: adjustment.type
          }));
          
          const { error: adjustmentError } = await supabase
            .from('quote_adjustments')
            .insert(adjustmentInserts);
            
          if (adjustmentError) throw adjustmentError;
        }
      }

      // Refresh quotes to get the latest data
      await refreshQuotes();

      toast({
        title: 'Quote Updated',
        description: 'Quote has been successfully updated.',
      });
    } catch (error: any) {
      console.error('Error updating quote:', error);
      toast({
        variant: 'destructive',
        title: 'Error updating quote',
        description: error.message || 'Failed to update quote',
      });
      throw error;
    }
  };

  // Delete a quote
  const deleteQuote = async (quoteId: string) => {
    try {
      // Due to ON DELETE CASCADE constraints, deleting the quote
      // will automatically delete all related tasks, addons, and adjustments
      const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', quoteId);

      if (error) throw error;

      // Refresh quotes to get the latest data
      await refreshQuotes();

      toast({
        title: 'Quote Deleted',
        description: 'Quote has been successfully deleted.',
      });
    } catch (error: any) {
      console.error('Error deleting quote:', error);
      toast({
        variant: 'destructive',
        title: 'Error deleting quote',
        description: error.message || 'Failed to delete quote',
      });
      throw error;
    }
  };

  // Get a quote by ID
  const getQuoteById = async (quoteId: string): Promise<Quote | null> => {
    try {
      // First check if it's already in our state
      const cachedQuote = quotes.find(q => q.id === quoteId);
      if (cachedQuote) return cachedQuote;

      // If not, fetch it from the database
      const { data, error } = await supabase
        .from('quote_details')
        .select('*')
        .eq('id', quoteId)
        .single();

      if (error) throw error;
      
      return data as Quote;
    } catch (error: any) {
      console.error(`Error fetching quote ${quoteId}:`, error);
      toast({
        variant: 'destructive',
        title: 'Error loading quote',
        description: error.message || 'Failed to fetch quote details',
      });
      return null;
    }
  };

  // Get tiers for a quote
  const getTiersForQuote = async (quoteId: string) => {
    try {
      // Try to get from the quote first (if available)
      const quote = await getQuoteById(quoteId);
      if (quote && quote.tierTasks) {
        // Extract tier IDs from the quote
        const tierIds = Object.keys(quote.tierTasks);
        
        if (tierIds.length === 0) return [];
        
        // Fetch tier details
        const { data, error } = await supabase
          .from('tiers')
          .select('*')
          .in('id', tierIds);
          
        if (error) throw error;
        
        return data || [];
      }
      
      return [];
    } catch (error: any) {
      console.error(`Error fetching tiers for quote ${quoteId}:`, error);
      toast({
        variant: 'destructive',
        title: 'Error loading tiers',
        description: error.message || 'Failed to fetch tier details',
      });
      return [];
    }
  };

  const value = {
    isLoading,
    error,
    quotes,
    refreshQuotes,
    getCustomerQuotes,
    countCustomerQuotes,
    getLastQuoteDate,
    createQuote,
    updateQuote,
    deleteQuote,
    getQuoteById,
    getTiersForQuote,
  };

  return <QuoteContext.Provider value={value}>{children}</QuoteContext.Provider>;
}

// Hook to use the quote context
export function useQuotes() {
  const context = useContext(QuoteContext);
  if (context === undefined) {
    throw new Error('useQuotes must be used within a QuoteProvider');
  }
  return context;
} 