import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Plus, Loader2 } from 'lucide-react';
import { useQuotes } from '@/contexts/QuoteContext';
import { formatCurrency } from '@/lib/utils';

export function QuotesPage() {
  const navigate = useNavigate();
  const { quotes, isLoading, error } = useQuotes();

  const handleCreateQuote = () => {
    navigate('/quotes/new');
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return 'text-gray-500';
      case 'sent':
        return 'text-blue-500';
      case 'accepted':
        return 'text-green-500';
      case 'declined':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (e) {
      return dateString;
    }
  };

  const handleViewQuote = (quoteId: string) => {
    navigate(`/quotes/${quoteId}/details`);
  };

  const handleEditQuote = (quoteId: string) => {
    navigate(`/pricebook/edit/${quoteId}`);
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold tracking-tight">Quotes</h2>
          <Button onClick={handleCreateQuote}>
            <Plus className="mr-2 h-4 w-4" />
            Create Quote
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Quotes</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="text-center p-6 text-red-500">
                <p>Error loading quotes: {error}</p>
              </div>
            ) : quotes.length === 0 ? (
              <div className="text-center p-6 text-muted-foreground">
                <p>No quotes found. Create your first quote to get started.</p>
              </div>
            ) : (
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b">
                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Quote #
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Customer
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Total
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Status
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Created
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {quotes.map((quote) => (
                      <tr
                        key={quote.id}
                        className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                      >
                        <td className="p-4 align-middle">{quote.quoteNumber}</td>
                        <td className="p-4 align-middle">{quote.name}</td>
                        <td className="p-4 align-middle">
                          {formatCurrency(quote.totalPrice)}
                        </td>
                        <td className="p-4 align-middle">
                          <span className={getStatusColor(quote.status)}>
                            {quote.status}
                          </span>
                        </td>
                        <td className="p-4 align-middle">{formatDate(quote.createdAt)}</td>
                        <td className="p-4 align-middle">
                          <div className="flex space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleViewQuote(quote.id)}
                            >
                              View
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEditQuote(quote.id)}
                            >
                              Edit
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
} 