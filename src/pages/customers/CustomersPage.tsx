import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Plus, Mail, Phone, Loader2 } from 'lucide-react';
import { useCustomers } from '@/contexts/CustomerContext';
import { useQuotes } from '@/contexts/QuoteContext';
import { useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function CustomersPage() {
  const { allCustomers, selectCustomer, refreshCustomers } = useCustomers();
  const { countCustomerQuotes, getLastQuoteDate, isLoading } = useQuotes();
  const navigate = useNavigate();

  const customersWithStats = useMemo(() => {
    return allCustomers.map(customer => ({
      ...customer,
      totalQuotes: countCustomerQuotes(customer.id),
      lastQuoteDate: getLastQuoteDate(customer.id)
    }));
  }, [allCustomers, countCustomerQuotes, getLastQuoteDate]);

  const handleAddCustomer = () => {
    navigate('/customers/new');
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (e) {
      return 'Invalid date';
    }
  };

  useEffect(() => {
    console.log("CustomerPage mounted, customers:", allCustomers.length);
    
    // If customers are empty, try refreshing them
    if (allCustomers.length === 0) {
      const loadCustomers = async () => {
        console.log("Trying to refresh customers...");
        await refreshCustomers();
        console.log("After refresh, customers:", allCustomers.length);
      };
      
      loadCustomers();
    }
  }, [allCustomers.length]);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold tracking-tight">Customers</h2>
          <Button onClick={handleAddCustomer}>
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Customers</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : customersWithStats.length === 0 ? (
              <div className="text-center p-6 text-muted-foreground">
                <p>No customers found. Add your first customer to get started.</p>
              </div>
            ) : (
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b">
                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Name
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Contact
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Total Quotes
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Last Quote
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {customersWithStats.map((customer) => (
                      <tr
                        key={customer.id}
                        className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                      >
                        <td className="p-4 align-middle font-medium">
                          {customer.name}
                        </td>
                        <td className="p-4 align-middle">
                          <div className="flex flex-col space-y-1">
                            <div className="flex items-center text-sm">
                              <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                              {customer.email || 'N/A'}
                            </div>
                            <div className="flex items-center text-sm">
                              <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                              {customer.phone || 'N/A'}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 align-middle">{customer.totalQuotes}</td>
                        <td className="p-4 align-middle">{formatDate(customer.lastQuoteDate)}</td>
                        <td className="p-4 align-middle">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => selectCustomer(customer.id)}
                          >
                            View
                          </Button>
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