import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PricebookPage } from './PricebookPage';
import * as servicem8 from '@/lib/servicem8';
import { useToast } from '@/hooks/use-toast';
import { Customer } from '@/types/quote';

// --- Mocks ---
jest.mock('@/lib/servicem8');
jest.mock('@/hooks/use-toast', () => ({ useToast: jest.fn() }));
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: { access_token: 'mock_token' } }, error: null }),
      onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }),
    },
    // Add other mocks if needed by the component
  },
}));
// Mock components used heavily (Dialogs, Select, CategoryView, CurrentQuoteSidebar)
// Keep mocks simple to avoid testing implementation details of children
jest.mock('@/components/pricebook/AddCustomerDialog', () => ({
    AddCustomerDialog: ({ isOpen, onSubmit }: { isOpen: boolean, onSubmit: (data: any) => Promise<void> }) => isOpen ? (
        <form data-testid="mock-add-customer-dialog" onSubmit={(e) => { 
            e.preventDefault(); 
            onSubmit({ name: 'Mock New Customer', billing_address: { street: 'mock' } }); // Simulate submission
        }}>
            <button type="submit">Submit Mock Customer</button>
        </form>
    ) : null
}));
jest.mock('@/components/pricebook/CurrentQuoteSidebar', () => ({
    CurrentQuoteSidebar: ({ onUpdateCustomer }: { onUpdateCustomer: (c: Customer)=> void }) => (
        <div data-testid="mock-sidebar">
            <button onClick={() => onUpdateCustomer({ id: 'cust-1', name: 'Updated via Mock' } as Customer)}>Update Mock Customer</button>
        </div>
    )
}));
jest.mock('@/components/ui/Select', () => ({
    Select: ({ children }: {children: React.ReactNode}) => <div>{children}</div>,
    SelectTrigger: ({ children }: {children: React.ReactNode}) => <button>{children}</button>,
    SelectContent: ({ children }: {children: React.ReactNode}) => <div>{children}</div>,
    SelectItem: ({ children, value }: {children: React.ReactNode, value: string}) => <option value={value}>{children}</option>,
    SelectValue: ({ placeholder }: {placeholder: string}) => <span>{placeholder}</span>,
}));
// Add mocks for Button, Label, Tooltip etc. if needed by direct usage in PricebookPage
jest.mock('@/components/ui/Button', () => ({ children, onClick, disabled }: { children: React.ReactNode, onClick?: () => void, disabled?: boolean }) => <button onClick={onClick} disabled={disabled}>{children}</button>);
jest.mock('@/components/ui/label', () => ({ children }: { children: React.ReactNode }) => <label>{children}</label>);

