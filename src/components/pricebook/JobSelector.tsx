import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Briefcase, Search, Plus, Calendar, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/Badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';
import { CustomerSelectionDialog } from './CustomerSelectionDialog';
import { useCustomers } from '@/contexts/CustomerContext';

// We'll need to create a JobContext later, for now we'll use a placeholder
interface Job {
  id: string;
  jobNumber: string;
  name: string;
  status: string;
  updatedAt: string;
  totalPrice: number;
}

interface JobSelectorProps {
  onJobSelect: (jobId: string) => void;
  onCreateJob?: (customerId: string) => void;
}

export function JobSelector({ onJobSelect, onCreateJob }: JobSelectorProps) {
  // For now, we'll use placeholder data until we create a proper JobContext
  const jobs: Job[] = [];
  const isLoading = false;
  
  const { selectCustomer } = useCustomers();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Focus search input on mount
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Filter jobs based on search query
  const filteredJobs = useMemo(() => {
    const lowerCaseQuery = searchQuery.toLowerCase().trim();
    if (!lowerCaseQuery) {
      return jobs;
    }
    return jobs.filter(job => 
      job.jobNumber.toLowerCase().includes(lowerCaseQuery) ||
      job.name.toLowerCase().includes(lowerCaseQuery) ||
      job.status.toLowerCase().includes(lowerCaseQuery)
    );
  }, [jobs, searchQuery]);

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Get status badge styling
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Badge variant="outline" className="text-[10px] px-1 py-0">Pending</Badge>;
      case 'in progress':
        return <Badge variant="secondary" className="text-[10px] px-1 py-0 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">In Progress</Badge>;
      case 'completed':
        return <Badge variant="default" className="text-[10px] px-1 py-0 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive" className="text-[10px] px-1 py-0">Cancelled</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] px-1 py-0">{status}</Badge>;
    }
  };

  // Handle create job button click
  const handleCreateJobClick = () => {
    setShowCustomerDialog(true);
  };

  // Handle customer selection
  const handleCustomerSelected = (customerId: string) => {
    // First select the customer for the sidebar to update
    selectCustomer(customerId);
    
    // Then create a job for this customer
    if (onCreateJob) {
      onCreateJob(customerId);
    } else {
      // Navigate to job creation with customer pre-selected
      navigate(`/jobs/new?customerId=${customerId}`);
    }
  };

  return (
    <section>
      <h3 className="text-sm font-semibold mb-2 flex items-center">
        <Briefcase className="h-4 w-4 mr-2" /> 
        Select a Job
        <div className="ml-auto">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6" 
                onClick={handleCreateJobClick}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Create New Job</TooltipContent>
          </Tooltip>
        </div>
      </h3>
      
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
          <Input 
            ref={searchInputRef}
            placeholder="Search jobs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 text-xs pl-8"
          />
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-[200px] border rounded-md bg-muted">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-xs text-muted-foreground">Loading jobs...</span>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-[200px] border rounded-md">
            <div className="p-1">
              {filteredJobs.length > 0 ? (
                filteredJobs.map(job => (
                  <div 
                    key={job.id}
                    onClick={() => onJobSelect(job.id)}
                    className="flex flex-col p-2 hover:bg-accent hover:text-accent-foreground rounded-sm cursor-pointer transition-colors duration-150 text-xs"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="font-semibold text-xs truncate mr-2">
                        {job.jobNumber}: {job.name}
                      </div>
                      {getStatusBadge(job.status)}
                    </div>
                    
                    <div className="flex items-center text-[11px] text-muted-foreground gap-4">
                      <div className="flex items-center truncate">
                        <Calendar className="h-3 w-3 mr-1 shrink-0"/>
                        <span>{formatRelativeTime(job.updatedAt)}</span>
                      </div>
                      <div className="flex items-center truncate">
                        <User className="h-3 w-3 mr-1 shrink-0"/>
                        <span>${job.totalPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-[160px] p-4">
                  <p className="text-xs text-muted-foreground text-center mb-3">
                    {searchQuery ? 'No jobs found.' : 'Jobs feature coming soon!'}
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs h-7"
                    onClick={handleCreateJobClick}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Create Job
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </div>

      <CustomerSelectionDialog
        isOpen={showCustomerDialog}
        onOpenChange={setShowCustomerDialog}
        onSelectCustomer={handleCustomerSelected}
      />
    </section>
  );
} 