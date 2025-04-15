import React, { useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Customer } from '@/types/quote'; // Import Customer type

// Define the props interface
interface AddCustomerDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (customerData: Omit<Customer, 'id'>) => Promise<void>; // Make onSubmit async
}

// Define the initial empty state for the form
const initialFormData: Omit<Customer, 'id'> = {
  name: '',
  email: null, // Make optional fields explicitly nullable
  phone: null,
  mobile_phone: null,
  billing_address: {
    street: '',
    city: '',
    state: '',
    postcode: '',
    country: 'Australia', // Default country
  },
};

export function AddCustomerDialog({ isOpen, onOpenChange, onSubmit }: AddCustomerDialogProps) {
  const [formData, setFormData] = useState<Omit<Customer, 'id'>>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generic handler for text input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? null : value, // Store empty strings as null for optional fields
    }));
  };

  // Specific handler for address changes
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      billing_address: {
        ...(prev.billing_address ?? {}), // Ensure billing_address exists
        [name]: value,
      },
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(formData);
      // Optionally reset form or close dialog on success (handled by parent)
      // setFormData(initialFormData);
      // onOpenChange(false); 
    } catch (err: any) { // Catch potential errors from the async onSubmit
      console.error("Error submitting new customer:", err);
      setError(err.message || "Failed to add customer. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close and reset form handler
  const handleClose = () => {
    setFormData(initialFormData); // Reset form on close
    setError(null);
    setIsSubmitting(false);
    onOpenChange(false);
  };

  // Render the dialog
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}> 
      <DialogContent className="sm:max-w-[550px]"> {/* Wider dialog for form */}
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
            <DialogDescription>
              Enter the details for the new customer. Address information is required.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4"> 
            {/* Customer Name (Required) */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Customer Name
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="col-span-3"
                required // Make name required
                disabled={isSubmitting}
              />
            </div>

            {/* Email (Optional) */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email ?? ''} // Handle null value for input
                onChange={handleInputChange}
                className="col-span-3"
                disabled={isSubmitting}
              />
            </div>

            {/* Phone (Optional) */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Phone
              </Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone ?? ''}
                onChange={handleInputChange}
                className="col-span-3"
                disabled={isSubmitting}
              />
            </div>

            {/* Mobile (Optional) */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="mobile_phone" className="text-right">
                Mobile
              </Label>
              <Input
                id="mobile_phone"
                name="mobile_phone"
                value={formData.mobile_phone ?? ''}
                onChange={handleInputChange}
                className="col-span-3"
                disabled={isSubmitting}
              />
            </div>

            {/* --- Address Fields (Assume Required for ServiceM8) --- */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="street" className="text-right">
                Street Address
              </Label>
              <Input
                id="street"
                name="street"
                value={formData.billing_address?.street ?? ''}
                onChange={handleAddressChange}
                className="col-span-3"
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="city" className="text-right">
                City
              </Label>
              <Input
                id="city"
                name="city"
                value={formData.billing_address?.city ?? ''}
                onChange={handleAddressChange}
                className="col-span-3"
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="state" className="text-right">
                State
              </Label>
              <Input // TODO: Consider a Select for State?
                id="state"
                name="state"
                value={formData.billing_address?.state ?? ''}
                onChange={handleAddressChange}
                className="col-span-3"
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="postcode" className="text-right">
                Postcode
              </Label>
              <Input
                id="postcode"
                name="postcode"
                value={formData.billing_address?.postcode ?? ''}
                onChange={handleAddressChange}
                className="col-span-3"
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="country" className="text-right">
                Country
              </Label>
              <Input
                id="country"
                name="country"
                value={formData.billing_address?.country ?? ''}
                onChange={handleAddressChange}
                className="col-span-3"
                required
                disabled={isSubmitting}
              />
            </div>
            {/* Display error message if any */}
            {error && (
              <p className="col-span-4 text-sm text-destructive text-center">{error}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.name}> {/* Disable if submitting or name is empty */}
              {isSubmitting ? "Adding..." : "Add Customer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 