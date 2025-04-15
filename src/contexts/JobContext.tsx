import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useCustomers } from './CustomerContext';

// Types
export interface Job {
  id: string;
  jobNumber: string;
  sequenceNumber: number;
  name: string;
  customerId: string;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Declined';
  tierTasks: Record<string, JobTask[]>;
  selectedTierId: string | null;
  adjustments: JobAdjustment[];
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
  acceptedAt?: string;
}

export interface JobTask {
  taskId: string;
  originalServiceId?: string;
  name: string;
  description: string;
  basePrice: number;
  quantity?: number;
  addons?: JobTaskAddon[];
  category?: string;
}

export interface JobTaskAddon {
  id: string;
  name: string;
  price: number;
}

export interface JobAdjustment {
  id: string;
  description: string;
  amount: number;
  type: 'fixed' | 'percentage';
}

// Context type
interface JobContextType {
  isLoading: boolean;
  error: string | null;
  jobs: Job[];
  refreshJobs: () => Promise<void>;
  getCustomerJobs: (customerId: string) => Job[];
  countCustomerJobs: (customerId: string) => number;
  getLastJobDate: (customerId: string) => string | null;
  createJob: (job: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateJob: (jobId: string, updates: Partial<Job>) => Promise<void>;
  deleteJob: (jobId: string) => Promise<void>;
  getJobById: (jobId: string) => Promise<Job | null>;
  getTiersForJob: (jobId: string) => Promise<any[]>;
}

// Create context
const JobContext = createContext<JobContextType | undefined>(undefined);

// Provider component
export function JobsProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { allCustomers } = useCustomers();

  // Fetch all jobs on load
  useEffect(() => {
    refreshJobs();
  }, []);

  // Refresh jobs from Supabase
  const refreshJobs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Note: Database table names likely still use 'quote' since they haven't been renamed yet
      const { data, error } = await supabase
        .from('quote_details')
        .select('*')
        .order('updatedAt', { ascending: false });

      if (error) throw error;

