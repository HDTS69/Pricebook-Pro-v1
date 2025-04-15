import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ArrowLeft, User, FileText, Calendar, DollarSign, Edit, Mail, Phone } from 'lucide-react';
import { useJobs, Job, JobTask } from '@/contexts/JobContext';
import { useCustomers } from '@/contexts/CustomerContext';
import { Badge } from '@/components/ui/Badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';

export function JobDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getJobById, getTiersForJob } = useJobs();
  const { getCustomerById } = useCustomers();
  const [job, setJob] = useState<Job | null>(null);
  const [tiers, setTiers] = useState<any[]>([]); // Use any[] for tiers since it comes from backend
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const loadJobDetails = async () => {
      setIsLoading(true);
      try {
        const jobData = await getJobById(id);
        if (jobData) {
          setJob(jobData);
          const tierData = await getTiersForJob(id);
          setTiers(tierData);
        }
      } catch (error) {
        console.error("Error loading job details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadJobDetails();
  }, [id, getJobById, getTiersForJob]);

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleEdit = () => {
    navigate(`/pricebook?jobId=${id}`);
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
    if (!job || !job.tierTasks || !job.tierTasks[tierId]) {
      return 0;
    }
    
    return job.tierTasks[tierId].reduce((sum, task) => {
      const basePrice = Number(task.basePrice) || 0;
      const quantity = Number(task.quantity) || 1;
      const addonTotal = task.addons?.reduce((addonSum, addon) => addonSum + (Number(addon.price) || 0), 0) ?? 0;
      const taskTotal = (basePrice + addonTotal) * quantity;
      return sum + taskTotal;
    }, 0);
  };

  // Find customer for this job
  const customer = job ? getCustomerById(job.customerId) : null;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={handleGoBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-3xl font-bold tracking-tight">
              Job {job?.jobNumber || ''}
              {job?.name && `: ${job.name}`}
            </h2>
            {job && getStatusBadge(job.status)}
          </div>
          <Button onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Job
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : job ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Job Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Job Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <div className="text-sm text-muted-foreground">Job Number</div>
                    <div className="font-medium">{job.jobNumber}</div>
                  </div>
                  <div className="flex justify-between">
                    <div className="text-sm text-muted-foreground">Created</div>
                    <div className="font-medium">{formatDate(job.createdAt)}</div>
                  </div>
                  <div className="flex justify-between">
                    <div className="text-sm text-muted-foreground">Updated</div>
                    <div className="font-medium">{formatDate(job.updatedAt)}</div>
                  </div>
                  {job.sentAt && (
                    <div className="flex justify-between">
                      <div className="text-sm text-muted-foreground">Sent</div>
                      <div className="font-medium">{formatDate(job.sentAt)}</div>
                    </div>
                  )}
                  {job.acceptedAt && (
                    <div className="flex justify-between">
                      <div className="text-sm text-muted-foreground">Accepted</div>
                      <div className="font-medium">{formatDate(job.acceptedAt)}</div>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <div className="text-sm text-muted-foreground">Total Amount</div>
                    <div className="font-medium">{formatCurrency(job.totalPrice)}</div>
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
                  {job.selectedTierId ? (
                    <>
                      <div className="flex justify-between">
                        <div className="text-sm text-muted-foreground">Package</div>
                        <div className="font-medium">
                          {tiers.find(t => t.id === job.selectedTierId)?.name || 'Unknown Package'}
                        </div>
                      </div>
                      {tiers.find(t => t.id === job.selectedTierId)?.warranty && (
                        <div className="flex justify-between">
                          <div className="text-sm text-muted-foreground">Warranty</div>
                          <div className="font-medium">
                            {tiers.find(t => t.id === job.selectedTierId)?.warranty}
                          </div>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <div className="text-sm text-muted-foreground">Tasks</div>
                        <div className="font-medium">
                          {job.tierTasks && job.tierTasks[job.selectedTierId]
                            ? job.tierTasks[job.selectedTierId].length
                            : 0}
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <div className="text-sm text-muted-foreground">Value</div>
                        <div className="font-medium">
                          {formatCurrency(calculateTierTotal(job.selectedTierId))}
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
                <CardTitle>Job Packages</CardTitle>
              </CardHeader>
              <CardContent>
                {tiers.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {tiers.map(tier => (
                      <div 
                        key={tier.id}
                        className={`rounded-md border p-4 ${tier.id === job.selectedTierId ? 'bg-primary/5 border-primary/30' : ''}`}
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
                          {job.tierTasks && job.tierTasks[tier.id] && job.tierTasks[tier.id].length > 0 ? (
                            <div className="space-y-3">
                              {job.tierTasks[tier.id].map((task, index) => (
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
                    <p>No packages available for this job.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="flex justify-center items-center h-64">
              <div className="text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Job not found or has been deleted.</p>
                <Button variant="outline" className="mt-4" onClick={handleGoBack}>
                  Go Back
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
} 