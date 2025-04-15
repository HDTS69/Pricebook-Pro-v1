import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { useJobs } from '@/contexts/JobContext';
import { useCustomers } from '@/contexts/CustomerContext';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';

export function CreateJobPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { createJob } = useJobs();
  const { allCustomers } = useCustomers();
  
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [jobNumber, setJobNumber] = useState(`J-${Date.now().toString().slice(-6)}`);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCustomerId) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please select a customer'
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create a new job with minimal required fields
      const newJobId = await createJob({
        jobNumber,
        sequenceNumber: 1,
        name: '1',
        customerId: selectedCustomerId,
        status: 'Draft',
        tierTasks: {},
        selectedTierId: null,
        adjustments: [],
        totalPrice: 0
      });
      
      toast({
        title: 'Job Created',
        description: 'Your new job has been created successfully'
      });
      
      // Navigate to the pricebook with the new job
      navigate('/pricebook');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create job'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/jobs')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Jobs
          </Button>
          <h2 className="text-3xl font-bold tracking-tight">Create New Job</h2>
        </div>
        
        <Card className="max-w-md mx-auto">
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customer">Customer</Label>
                <Select 
                  value={selectedCustomerId} 
                  onValueChange={setSelectedCustomerId}
                >
                  <SelectTrigger id="customer">
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {allCustomers.map(customer => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="jobNumber">Job Number</Label>
                <Input
                  id="jobNumber"
                  value={jobNumber}
                  onChange={(e) => setJobNumber(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
              >
                Create Job
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
} 