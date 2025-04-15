import React, { createContext, useContext, useState, useEffect } from 'react';
import { Customer } from '@/types/quote';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface CustomerContextType {
  allCustomers: Customer[];
  customersWithStats: Array<Customer & { totalQuotes: number; lastQuoteDate: string | null }>;
  selectedCustomer: Customer | null;
  isLoadingCustomers: boolean;
  refreshCustomers: () => Promise<void>;
  searchCustomers: (query: string) => Customer[];
  selectCustomer: (id: string) => void;
  createCustomer: (customer: Omit<Customer, 'id'>) => Promise<string>;
  updateCustomer: (updatedCustomer: Customer) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  getCustomerById: (id: string) => Customer | null;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export function CustomerProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const { toast } = useToast();
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [customersWithStats, setCustomersWithStats] = useState<Array<Customer & { totalQuotes: number; lastQuoteDate: string | null }>>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setIsAuthenticated(!!data.session);
      
      // Subscribe to auth changes
      const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        setIsAuthenticated(!!session);
      });
      
      // Cleanup
      return () => {
        authListener.subscription.unsubscribe();
      };
    };
    
    checkAuth();
  }, []);

  const refreshCustomers = async (): Promise<void> => {
    // Prevent multiple simultaneous refresh calls
    if (isRefreshing) {
      console.log("Already refreshing customers, skipping this call");
      return;
    }
    
    setIsRefreshing(true);
    setIsLoadingCustomers(true);
    
    try {
      if (!isAuthenticated) {
        console.warn('Cannot fetch customers: User not authenticated');
        setAllCustomers([]);
        setCustomersWithStats([]);
        setIsLoadingCustomers(false);
        setIsRefreshing(false);
        return;
      }
      
      console.log("Fetching customers...");
      
      const { data, error } = await supabase
        .from('customers')
        .select('*');
      
      console.log("Customer data response:", data ? data.length : 0, "customers found");
      
      if (error) throw error;
      
      // If data is null or empty, but we know it shouldn't be (and the user is authenticated), retry once
      if ((!data || data.length === 0) && isAuthenticated) {
        console.log("No customers found but user is authenticated, retrying in 1 second...");
        
        // Wait 1 second before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const retryResponse = await supabase
          .from('customers')
          .select('*');
          
        if (retryResponse.error) throw retryResponse.error;
        if (retryResponse.data) {
          console.log("Retry successful, found", retryResponse.data.length, "customers");
          setAllCustomers(retryResponse.data);
        }
      } else {
        setAllCustomers(data || []);
      }
      
      // Fetch customer stats from view
      const { data: customerStats, error: statsError } = await supabase
        .from('customer_stats')
        .select('*');
        
      if (statsError) throw statsError;
      
      // Combine customers with their stats
      const customersWithStatsData = allCustomers.map(customer => {
        const stats = customerStats?.find(stat => stat.customerId === customer.id);
        return {
          ...customer,
          totalQuotes: stats?.totalQuotes || 0,
          lastQuoteDate: stats?.lastQuoteDate || null
        };
      });
      
      setCustomersWithStats(customersWithStatsData);
    } catch (error: any) {
      console.error('Error fetching customers:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to load customers',
        description: error.message || 'An unexpected error occurred'
      });
    } finally {
      setIsLoadingCustomers(false);
      setIsRefreshing(false);
    }
  };
  
  useEffect(() => {
    if (isAuthenticated) {
      refreshCustomers();
    }
  }, [isAuthenticated]);

  const searchCustomers = (query: string): Customer[] => {
    if (!query.trim()) return allCustomers;
    
    const lowerQuery = query.toLowerCase();
    return allCustomers.filter(customer => 
      (customer.name?.toLowerCase().includes(lowerQuery) ||
      customer.email?.toLowerCase().includes(lowerQuery) ||
      customer.phone?.includes(query) ||
      customer.mobile_phone?.includes(query))
    );
  };

  const selectCustomer = (id: string): void => {
    const customer = allCustomers.find(c => c.id === id);
    setSelectedCustomer(customer || null);
  };
  
  const createCustomer = async (customer: Omit<Customer, 'id'>): Promise<string> => {
    try {
      if (!isAuthenticated) {
        throw new Error('You must be logged in to create a customer');
      }
      
      console.log('Creating customer with data:', JSON.stringify(customer, null, 2));
      
      // Now we can include all fields as the schema has been updated
      const formattedCustomer = {
        name: customer.name,
        email: customer.email || null,
        phone: customer.phone || null,
        mobile_phone: customer.mobile_phone || null,
        billing_address: customer.billing_address || null
      };
      
      const { data, error } = await supabase
        .from('customers')
        .insert(formattedCustomer)
        .select('id')
        .single();
        
      if (error) {
        console.error('Supabase error creating customer:', error);
        throw new Error(`Database error: ${error.message || 'Unknown error'}`);
      }
      
      if (!data || !data.id) {
        throw new Error('Failed to get ID from created customer');
      }
      
      toast({
        title: 'Customer Created',
        description: `Successfully created customer: ${customer.name}`
      });
      
      await refreshCustomers();
      return data.id;
    } catch (error: any) {
      console.error('Error creating customer:', error);
      
      // Provide more descriptive error message
      let errorMessage = 'An unexpected error occurred';
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.error_description) {
        errorMessage = error.error_description;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast({
        variant: 'destructive',
        title: 'Failed to create customer',
        description: errorMessage
      });
      
      throw error;
    }
  };

  const updateCustomer = async (updatedCustomer: Customer): Promise<void> => {
    try {
      const { error } = await supabase
        .from('customers')
        .update(updatedCustomer)
        .eq('id', updatedCustomer.id);
        
      if (error) throw error;
      
      // Update local state
      setAllCustomers(prev => 
        prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c)
      );
      
      // If the updated customer is currently selected, update the selection too
      if (selectedCustomer?.id === updatedCustomer.id) {
        setSelectedCustomer(updatedCustomer);
      }
      
      await refreshCustomers();
    } catch (error: any) {
      console.error('Error updating customer:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to update customer',
        description: error.message || 'An unexpected error occurred'
      });
      throw error;
    }
  };
  
  const deleteCustomer = async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Update local state
      setAllCustomers(prev => prev.filter(c => c.id !== id));
      
      // If the deleted customer is currently selected, clear selection
      if (selectedCustomer?.id === id) {
        setSelectedCustomer(null);
      }
      
      await refreshCustomers();
    } catch (error: any) {
      console.error('Error deleting customer:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to delete customer',
        description: error.message || 'An unexpected error occurred'
      });
      throw error;
    }
  };

  const getCustomerById = (id: string): Customer | null => {
    if (!id) return null;
    return allCustomers.find(customer => customer.id === id) || null;
  };

  const contextValue: CustomerContextType = {
    allCustomers,
    customersWithStats,
    selectedCustomer,
    isLoadingCustomers,
    refreshCustomers,
    searchCustomers,
    selectCustomer,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerById,
  };

  return (
    <CustomerContext.Provider value={contextValue}>
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomers(): CustomerContextType {
  const context = useContext(CustomerContext);
  if (context === undefined) {
    throw new Error('useCustomers must be used within a CustomerProvider');
  }
  return context;
} 