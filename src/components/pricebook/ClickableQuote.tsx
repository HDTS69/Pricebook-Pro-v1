import React from 'react';
import { Quote } from '@/contexts/QuoteContext';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface ClickableQuoteProps {
  quote: Quote;
  selected?: boolean;
  onSelect: (quoteId: string) => void;
}

export function ClickableQuote({ quote, selected = false, onSelect }: ClickableQuoteProps) {
  // Handle click on quote
  const handleClick = () => {
    onSelect(quote.id);
  };

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(amount);
  };

  // Get status badge styling
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return <Badge variant="outline" className="text-xs px-1.5 py-0.5">Draft</Badge>;
      case 'sent':
        return <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">Sent</Badge>;
      case 'accepted':
        return <Badge variant="default" className="text-xs px-1.5 py-0.5 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Accepted</Badge>;
      case 'declined':
        return <Badge variant="destructive" className="text-xs px-1.5 py-0.5">Declined</Badge>;
      default:
        return <Badge variant="outline" className="text-xs px-1.5 py-0.5">{status}</Badge>;
    }
  };

  return (
    <div 
      className={cn(
        "p-4 border rounded-md cursor-pointer transition-all",
        "hover:bg-accent hover:shadow-sm",
        selected && "border-primary bg-primary/5"
      )}
      onClick={handleClick}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-semibold">
          {quote.quoteNumber}: {quote.name}
        </h3>
        {getStatusBadge(quote.status)}
      </div>
      
      <div className="text-sm text-muted-foreground mb-2">
        Last updated {formatRelativeTime(quote.updatedAt)}
      </div>
      
      <div className="text-sm font-medium">
        {formatCurrency(quote.totalPrice)}
      </div>
      
      <div className="mt-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(quote.id);
          }}
        >
          Open Quote
        </Button>
      </div>
    </div>
  );
} 