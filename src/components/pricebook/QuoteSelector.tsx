import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useQuotes } from '@/contexts/QuoteContext';
import { Quote } from '@/contexts/QuoteContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Search, Plus, Calendar, User, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/Badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';
import { CustomerSelectionDialog } from './CustomerSelectionDialog';
import { useCustomers } from '@/contexts/CustomerContext';

interface QuoteSelectorProps {
  onQuoteSelect: (quoteId: string) => void;
  onCreateQuote?: (customerId: string, nextSequenceNumber: number) => void;
}

export function QuoteSelector({ onQuoteSelect, onCreateQuote }: QuoteSelectorProps) {
  const { quotes, isLoading } = useQuotes();
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

  // Filter quotes based on search query
  const filteredQuotes = useMemo(() => {
    const lowerCaseQuery = searchQuery.toLowerCase().trim();
    if (!lowerCaseQuery) {
      return quotes;
    }
    return quotes.filter(quote => 
      quote.quoteNumber.toLowerCase().includes(lowerCaseQuery) ||
      quote.name.toLowerCase().includes(lowerCaseQuery) ||
      quote.status.toLowerCase().includes(lowerCaseQuery)
    );
  }, [quotes, searchQuery]);

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
      case 'draft':
        return <Badge variant="outline" className="text-[10px] px-1 py-0">Draft</Badge>;
      case 'sent':
        return <Badge variant="secondary" className="text-[10px] px-1 py-0 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">Sent</Badge>;
      case 'accepted':
        return <Badge variant="default" className="text-[10px] px-1 py-0 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Accepted</Badge>;
      case 'declined':
        return <Badge variant="destructive" className="text-[10px] px-1 py-0">Declined</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] px-1 py-0">{status}</Badge>;
    }
  };

  // Handle create quote button click
  const handleCreateQuoteClick = () => {
    setShowCustomerDialog(true);
  };

  // Handle customer selection
  const handleCustomerSelected = (customerId: string) => {
    // First select the customer for the sidebar to update
    selectCustomer(customerId);
    
    // Then create a quote for this customer
    if (onCreateQuote) {
      onCreateQuote(customerId, 1);
    } else {
      // Navigate to quote creation with customer pre-selected
      navigate(`/quotes/new?customerId=${customerId}`);
    }
  };

  return (
    <section>
      <h3 className="text-sm font-semibold mb-2 flex items-center">
        <FileText className="h-4 w-4 mr-2" /> 
        Select a Quote
        <div className="ml-auto">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6" 
                onClick={handleCreateQuoteClick}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Create New Quote</TooltipContent>
          </Tooltip>
        </div>
      </h3>
      
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
          <Input 
            ref={searchInputRef}
            placeholder="Search quotes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 text-xs pl-8"
          />
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-[200px] border rounded-md bg-muted">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-xs text-muted-foreground">Loading quotes...</span>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-[200px] border rounded-md">
            <div className="p-1">
              {filteredQuotes.length > 0 ? (
                filteredQuotes.map(quote => (
                  <div 
                    key={quote.id}
                    onClick={() => onQuoteSelect(quote.id)}
                    className="flex flex-col p-2 hover:bg-accent hover:text-accent-foreground rounded-sm cursor-pointer transition-colors duration-150 text-xs"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="font-semibold text-xs truncate mr-2">
                        {quote.quoteNumber}: {quote.name}
                      </div>
                      {getStatusBadge(quote.status)}
                    </div>
                    
                    <div className="flex items-center text-[11px] text-muted-foreground gap-4">
                      <div className="flex items-center truncate">
                        <Calendar className="h-3 w-3 mr-1 shrink-0"/>
                        <span>{formatRelativeTime(quote.updatedAt)}</span>
                      </div>
                      <div className="flex items-center truncate">
                        <User className="h-3 w-3 mr-1 shrink-0"/>
                        <span>${quote.totalPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-[160px] p-4">
                  <p className="text-xs text-muted-foreground text-center mb-3">
                    {searchQuery ? 'No quotes found.' : 'No quotes available.'}
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs h-7"
                    onClick={handleCreateQuoteClick}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Create Quote
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