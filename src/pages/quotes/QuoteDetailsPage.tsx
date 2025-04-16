import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ArrowLeft, User, FileText, Edit, Mail, Phone } from 'lucide-react';
import { useQuotes, Quote } from '@/contexts/QuoteContext';
import { useCustomers } from '@/contexts/CustomerContext';
import { Badge } from '@/components/ui/Badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { QuotePdfTemplate } from '@/components/pdf/QuotePdfTemplate';
import { PdfExportButton } from '@/components/ui/pdf-export-button';
import { PdfPreviewButton } from '@/components/ui/pdf-preview-button';
import { PdfPreviewDialog } from '@/components/ui/pdf-preview-dialog';
import { usePdfExport } from '@/hooks/usePdfExport';
import { useSimpleToast } from '@/components/ui/simple-toast';
import { useCompanySettings } from '@/contexts/SupabaseCompanySettingsContext';

export function QuoteDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getQuoteById, getTiersForQuote } = useQuotes();
  const { getCustomerById } = useCustomers();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [tiers, setTiers] = useState<any[]>([]); // Use any[] for tiers since it comes from backend
  const [isLoading, setIsLoading] = useState(true);
  const { 
    quoteRef, 
    isGenerating, 
    isPreviewOpen, 
    previewUrl, 
    exportQuoteToPdf, 
    previewQuotePdf, 
    closePreview 
  } = usePdfExport();
  const { toast } = useSimpleToast();
  const { companySettings } = useCompanySettings();

  useEffect(() => {
    if (!id) return;

    const loadQuoteDetails = async () => {
      setIsLoading(true);
      try {
        const quoteData = await getQuoteById(id);
        if (quoteData) {
          setQuote(quoteData);
          const tierData = await getTiersForQuote(id);
          setTiers(tierData);
        }
      } catch (error) {
        console.error("Error loading quote details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadQuoteDetails();
  }, [id, getQuoteById, getTiersForQuote]);

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleEdit = () => {
    navigate(`/pricebook?quoteId=${id}`);
  };

  const handleExportPdf = async () => {
    if (!id || !quote) {
      toast({
        title: 'Error',
        description: 'Quote information not available for export',
        variant: 'destructive',
      });
      return;
    }

    try {
      await exportQuoteToPdf(id);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate PDF',
        variant: 'destructive',
      });
    }
  };

  const handlePreviewPdf = async () => {
    if (!id || !quote) {
      toast({
        title: 'Error',
        description: 'Quote information not available for preview',
        variant: 'destructive',
      });
      return;
    }

    try {
      await previewQuotePdf(id);
    } catch (error) {
      console.error('Error previewing PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate PDF preview',
        variant: 'destructive',
      });
    }
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string): string => {
    try {
      return format(new Date(dateString), 'PPP');
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'sent':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">Sent</Badge>;
      case 'accepted':
        return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Accepted</Badge>;
      case 'declined':
        return <Badge variant="destructive">Declined</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Calculate tier total
  const calculateTierTotal = (tierId: string): number => {
    if (!quote || !quote.tierTasks || !quote.tierTasks[tierId]) {
      return 0;
    }
    
    return quote.tierTasks[tierId].reduce((sum, task) => {
      const basePrice = Number(task.basePrice) || 0;
      const quantity = Number(task.quantity) || 1;
      const addonTotal = task.addons?.reduce((addonSum, addon) => addonSum + (Number(addon.price) || 0), 0) ?? 0;
      const taskTotal = (basePrice + addonTotal) * quantity;
      return sum + taskTotal;
    }, 0);
  };

  // Transform quote data for PDF template
  const preparePdfData = () => {
    if (!quote || !customer) return null;

    // Format items by tier
    const formattedTiers = [];
    
    for (const tierId in quote.tierTasks) {
      const tierTasks = quote.tierTasks[tierId];
      if (tierTasks.length === 0) continue;
      
      // Find the tier name
      const tierInfo = tiers.find(t => t.id === tierId) || { name: 'Unknown Tier' };
      
      const items = tierTasks.map(task => {
        const basePrice = Number(task.basePrice) || 0;
        const quantity = Number(task.quantity) || 1;
        const addonTotal = task.addons?.reduce((sum, addon) => sum + (Number(addon.price) || 0), 0) ?? 0;
        const unitPrice = basePrice + (addonTotal / quantity);
        
        return {
          id: task.taskId || String(Math.random()),
          name: task.name,
          description: task.description || '',
          quantity,
          unit_price: unitPrice,
        };
      });
      
      const subtotal = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
      
      formattedTiers.push({
        tierId,
        tierName: tierInfo.name,
        items,
        subtotal,
      });
    }

    // Calculate tax (if applicable)
    const tax = 0; // Add tax calculation logic if needed
    
    // Calculate total for selected tier
    const selectedTierTotal = quote.selectedTierId ? 
      calculateTierTotal(quote.selectedTierId) : 0;
    
    // Calculate grand total across all tiers
    let grandTotal = 0;
    for (const tier of formattedTiers) {
      grandTotal += tier.subtotal;
    }

    // Format customer address if available
    let customerAddress = '';
    if (customer.billing_address) {
      const addr = customer.billing_address;
      customerAddress = [
        addr.street, 
        addr.city,
        `${addr.state} ${addr.postcode}`,
        addr.country
      ].filter(Boolean).join(', ');
    }

    return {
      id: quote.id || id || '',
      name: quote.name || '',
      quote_number: quote.quoteNumber || '',
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email || '',
        phone: customer.phone || customer.mobile_phone || undefined,
        address: customerAddress,
      },
      tiers: formattedTiers,
      tax,
      total: selectedTierTotal,
      grandTotal,
      created_at: quote.createdAt,
      updated_at: quote.updatedAt,
      status: quote.status || 'Draft',
      notes: '',
    };
  };

  // Find customer for this quote
  const customer = quote ? getCustomerById(quote.customerId) : null;
  const pdfData = preparePdfData();

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={handleGoBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-3xl font-bold tracking-tight">
              Quote {quote?.quoteNumber || ''}
              {quote?.name && `: ${quote.name}`}
            </h2>
            {quote && getStatusBadge(quote.status)}
          </div>
          <div className="flex gap-2">
            <PdfPreviewButton
              isGenerating={isGenerating}
              onPreview={handlePreviewPdf}
              variant="outline"
            >
              Preview Quote
            </PdfPreviewButton>
            <PdfExportButton
              isGenerating={isGenerating}
              onExport={handleExportPdf}
              variant="outline"
            >
              Export PDF
            </PdfExportButton>
            <Button onClick={handleEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Quote
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : quote ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Quote Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Quote Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <div className="text-sm text-muted-foreground">Quote Number</div>
                    <div className="font-medium">{quote.quoteNumber}</div>
                  </div>
                  <div className="flex justify-between">
                    <div className="text-sm text-muted-foreground">Created</div>
                    <div className="font-medium">{formatDate(quote.createdAt)}</div>
                  </div>
                  <div className="flex justify-between">
                    <div className="text-sm text-muted-foreground">Updated</div>
                    <div className="font-medium">{formatDate(quote.updatedAt)}</div>
                  </div>
                  {quote.sentAt && (
                    <div className="flex justify-between">
                      <div className="text-sm text-muted-foreground">Sent</div>
                      <div className="font-medium">{formatDate(quote.sentAt)}</div>
                    </div>
                  )}
                  {quote.acceptedAt && (
                    <div className="flex justify-between">
                      <div className="text-sm text-muted-foreground">Accepted</div>
                      <div className="font-medium">{formatDate(quote.acceptedAt)}</div>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <div className="text-sm text-muted-foreground">Total Amount</div>
                    <div className="font-medium">{formatCurrency(quote.totalPrice)}</div>
                  </div>
                </CardContent>
              </Card>

              {/* Customer Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Customer Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {customer ? (
                    <>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div className="font-medium">{customer.name}</div>
                      </div>
                      {customer.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <div>{customer.email}</div>
                        </div>
                      )}
                      {customer.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <div>{customer.phone}</div>
                        </div>
                      )}
                      {customer.mobile_phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <div>{customer.mobile_phone}</div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-muted-foreground">Customer information not available</div>
                  )}
                </CardContent>
              </Card>

              {/* Selected Tier */}
              <Card>
                <CardHeader>
                  <CardTitle>Selected Package</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {quote.selectedTierId ? (
                    <>
                      <div className="flex justify-between">
                        <div className="text-sm text-muted-foreground">Package</div>
                        <div className="font-medium">
                          {tiers.find(t => t.id === quote.selectedTierId)?.name || 'Unknown Package'}
                        </div>
                      </div>
                      {tiers.find(t => t.id === quote.selectedTierId)?.warranty && (
                        <div className="flex justify-between">
                          <div className="text-sm text-muted-foreground">Warranty</div>
                          <div className="font-medium">
                            {tiers.find(t => t.id === quote.selectedTierId)?.warranty}
                          </div>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <div className="text-sm text-muted-foreground">Tasks</div>
                        <div className="font-medium">
                          {quote.tierTasks && quote.tierTasks[quote.selectedTierId]
                            ? quote.tierTasks[quote.selectedTierId].length
                            : 0}
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <div className="text-sm text-muted-foreground">Value</div>
                        <div className="font-medium">
                          {formatCurrency(calculateTierTotal(quote.selectedTierId))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-muted-foreground">No package selected</div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Tier Tasks */}
            <Card>
              <CardHeader>
                <CardTitle>Quote Packages</CardTitle>
              </CardHeader>
              <CardContent>
                {tiers.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {tiers.map(tier => (
                      <div 
                        key={tier.id}
                        className={`rounded-md border p-4 ${tier.id === quote.selectedTierId ? 'bg-primary/5 border-primary/30' : ''}`}
                      >
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-semibold text-lg">{tier.name}</h3>
                          <div className="font-medium">{formatCurrency(calculateTierTotal(tier.id))}</div>
                        </div>
                        
                        {tier.warranty && (
                          <div className="text-sm mb-2">
                            <span className="text-muted-foreground">Warranty:</span> {tier.warranty}
                          </div>
                        )}
                        
                        {tier.perks && tier.perks.length > 0 && (
                          <div className="mb-4">
                            <div className="text-sm text-muted-foreground mb-1">Perks:</div>
                            <ul className="text-sm space-y-1 pl-5 list-disc">
                              {tier.perks.map((perk: string, index: number) => (
                                <li key={index}>{perk}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        <Separator className="my-3" />
                        
                        <ScrollArea className="h-64">
                          {quote.tierTasks && quote.tierTasks[tier.id] && quote.tierTasks[tier.id].length > 0 ? (
                            <div className="space-y-3">
                              {quote.tierTasks[tier.id].map((task, index) => (
                                <div key={index} className="p-3 bg-card rounded-md border">
                                  <div className="flex justify-between items-start">
                                    <div className="font-medium">{task.name}</div>
                                    <div className="text-sm font-medium">
                                      {task.quantity && task.quantity > 1 ? `${task.quantity} × ` : ''}
                                      {formatCurrency(task.basePrice)}
                                    </div>
                                  </div>
                                  {task.description && (
                                    <div className="text-sm text-muted-foreground mt-1">{task.description}</div>
                                  )}
                                  {task.addons && task.addons.length > 0 && (
                                    <div className="mt-2">
                                      <div className="text-xs text-muted-foreground mb-1">Add-ons:</div>
                                      <div className="pl-3 space-y-1">
                                        {task.addons.map((addon, idx) => (
                                          <div key={idx} className="text-sm flex justify-between">
                                            <span>{addon.name}</span>
                                            <span>{formatCurrency(addon.price)}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center text-muted-foreground p-4">
                              No tasks in this package
                            </div>
                          )}
                        </ScrollArea>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-6 text-muted-foreground">
                    <p>No packages available for this quote.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* PDF Template (hidden) */}
            <div className="hidden">
              {quote && pdfData && (
                <QuotePdfTemplate
                  ref={quoteRef}
                  quote={pdfData}
                  companyInfo={companySettings}
                />
              )}
            </div>
          </>
        ) : (
          <Card>
            <CardContent className="flex justify-center items-center h-64">
              <div className="text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Quote not found or has been deleted.</p>
                <Button variant="outline" className="mt-4" onClick={handleGoBack}>
                  Go Back
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* PDF Preview Dialog */}
        <PdfPreviewDialog
          isOpen={isPreviewOpen}
          onClose={closePreview}
          onDownload={handleExportPdf}
          pdfUrl={previewUrl}
          title={`Quote Preview - ${quote?.quoteNumber || ''}`}
          isLoading={isGenerating}
        />
      </div>
    </DashboardLayout>
  );
} 