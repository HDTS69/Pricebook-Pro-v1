import React, { useState, useEffect, useMemo } from 'react';
import { useJobs } from '@/contexts/JobContext';
import { useCustomers } from '@/contexts/CustomerContext';
import { Job } from '@/contexts/JobContext';
import { Customer } from '@/types/quote';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Briefcase, User, Calendar, Loader2, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface JobSelectionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectJob: (jobId: string) => void;
}

export function JobSelectionDialog({
  isOpen,
  onOpenChange,
  onSelectJob,
}: JobSelectionDialogProps) {
  const { jobs, isLoading: isLoadingJobs } = useJobs();
  const { allCustomers, searchCustomers, isLoadingCustomers } = useCustomers();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Set up loading state
  useEffect(() => {
    if (isOpen) {
      // Reset state when dialog opens
      setSearchQuery('');
      setSelectedJobId(null);
      setIsLoading(isLoadingJobs || isLoadingCustomers);
    }
  }, [isOpen, isLoadingJobs, isLoadingCustomers]);

  // Map customers to jobs
  const customerMap = useMemo(() => {
    const map = new Map<string, Customer>();
    allCustomers.forEach(customer => {
      map.set(customer.id, customer);
    });
    return map;
  }, [allCustomers]);

  // Filter jobs based on search query
  const filteredJobs = useMemo(() => {
    if (!searchQuery.trim()) {
      return jobs;
    }
    
    const lowerQuery = searchQuery.toLowerCase();
    
    // First, search for customers matching the query
    const matchingCustomers = searchCustomers(searchQuery);
    const matchingCustomerIds = new Set(matchingCustomers.map(c => c.id));
    
    // Then filter jobs by those customer IDs or job name/number
    return jobs.filter(job => 
      matchingCustomerIds.has(job.customerId) || 
      job.name.toLowerCase().includes(lowerQuery) ||
      job.jobNumber.toLowerCase().includes(lowerQuery)
    );
  }, [searchQuery, jobs, searchCustomers]);

  const handleSelectJob = (job: Job) => {
    setSelectedJobId(job.id);
  };

  const handleConfirm = () => {
    if (selectedJobId) {
      onSelectJob(selectedJobId);
      onOpenChange(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (e) {
      return 'Unknown date';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Search for a Job</DialogTitle>
        </DialogHeader>

        <div className="relative my-2">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by customer or job name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
            autoFocus
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-60">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ScrollArea className="h-60 pr-4">
            {filteredJobs.length > 0 ? (
              filteredJobs.map((job) => {
                const customer = customerMap.get(job.customerId);
                return (
                  <div
                    key={job.id}
                    onClick={() => handleSelectJob(job)}
                    className={`flex items-start p-3 mb-1 rounded-md cursor-pointer transition-colors ${
                      selectedJobId === job.id
                        ? 'bg-primary/10'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center mr-3 flex-shrink-0">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {job.name || `Job #${job.jobNumber}`}
                      </p>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <User className="h-3 w-3 mr-1" />
                        <span className="truncate">{customer?.name || 'Unknown Customer'}</span>
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>{formatDate(job.updatedAt)}</span>
                      </div>
                    </div>
                    {selectedJobId === job.id && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </div>
                );
              })
            ) : searchQuery.trim() !== '' ? (
              <div className="flex flex-col items-center justify-center h-full">
                <p className="text-sm text-muted-foreground">No jobs found matching your search.</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <p className="text-sm text-muted-foreground">Start typing to search for jobs.</p>
              </div>
            )}
          </ScrollArea>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedJobId}>
            Select Job
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 