// --- Test Suite ---
describe('PricebookPage', () => {
  // Mocked functions
  const mockFetchCustomers = servicem8.fetchServiceM8Customers as jest.Mock;
  const mockCreateCustomer = servicem8.createServiceM8Customer as jest.Mock;
  const mockUpdateCustomer = servicem8.updateServiceM8Customer as jest.Mock;
  const mockFetchSingleCustomer = servicem8.fetchServiceM8Customer as jest.Mock;
  const mockToast = jest.fn();

  // Initial mock customer data
  const mockCustomer1: Customer = { 
    id: 'cust-1', name: 'Customer Alpha', email: 'alpha@test.com', phone: null, mobile_phone: null,
    billing_address: { street: '1 Alpha St', city: 'A City', state: 'AS', postcode: '1111', country: 'AUS' }
  };
  const mockCustomer2: Customer = { 
    id: 'cust-2', name: 'Customer Beta', email: 'beta@test.com', phone: null, mobile_phone: null,
    billing_address: { street: '2 Beta St', city: 'B City', state: 'BS', postcode: '2222', country: 'AUS' }
  };

  beforeEach(() => {
    // Reset mocks
    mockFetchCustomers.mockClear();
    mockCreateCustomer.mockClear();
    mockUpdateCustomer.mockClear();
    mockFetchSingleCustomer.mockClear();
    mockToast.mockClear();
    // Setup default mocks
    (useToast as jest.Mock).mockReturnValue({ toast: mockToast });
    mockFetchCustomers.mockResolvedValue([mockCustomer1, mockCustomer2]);
  });

  // Helper to render and wait for initial load
  const renderAndWait = async () => {
      render(<PricebookPage />);
      // Wait for customers to load and be displayed (e.g., in select placeholder)
      await waitFor(() => expect(screen.getByText(mockCustomer1.name)).toBeInTheDocument()); 
  };

  it('should show success toast after adding a new customer', async () => {
    const user = userEvent.setup();
    const newCustomerId = 'cust-new';
    const newCustomerData = { name: 'New Mock Customer' } as Omit<Customer, 'id'>;
    const fetchedNewCustomer = { ...newCustomerData, id: newCustomerId } as Customer;

    mockCreateCustomer.mockResolvedValue(newCustomerId);
    mockFetchSingleCustomer.mockResolvedValue(fetchedNewCustomer); // Mock fetch after create
    await renderAndWait();

    // Open the add dialog (find button and click)
    // Need to add an accessible name or test ID to the button
    const addButton = screen.getByRole('button', { name: /add new customer/i });
    await user.click(addButton);

    // Find mock dialog and trigger its submission
    const mockDialogSubmit = await screen.findByRole('button', { name: /submit mock customer/i });
    await user.click(mockDialogSubmit);

    // Assertions
    await waitFor(() => {
      expect(mockCreateCustomer).toHaveBeenCalledTimes(1);
      expect(mockFetchSingleCustomer).toHaveBeenCalledWith(newCustomerId);
      expect(mockToast).toHaveBeenCalledTimes(1);
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: expect.stringMatching(/success/i),
        description: expect.stringMatching(/customer added/i),
      }));
    });
    // Check if new customer is selected/displayed (optional)
    // expect(screen.getByText(fetchedNewCustomer.name)).toBeInTheDocument(); 
  });

  it('should show error toast if adding a new customer fails', async () => {
    const user = userEvent.setup();
    const errorMsg = "Failed to create customer via API";
    mockCreateCustomer.mockRejectedValue(new Error(errorMsg));
    await renderAndWait();

    const addButton = screen.getByRole('button', { name: /add new customer/i });
    await user.click(addButton);

    const mockDialogSubmit = await screen.findByRole('button', { name: /submit mock customer/i });
    await user.click(mockDialogSubmit);

    await waitFor(() => {
      expect(mockCreateCustomer).toHaveBeenCalledTimes(1);
      expect(mockToast).toHaveBeenCalledTimes(1);
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        variant: 'destructive',
        title: expect.stringMatching(/error/i),
        description: expect.stringContaining(errorMsg),
      }));
    });
  });

  it('should show success toast after updating a customer', async () => {
    const user = userEvent.setup();
    mockUpdateCustomer.mockResolvedValue(true); // Simulate successful update
    await renderAndWait();

    // Simulate update trigger from sidebar mock
    const updateButton = await screen.findByRole('button', { name: /update mock customer/i });
    await user.click(updateButton);

    await waitFor(() => {
      expect(mockUpdateCustomer).toHaveBeenCalledTimes(1);
      expect(mockToast).toHaveBeenCalledTimes(1);
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: expect.stringMatching(/success/i),
        description: expect.stringMatching(/customer updated/i),
      }));
    });
  });

  it('should show error toast if updating a customer fails', async () => {
    const user = userEvent.setup();
    const errorMsg = "API update failed";
    mockUpdateCustomer.mockRejectedValue(new Error(errorMsg));
    await renderAndWait();

    const updateButton = await screen.findByRole('button', { name: /update mock customer/i });
    await user.click(updateButton);

    await waitFor(() => {
      expect(mockUpdateCustomer).toHaveBeenCalledTimes(1);
      expect(mockToast).toHaveBeenCalledTimes(1);
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        variant: 'destructive',
        title: expect.stringMatching(/error/i),
        description: expect.stringContaining(errorMsg),
      }));
    });
  });

}); 