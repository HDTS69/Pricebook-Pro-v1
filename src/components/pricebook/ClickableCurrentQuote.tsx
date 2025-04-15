import React from 'react';
import { Quote } from '@/types/quote';
import { Badge } from '@/components/ui/Badge';
import { Calendar, DollarSign, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface ClickableCurrentQuoteProps {
  quote: Quote;
  isSelected: boolean;
  formatCurrency: (amount: number) => string;
  onSelect: (quoteId: string) => void;
}

export function ClickableCurrentQuote({ 
  quote, 
  isSelected,
  formatCurrency, 
  onSelect 
}: ClickableCurrentQuoteProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    console.log("ClickableCurrentQuote clicked:", quote.id, "isSelected:", isSelected);
    try {
      onSelect(quote.id);
      console.log("ClickableCurrentQuote onSelect called successfully");
    } catch (error) {
      console.error("Error in ClickableCurrentQuote click handler:", error);
    }
  };

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
        return <Badge variant="outline" className="text-xs px-2 py-0 h-6">Draft</Badge>;
      case 'sent':
        return <Badge variant="secondary" className="text-xs px-2 py-0 h-6 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">Sent</Badge>;
      case 'accepted':
        return <Badge variant="default" className="text-xs px-2 py-0 h-6 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Accepted</Badge>;
      case 'declined':
        return <Badge variant="destructive" className="text-xs px-2 py-0 h-6">Declined</Badge>;
      default:
        return <Badge variant="outline" className="text-xs px-2 py-0 h-6">{status}</Badge>;
    }
  };

  return (
    <div 
      onClick={handleClick}
      className={cn(
        "flex flex-col p-3 rounded-md transition-all duration-150 cursor-pointer",
        "border border-transparent hover:border-primary/50",
        "hover:bg-accent/80 hover:shadow-sm",
        isSelected 
          ? "bg-primary/10 border-primary/30 shadow-sm" 
          : "bg-card/60"
      )}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="font-semibold">
          {quote.quoteNumber}{quote.name ? `: ${quote.name}` : ''}
        </div>
        {getStatusBadge(quote.status)}
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
        <div className="flex items-center">
          <Clock className="h-3.5 w-3.5 mr-1.5" />
          <span>{formatRelativeTime(quote.updatedAt)}</span>
        </div>
        <div className="flex items-center justify-end font-medium text-foreground">
          <DollarSign className="h-3.5 w-3.5 mr-0.5" />
          <span>{formatCurrency(quote.totalPrice)}</span>
        </div>
      </div>
    </div>
  );
} 