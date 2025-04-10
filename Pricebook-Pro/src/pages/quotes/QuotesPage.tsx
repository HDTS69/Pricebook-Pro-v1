import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';

interface Quote {
  id: string;
  customerName: string;
  total: number;
  status: 'draft' | 'sent' | 'accepted' | 'declined';
  createdAt: string;
}

const mockQuotes: Quote[] = [
  {
    id: '1',
    customerName: 'John Doe',
    total: 1200,
    status: 'sent',
    createdAt: '2024-04-03',
  },
  {
    id: '2',
    customerName: 'Jane Smith',
    total: 2500,
    status: 'accepted',
    createdAt: '2024-04-02',
  },
];

export function QuotesPage() {
  const navigate = useNavigate();

  const handleCreateQuote = () => {
    navigate('/quotes/new');
  };

  const getStatusColor = (status: Quote['status']) => {
    switch (status) {
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
                  {mockQuotes.map((quote) => (
                    <tr
                      key={quote.id}
                      className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                    >
                      <td className="p-4 align-middle">{quote.id}</td>
                      <td className="p-4 align-middle">{quote.customerName}</td>
                      <td className="p-4 align-middle">
                        ${quote.total.toLocaleString()}
                      </td>
                      <td className="p-4 align-middle">
                        <span className={getStatusColor(quote.status)}>
                          {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                        </span>
                      </td>
                      <td className="p-4 align-middle">{quote.createdAt}</td>
                      <td className="p-4 align-middle">
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
} 