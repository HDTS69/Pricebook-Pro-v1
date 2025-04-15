import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CustomerProvider } from '@/contexts/CustomerContext';
import { CustomerDetailsSection } from '@/components/pricebook/CustomerDetailsSection';
import { Customer } from '@/types/quote';

// Mock customer data
const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'Test Customer',
    email: 'test@example.com',
    phone: '555-1234',
    mobile_phone: '555-5678',
    billing_address: {
      street: '123 Test St',
      city: 'Test City',
      state: 'TS',
      postcode: '12345',
      country: 'Test Country'
    }
  },
  {
    id: '2',
    name: 'Another Customer',
    email: 'another@example.com',
    phone: '555-4321',
    mobile_phone: null,
    billing_address: null
  }
];

// Mock the customers module
jest.mock('@/mock/customers', () => ({
  customers: mockCustomers,
  getCustomerById: (id: string) => mockCustomers.find(customer => customer.id === id),
  findCustomers: (query: string) => mockCustomers.filter(customer => 
    customer.name.toLowerCase().includes(query.toLowerCase()) ||
    (customer.email?.toLowerCase() || '').includes(query.toLowerCase())
  ),
  getCustomersWithQuoteStats: () => mockCustomers.map(customer => ({
    ...customer,
    totalQuotes: customer.id === '1' ? 1 : 0,
    lastQuoteDate: customer.id === '1' ? '2024-04-01' : ''
  }))
}));

describe('CustomerSelection', () => {
  test('should show customer selection UI when no customer is selected', () => {
    render(
      <CustomerProvider>
        <CustomerDetailsSection />
      </CustomerProvider>
    );

    // Should show "Select a customer" message
    expect(screen.getByText('Select a Customer')).toBeInTheDocument();
    expect(screen.getByText('Please select a customer to view details.')).toBeInTheDocument();
  });

  test('should show customer selection UI and allow selecting a customer', async () => {
    // Render component with mock customer already selected
    const mockSelect = jest.fn();
    
    render(
      <CustomerProvider>
        <CustomerDetailsSection 
          customer={mockCustomers[0]}
          onCustomerSelect={mockSelect}
        />
      </CustomerProvider>
    );

    // Should show customer details initially
    expect(screen.getByText('Customer')).toBeInTheDocument();
    expect(screen.getByText('Test Customer')).toBeInTheDocument();
    
    // Find and click the "Select Customer" button (icon)
    const selectButton = screen.getByTitle('Select Customer');
    fireEvent.click(selectButton);
    
    // Should now show selection UI with search input
    expect(screen.getByPlaceholderText('Search customers...')).toBeInTheDocument();
    
    // Check that customer list is shown
    expect(screen.getAllByText('Test Customer')[0]).toBeInTheDocument();
    expect(screen.getByText('Another Customer')).toBeInTheDocument();
    
    // Click on a different customer
    fireEvent.click(screen.getByText('Another Customer'));
    
    // Selection function should be called with the correct customer ID
    expect(mockSelect).toHaveBeenCalledWith('2');
  });
  
  test('should allow filtering customers in selection UI', async () => {
    // Render component with mock customer already selected
    render(
      <CustomerProvider>
        <CustomerDetailsSection 
          customer={mockCustomers[0]}
        />
      </CustomerProvider>
    );
    
    // Find and click the "Select Customer" button
    const selectButton = screen.getByTitle('Select Customer');
    fireEvent.click(selectButton);
    
    // Get the search input and type in it
    const searchInput = screen.getByPlaceholderText('Search customers...');
    fireEvent.change(searchInput, { target: { value: 'another' } });
    
    // Should only show matching customer
    expect(screen.queryByText('Test Customer')).not.toBeInTheDocument();
    expect(screen.getByText('Another Customer')).toBeInTheDocument();
  });
  
  test('should open customer selection UI when clicking on message', () => {
    const mockSelect = jest.fn();
    
    render(
      <CustomerProvider>
        <CustomerDetailsSection onCustomerSelect={mockSelect} />
      </CustomerProvider>
    );
    
    // Initially shows message
    const message = screen.getByText('Please select a customer to view details.');
    expect(message).toBeInTheDocument();
    
    // Click on the message
    fireEvent.click(message);
    
    // Should now show selection UI
    expect(screen.getByPlaceholderText('Search customers...')).toBeInTheDocument();
    
    // Check that customer list is shown
    expect(screen.getByText('Test Customer')).toBeInTheDocument();
    expect(screen.getByText('Another Customer')).toBeInTheDocument();
    
    // Verify we can select a customer
    fireEvent.click(screen.getByText('Test Customer'));
    
    // Selection function should be called with the correct customer ID
    expect(mockSelect).toHaveBeenCalledWith('1');
  });
}); 