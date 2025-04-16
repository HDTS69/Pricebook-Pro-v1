import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ArrowLeft, User, FileText, Calendar, DollarSign, Edit, Mail, Phone } from 'lucide-react';
import { useJobs, Job } from '@/contexts/JobContext';
import { useCustomers } from '@/contexts/CustomerContext';

export function JobDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getJobById } = useJobs();
  const { getCustomerById } = useCustomers();
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const jobRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadJob() {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const jobData = await getJobById(id);
        if (jobData) {
          setJob(jobData);
        }
      } catch (error) {
        console.error('Error loading job:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadJob();
  }, [id, getJobById]);

  const handleGoBack = () => {
    navigate('/jobs');
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(amount);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <p>Loading job details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!job) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <p>Job not found</p>
        </div>
      </DashboardLayout>
    );
  }

  // Find customer for this job
  const customer = getCustomerById(job.customerId);

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button
              variant="ghost"
              onClick={handleGoBack}
              className="mr-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Jobs
            </Button>
            <h1 className="text-2xl font-bold">
              Job Details
            </h1>
          </div>
          <Button onClick={() => navigate(`/jobs/edit/${id}`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <User className="mr-2 h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              {customer && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">{customer.name}</h3>
                    {customer.email && (
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Mail className="mr-2 h-4 w-4" />
                        {customer.email}
                      </div>
                    )}
                    {customer.phone && (
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Phone className="mr-2 h-4 w-4" />
                        {customer.phone}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Job Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">Job Name</h3>
                  <p className="text-sm text-gray-500">{job.name || `Job #${job.id}`}</p>
                </div>
                <div>
                  <h3 className="font-medium">Status</h3>
                  <p className="text-sm">{job.status}</p>
                </div>
                {job.createdAt && (
                  <div>
                    <h3 className="font-medium">Created</h3>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <Calendar className="mr-2 h-4 w-4" />
                      {new Date(job.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <DollarSign className="mr-2 h-5 w-5" />
                Financial Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm">Total:</span>
                  <span className="text-sm font-medium">
                    {formatCurrency(job.totalPrice || 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div ref={jobRef} className="hidden">
          {/* Hidden container for potential PDF generation */}
        </div>
      </div>
    </DashboardLayout>
  );
} 