      if (data) {
        // Transform data - need to map database fields to our new job property names
        const transformedData = data.map((item: any) => ({
          id: item.id,
          jobNumber: item.quoteNumber || item.quote_number,
          sequenceNumber: item.sequenceNumber || item.sequence_number,
          name: item.name,
          customerId: item.customerId || item.customer_id,
          status: item.status,
          tierTasks: item.tierTasks || {},
          selectedTierId: item.selectedTierId || item.selected_tier_id,
          adjustments: item.adjustments || [],
          totalPrice: item.totalPrice || item.total_price,
          createdAt: item.createdAt || item.created_at,
          updatedAt: item.updatedAt || item.updated_at,
          sentAt: item.sentAt || item.sent_at,
          acceptedAt: item.acceptedAt || item.accepted_at
        }));
        
        setJobs(transformedData);
      }
    } catch (error: any) {
      console.error('Error fetching jobs:', error);
      setError(error.message || 'Failed to fetch jobs');
      toast({
        variant: 'destructive',
        title: 'Error loading jobs',
        description: error.message || 'Failed to fetch jobs',
      });
      // Fallback to empty array
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Get jobs for a specific customer
  const getCustomerJobs = (customerId: string) => {
    return jobs.filter((job) => job.customerId === customerId);
  };

  // Count jobs for a specific customer
  const countCustomerJobs = (customerId: string) => {
    return getCustomerJobs(customerId).length;
  };

  // Get the date of the last job for a customer
  const getLastJobDate = (customerId: string) => {
    const customerJobs = getCustomerJobs(customerId);
    if (customerJobs.length === 0) return null;
    
    // Sort by updatedAt and get the most recent
    const sortedJobs = [...customerJobs].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    
    return sortedJobs[0].updatedAt;
  };

  // Create a new job
  const createJob = async (jobData: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const now = new Date().toISOString();
      
      // Transform from our frontend format to database format (using existing table names)
      const dbJobData = {
        quote_number: jobData.jobNumber,
        sequence_number: jobData.sequenceNumber,
        name: jobData.name || null,
        customer_id: jobData.customerId,
        status: jobData.status,
        selected_tier_id: jobData.selectedTierId,
        total_price: jobData.totalPrice,
        created_at: now,
        updated_at: now,
      };

      // Note: Database table names still use 'quotes' since they haven't been renamed yet
      const { data, error } = await supabase
        .from('quotes')
        .insert([dbJobData])
        .select('id')
        .single();

      if (error) throw error;

      if (!data || !data.id) {
        throw new Error('Failed to create job - no ID returned');
      }
      
      // Add tasks if they exist
      if (jobData.tierTasks && Object.keys(jobData.tierTasks).length > 0) {
        for (const tierId in jobData.tierTasks) {
          const tasks = jobData.tierTasks[tierId];
          
          for (const task of tasks) {
            // Insert task
            const dbTaskData = {
              quote_id: data.id, // Still using quote_id in database
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
      if (jobData.adjustments && jobData.adjustments.length > 0) {
        const adjustmentInserts = jobData.adjustments.map(adjustment => ({
          quote_id: data.id, // Still using quote_id in database
          description: adjustment.description,
          amount: adjustment.amount,
          type: adjustment.type
        }));
        
        const { error: adjustmentError } = await supabase
          .from('quote_adjustments')
          .insert(adjustmentInserts);
          
        if (adjustmentError) throw adjustmentError;
      }
      
      // Refresh jobs to get the latest data
      await refreshJobs();
      
      toast({
        title: 'Job Created',
        description: 'Job has been successfully created.'
      });
      
      return data.id;
    } catch (error: any) {
      console.error('Error creating job:', error);
      toast({
        variant: 'destructive',
        title: 'Error creating job',
        description: error.message || 'Failed to create job',
      });
      throw error;
    }
  };

  // Update an existing job
  const updateJob = async (jobId: string, updates: Partial<Job>) => {
    try {
      // Transform from our frontend format to database format
      const dbUpdates: Record<string, any> = {};
      
      if (updates.jobNumber !== undefined) dbUpdates.quote_number = updates.jobNumber;
      if (updates.sequenceNumber !== undefined) dbUpdates.sequence_number = updates.sequenceNumber;
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.customerId !== undefined) dbUpdates.customer_id = updates.customerId;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.selectedTierId !== undefined) dbUpdates.selected_tier_id = updates.selectedTierId;
      if (updates.totalPrice !== undefined) dbUpdates.total_price = updates.totalPrice;
      
      // Always update the updated_at timestamp
      dbUpdates.updated_at = new Date().toISOString();
      
      // Handle special timestamp fields
      if (updates.sentAt !== undefined) dbUpdates.sent_at = updates.sentAt;
      if (updates.acceptedAt !== undefined) dbUpdates.accepted_at = updates.acceptedAt;
      
      // Update the job record in the database
      const { error: updateError } = await supabase
        .from('quotes') // Still using quotes table in database
        .update(dbUpdates)
        .eq('id', jobId);
        
      if (updateError) throw updateError;
      
      // Handle task updates if provided
      if (updates.tierTasks) {
        // First, remove existing tasks for this job
        const { error: deleteTasksError } = await supabase
          .from('quote_tasks')
          .delete()
          .eq('quote_id', jobId);
          
        if (deleteTasksError) throw deleteTasksError;
        
        // Then add the new tasks
        for (const tierId in updates.tierTasks) {
          const tasks = updates.tierTasks[tierId];
          
          for (const task of tasks) {
            // Insert task
            const dbTaskData = {
              quote_id: jobId,
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
        // First, remove existing adjustments for this job
        const { error: deleteAdjustmentsError } = await supabase
          .from('quote_adjustments')
          .delete()
          .eq('quote_id', jobId);
          
        if (deleteAdjustmentsError) throw deleteAdjustmentsError;
        
        // Then add the new adjustments
        if (updates.adjustments.length > 0) {
          const adjustmentInserts = updates.adjustments.map(adjustment => ({
            quote_id: jobId,
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
      
      // Refresh jobs to get the latest data
      await refreshJobs();
      
      toast({
        title: 'Job Updated',
        description: 'Job has been successfully updated.'
      });
    } catch (error: any) {
      console.error('Error updating job:', error);
      toast({
        variant: 'destructive',
        title: 'Error updating job',
        description: error.message || 'Failed to update job',
      });
      throw error;
    }
  };

  // Delete a job
  const deleteJob = async (jobId: string) => {
    try {
      // Delete associated tasks first
      const { error: deleteTasksError } = await supabase
        .from('quote_tasks')
        .delete()
        .eq('quote_id', jobId);
        
      if (deleteTasksError) throw deleteTasksError;
      
      // Delete associated adjustments
      const { error: deleteAdjustmentsError } = await supabase
        .from('quote_adjustments')
        .delete()
        .eq('quote_id', jobId);
        
      if (deleteAdjustmentsError) throw deleteAdjustmentsError;
      
      // Finally delete the job itself
      const { error: deleteJobError } = await supabase
        .from('quotes')
        .delete()
        .eq('id', jobId);
        
      if (deleteJobError) throw deleteJobError;
      
      // Refresh jobs to get the latest data
      await refreshJobs();
      
      toast({
        title: 'Job Deleted',
        description: 'Job has been successfully deleted.'
      });
    } catch (error: any) {
      console.error('Error deleting job:', error);
      toast({
        variant: 'destructive',
        title: 'Error deleting job',
        description: error.message || 'Failed to delete job',
      });
      throw error;
    }
  };

  // Get a job by ID
  const getJobById = async (jobId: string): Promise<Job | null> => {
    try {
      const { data, error } = await supabase
        .from('quote_details')
        .select('*')
        .eq('id', jobId)
        .single();
        
      if (error) throw error;
      
      if (!data) return null;
      
      // Transform data to our Job interface
      const job: Job = {
        id: data.id,
        jobNumber: data.quoteNumber || data.quote_number,
        sequenceNumber: data.sequenceNumber || data.sequence_number,
        name: data.name,
        customerId: data.customerId || data.customer_id,
        status: data.status,
        tierTasks: data.tierTasks || {},
        selectedTierId: data.selectedTierId || data.selected_tier_id,
        adjustments: data.adjustments || [],
        totalPrice: data.totalPrice || data.total_price,
        createdAt: data.createdAt || data.created_at,
        updatedAt: data.updatedAt || data.updated_at,
        sentAt: data.sentAt || data.sent_at,
        acceptedAt: data.acceptedAt || data.accepted_at
      };
      
      return job;
    } catch (error: any) {
      console.error('Error getting job by ID:', error);
      return null;
    }
  };

  // Get tiers for a job
  const getTiersForJob = async (jobId: string) => {
    try {
      // This likely needs to be updated based on how tiers are stored for jobs
      const { data, error } = await supabase
        .from('tiers')
        .select('*')
        .order('displayOrder', { ascending: true });
        
      if (error) throw error;
      
      return data || [];
    } catch (error: any) {
      console.error('Error getting tiers for job:', error);
      toast({
        variant: 'destructive',
        title: 'Error loading tiers',
        description: error.message || 'Failed to load tiers for this job',
      });
      return [];
    }
  };

  // Provide the context value
  const value: JobContextType = {
    isLoading,
    error,
    jobs,
    refreshJobs,
    getCustomerJobs,
    countCustomerJobs,
    getLastJobDate,
    createJob,
    updateJob,
    deleteJob,
    getJobById,
    getTiersForJob,
  };

  return <JobContext.Provider value={value}>{children}</JobContext.Provider>;
}

// Custom hook to use the context
export function useJobs() {
  const context = useContext(JobContext);
  if (context === undefined) {
    throw new Error('useJobs must be used within a JobsProvider');
  }
  return context;
} 