import React, { useState, useEffect, useMemo } from 'react';
import { useCustomers } from '@/contexts/CustomerContext';
import { Customer } from '@/types/quote';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, User, Building, Loader2, Check } from 'lucide-react';

interface CustomerSelectionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectCustomer: (customerId: string) => void;
}

export function CustomerSelectionDialog({
  isOpen,
  onOpenChange,
  onSelectCustomer,
}: CustomerSelectionDialogProps) {
  const { allCustomers, searchCustomers } = useCustomers();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch customers
  useEffect(() => {
    if (isOpen) {
      // Reset state when dialog opens
      setSearchQuery('');
      setSelectedCustomerId(null);
      setIsLoading(false);
    }
  }, [isOpen]);

  // Filter customers based on search query
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) {
      return allCustomers;
    }
    return searchCustomers(searchQuery);
  }, [searchQuery, allCustomers, searchCustomers]);

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomerId(customer.id);
  };

  const handleConfirm = () => {
    if (selectedCustomerId) {
      onSelectCustomer(selectedCustomerId);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Select a Customer</DialogTitle>
        </DialogHeader>

        <div className="relative my-2">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
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
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  onClick={() => handleSelectCustomer(customer)}
                  className={`flex items-start p-3 mb-1 rounded-md cursor-pointer transition-colors ${
                    selectedCustomerId === customer.id
                      ? 'bg-primary/10'
                      : 'hover:bg-muted'
                  }`}
                >
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center mr-3 flex-shrink-0">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {customer.name}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {customer.email || customer.phone || 'No contact information'}
                    </p>
                  </div>
                  {selectedCustomerId === customer.id && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <p className="text-sm text-muted-foreground">No customers found</p>
              </div>
            )}
          </ScrollArea>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedCustomerId}>
            Select Customer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 