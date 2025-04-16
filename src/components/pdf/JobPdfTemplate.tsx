import { forwardRef } from 'react';
import { format } from 'date-fns';

interface JobPdfTemplateProps {
  job: {
    id: string;
    name: string;
    customer: {
      name: string;
      email: string;
      phone?: string;
      address?: string;
    };
    items: {
      id: string;
      name: string;
      description?: string;
      quantity: number;
      unit_price: number;
    }[];
    subtotal: number;
    tax?: number;
    total: number;
    created_at: string;
    scheduled_at?: string;
    completed_at?: string;
    status: string;
    notes?: string;
  };
  companyInfo: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    logo?: string;
  };
}

export const JobPdfTemplate = forwardRef<HTMLDivElement, JobPdfTemplateProps>(
  ({ job, companyInfo }, ref) => {
    const createdDate = job.created_at 
      ? format(new Date(job.created_at), 'MMMM dd, yyyy') 
      : format(new Date(), 'MMMM dd, yyyy');
    
    const scheduledDate = job.scheduled_at
      ? format(new Date(job.scheduled_at), 'MMMM dd, yyyy')
      : 'Not scheduled';
    
    const completedDate = job.completed_at
      ? format(new Date(job.completed_at), 'MMMM dd, yyyy')
      : 'Not completed';

    // Calculate totals
    const subtotal = job.subtotal;
    const tax = job.tax || 0;
    const total = job.total;

    return (
      <div 
        ref={ref} 
        id={`job-pdf-${job.id}`}
        className="p-8 bg-white text-foreground max-w-4xl mx-auto"
        style={{ fontFamily: 'Arial, sans-serif' }}
      >
        {/* Header with company info */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-semibold">{companyInfo.name}</h1>
            {companyInfo.address && <p className="text-sm">{companyInfo.address}</p>}
            {companyInfo.phone && <p className="text-sm">Phone: {companyInfo.phone}</p>}
            {companyInfo.email && <p className="text-sm">Email: {companyInfo.email}</p>}
            {companyInfo.website && <p className="text-sm">Web: {companyInfo.website}</p>}
          </div>
          {companyInfo.logo && (
            <img 
              src={companyInfo.logo} 
              alt="Company Logo" 
              className="h-16 w-auto object-contain"
            />
          )}
        </div>

        {/* Job Info */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold border-b-2 border-gray-300 pb-2 mb-4">JOB DETAILS</h2>
          <div className="flex justify-between">
            <div>
              <p><strong>Job #:</strong> {job.id}</p>
              <p><strong>Date Created:</strong> {createdDate}</p>
              <p><strong>Scheduled Date:</strong> {scheduledDate}</p>
              <p><strong>Completion Date:</strong> {completedDate}</p>
              <p><strong>Status:</strong> <span className="capitalize">{job.status}</span></p>
            </div>
            <div>
              <p><strong>Customer:</strong> {job.customer.name}</p>
              <p><strong>Email:</strong> {job.customer.email}</p>
              {job.customer.phone && <p><strong>Phone:</strong> {job.customer.phone}</p>}
              {job.customer.address && <p><strong>Address:</strong> {job.customer.address}</p>}
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-2">Items & Services</h3>
          <table className="w-full border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">Item</th>
                <th className="p-2 text-left">Description</th>
                <th className="p-2 text-right">Quantity</th>
                <th className="p-2 text-right">Unit Price</th>
                <th className="p-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {job.items.map((item) => (
                <tr key={item.id} className="border-b border-gray-200">
                  <td className="p-2">{item.name}</td>
                  <td className="p-2">{item.description || '-'}</td>
                  <td className="p-2 text-right">{item.quantity}</td>
                  <td className="p-2 text-right">${item.unit_price.toFixed(2)}</td>
                  <td className="p-2 text-right">${(item.quantity * item.unit_price).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-64">
            <div className="flex justify-between py-2">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2">
              <span>Tax:</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 font-semibold border-t border-gray-300">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {job.notes && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-2">Notes</h3>
            <p className="p-3 bg-gray-50 rounded">{job.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 mt-12 pt-4 border-t border-gray-200">
          <p>Thank you for your business!</p>
        </div>
      </div>
    );
  }
);

JobPdfTemplate.displayName = 'JobPdfTemplate'; 