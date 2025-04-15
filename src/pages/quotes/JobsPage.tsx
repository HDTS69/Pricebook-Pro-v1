import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Plus, Loader2 } from 'lucide-react';
import { useJobs, Job } from '@/contexts/JobContext';
import { formatCurrency } from '@/lib/utils';

export function JobsPage() {
  const navigate = useNavigate();
  const { jobs, isLoading, error } = useJobs();

  const handleCreateJob = () => {
    navigate('/jobs/new');
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

  const handleViewJob = (jobId: string) => {
    navigate(`/jobs/${jobId}/details`);
  };

  const handleEditJob = (jobId: string) => {
    navigate(`/pricebook/edit/${jobId}`);
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold tracking-tight">Jobs</h2>
          <Button onClick={handleCreateJob}>
            <Plus className="mr-2 h-4 w-4" />
            Create Job
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="text-center p-6 text-red-500">
                <p>Error loading jobs: {error}</p>
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center p-6 text-muted-foreground">
                <p>No jobs found. Create your first job to get started.</p>
              </div>
            ) : (
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b">
                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Job #
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
                    {jobs.map((job: Job) => (
                      <tr
                        key={job.id}
                        className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                      >
                        <td className="p-4 align-middle">{job.jobNumber}</td>
                        <td className="p-4 align-middle">{job.name}</td>
                        <td className="p-4 align-middle">
                          {formatCurrency(job.totalPrice)}
                        </td>
                        <td className="p-4 align-middle">
                          <span className={getStatusColor(job.status)}>
                            {job.status}
                          </span>
                        </td>
                        <td className="p-4 align-middle">{formatDate(job.createdAt)}</td>
                        <td className="p-4 align-middle">
                          <div className="flex space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleViewJob(job.id)}
                            >
                              View
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEditJob(job.id)}
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