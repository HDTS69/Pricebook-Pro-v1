import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CustomerProvider, useCustomers } from '../CustomerContext';
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
    totalQuotes: 3,
    lastQuoteDate: '2024-04-01'
  }))
}));

// Test component that uses the customer context
function TestComponent() {
  const { 
    allCustomers, 
    customersWithStats, 
    selectedCustomer, 
    searchCustomers, 
    selectCustomer, 
    updateCustomer 
  } = useCustomers();

  return (
    <div>
      <div data-testid="all-customers-count">{allCustomers.length}</div>
      <div data-testid="customers-with-stats-count">{customersWithStats.length}</div>
      <div data-testid="selected-customer-name">{selectedCustomer?.name || 'No customer selected'}</div>
      <button 
        data-testid="select-customer" 
        onClick={() => selectCustomer('1')}
      >
        Select Customer
      </button>
      <button 
        data-testid="update-customer" 
        onClick={() => updateCustomer({...mockCustomers[0], name: 'Updated Name'})}
      >
        Update Customer
      </button>
      <button 
        data-testid="search-customers" 
        onClick={() => {
          const results = searchCustomers('another');
          document.getElementById('search-results')!.textContent = results.length.toString();
        }}
      >
        Search Customers
      </button>
      <div id="search-results"></div>
    </div>
  );
}

describe('CustomerContext', () => {
  test('provides customer data to components', async () => {
    render(
      <CustomerProvider>
        <TestComponent />
      </CustomerProvider>
    );

    // Check initial state
    expect(screen.getByTestId('all-customers-count')).toHaveTextContent('2');
    expect(screen.getByTestId('customers-with-stats-count')).toHaveTextContent('2');
    expect(screen.getByTestId('selected-customer-name')).toHaveTextContent('No customer selected');

    // Test selectCustomer
    fireEvent.click(screen.getByTestId('select-customer'));
    expect(screen.getByTestId('selected-customer-name')).toHaveTextContent('Test Customer');

    // Test updateCustomer
    fireEvent.click(screen.getByTestId('update-customer'));
    expect(screen.getByTestId('selected-customer-name')).toHaveTextContent('Updated Name');

    // Test searchCustomers
    fireEvent.click(screen.getByTestId('search-customers'));
    await waitFor(() => {
      expect(document.getElementById('search-results')).toHaveTextContent('1');
    });
  });

  test('throws error when used outside provider', () => {
    // Suppress console.error for this test to avoid noisy output
    const originalError = console.error;
    console.error = jest.fn();
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useCustomers must be used within a CustomerProvider');
    
    // Restore console.error
    console.error = originalError;
  });
}); 