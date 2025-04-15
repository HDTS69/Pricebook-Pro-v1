import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CustomerProvider, useCustomers } from '@/contexts/CustomerContext';
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

// Test component that uses the customer context and details section
function TestComponent() {
  const { selectedCustomer, selectCustomer } = useCustomers();
  
  return (
    <div>
      <div data-testid="selected-customer-id">{selectedCustomer?.id || 'none'}</div>
      <button 
        data-testid="select-customer-1" 
        onClick={() => selectCustomer('1')}
      >
        Select Customer 1
      </button>
      <button 
        data-testid="select-customer-2" 
        onClick={() => selectCustomer('2')}
      >
        Select Customer 2
      </button>
      <CustomerDetailsSection />
    </div>
  );
}

describe('Customer Selection Integration', () => {
  test('CustomerContext provides data to CustomerDetailsSection', () => {
    render(
      <CustomerProvider>
        <TestComponent />
      </CustomerProvider>
    );
    
    // Initially no customer is selected
    expect(screen.getByText('Select a Customer')).toBeInTheDocument();
    expect(screen.getByTestId('selected-customer-id')).toHaveTextContent('none');
    
    // Select a customer
    fireEvent.click(screen.getByTestId('select-customer-1'));
    
    // Component should update with customer details
    expect(screen.getByTestId('selected-customer-id')).toHaveTextContent('1');
    expect(screen.getByText('Test Customer')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    
    // Change to another customer
    fireEvent.click(screen.getByTestId('select-customer-2'));
    
    // Component should update with new customer details
    expect(screen.getByTestId('selected-customer-id')).toHaveTextContent('2');
    expect(screen.getByText('Another Customer')).toBeInTheDocument();
    expect(screen.getByText('another@example.com')).toBeInTheDocument();
  });
  
  test('CustomerDetailsSection allows selecting a customer directly', () => {
    render(
      <CustomerProvider>
        <TestComponent />
      </CustomerProvider>
    );
    
    // Click customer selection button in the section
    const selectCustomerButton = screen.getByTitle('Select Customer');
    fireEvent.click(selectCustomerButton);
    
    // Search input and customer list should appear
    expect(screen.getByPlaceholderText('Search customers...')).toBeInTheDocument();
    expect(screen.getByText('Test Customer')).toBeInTheDocument();
    expect(screen.getByText('Another Customer')).toBeInTheDocument();
    
    // Select a customer from the list
    fireEvent.click(screen.getAllByText('Another Customer')[0]); 
    
    // The selected customer should be displayed
    expect(screen.getByTestId('selected-customer-id')).toHaveTextContent('2');
    expect(screen.getByText('Another Customer')).toBeInTheDocument();
  });
}); 