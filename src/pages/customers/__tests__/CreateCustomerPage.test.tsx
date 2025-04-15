import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { CreateCustomerPage } from '../CreateCustomerPage';
import { CustomerProvider } from '@/contexts/CustomerContext';
import * as toastHooks from '@/hooks/use-toast';

// Mock the modules we need
vi.mock('@/contexts/CustomerContext', () => ({
  CustomerProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useCustomers: () => ({
    createCustomer: mockCreateCustomer,
    isLoadingCustomers: false,
  }),
}));

vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Create mocks for functions
const mockCreateCustomer = vi.fn();
const mockNavigate = vi.fn();
const mockToast = vi.fn();

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

describe('CreateCustomerPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders the create customer form', () => {
    render(
      <BrowserRouter>
        <CreateCustomerPage />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Add New Customer')).toBeInTheDocument();
    expect(screen.getByLabelText('Customer Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Phone')).toBeInTheDocument();
    expect(screen.getByLabelText('Mobile Phone')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Customer' })).toBeInTheDocument();
  });

  test('validates required fields', async () => {
    render(
      <BrowserRouter>
        <CreateCustomerPage />
      </BrowserRouter>
    );
    
    // Submit the form without filling required fields
    fireEvent.click(screen.getByRole('button', { name: 'Create Customer' }));
    
    // Check that validation errors are shown
    await waitFor(() => {
      expect(screen.getByText('Customer name is required')).toBeInTheDocument();
    });
    
    // Form submission should not occur
    expect(mockCreateCustomer).not.toHaveBeenCalled();
  });

  test('submits form with valid data', async () => {
    mockCreateCustomer.mockResolvedValue('new-customer-id');
    
    render(
      <BrowserRouter>
        <CreateCustomerPage />
      </BrowserRouter>
    );
    
    // Fill in form fields
    fireEvent.change(screen.getByLabelText('Customer Name'), { 
      target: { value: 'Test Customer' } 
    });
    fireEvent.change(screen.getByLabelText('Email'), { 
      target: { value: 'test@example.com' } 
    });
    fireEvent.change(screen.getByLabelText('Phone'), { 
      target: { value: '123-456-7890' } 
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Create Customer' }));
    
    // Wait for the submission to complete
    await waitFor(() => {
      expect(mockCreateCustomer).toHaveBeenCalledWith({
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '123-456-7890',
        mobile_phone: '',
        billing_address: null
      });
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Customer Created',
        description: 'The customer has been created successfully'
      });
      expect(mockNavigate).toHaveBeenCalledWith('/customers');
    });
  });

  test('handles submission errors', async () => {
    const errorMessage = 'Failed to create customer';
    mockCreateCustomer.mockRejectedValue(new Error(errorMessage));
    
    render(
      <BrowserRouter>
        <CreateCustomerPage />
      </BrowserRouter>
    );
    
    // Fill in form fields
    fireEvent.change(screen.getByLabelText('Customer Name'), { 
      target: { value: 'Test Customer' } 
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Create Customer' }));
    
    // Wait for the error handling
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage
      });
    });
  });
}); 