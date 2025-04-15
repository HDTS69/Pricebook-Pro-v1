import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CustomerProvider } from '@/contexts/CustomerContext';
import { CurrentQuoteSidebar } from '@/components/pricebook/CurrentQuoteSidebar';
import { Customer, Quote, Tier } from '@/types/quote';

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

// Mock quotes data
const mockQuotes: Quote[] = [
  {
    id: '101',
    customerId: '1',
    quoteNumber: 'Q-1001',
    sequenceNumber: 1,
    name: 'Test Quote 1',
    status: 'Draft',
    totalPrice: 1000,
    selectedTierId: 'gold',
    tierTasks: {
      gold: [
        { taskId: 't1', name: 'Task 1', basePrice: 500, quantity: 1, description: 'Test task 1' },
        { taskId: 't2', name: 'Task 2', basePrice: 500, quantity: 1, description: 'Test task 2' }
      ]
    },
    adjustments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Mock tiers
const mockTiers: Tier[] = [
  { id: 'gold', name: 'Gold', multiplier: 1.0, warranty: '1 year', perks: ['Premium Support', '24/7 Service'] },
  { id: 'silver', name: 'Silver', multiplier: 0.9, warranty: '6 months', perks: ['Standard Support'] },
  { id: 'bronze', name: 'Bronze', multiplier: 0.8, warranty: '3 months', perks: [] }
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

describe('CurrentQuoteSidebar Customer Selection', () => {
  // Mock all the props and handlers needed by CurrentQuoteSidebar
  const mockProps = {
    quotes: mockQuotes,
    currentQuoteId: null,
    customer: null,
    availableTiers: mockTiers,
    allCustomers: mockCustomers,
    onQuoteSelect: jest.fn(),
    onTierSelect: jest.fn(),
    onDeleteTask: jest.fn(),
    onAddTier: jest.fn(),
    onDeleteTier: jest.fn(),
    onRenameTier: jest.fn(),
    onPreviewQuote: jest.fn(),
    onUpdateCustomer: jest.fn(),
    onCustomerSelect: jest.fn(),
    onAddQuote: jest.fn(),
    onDeleteQuote: jest.fn(),
    onRenameQuote: jest.fn(),
    onUpdateTask: jest.fn(),
    onUpdateAllTasks: jest.fn(),
    onReorderTasks: jest.fn(),
    onDuplicateTier: jest.fn(),
    onClearAllTasks: jest.fn(),
    onDeleteAllQuotes: jest.fn(),
    onDuplicateQuote: jest.fn(),
    onDeleteAllTiers: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('displays the customer selection section when no customer is selected', () => {
    render(
      <CustomerProvider>
        <CurrentQuoteSidebar {...mockProps} />
      </CustomerProvider>
    );

    expect(screen.getByText('Quote Details')).toBeInTheDocument();
    expect(screen.getByText('Select a Customer')).toBeInTheDocument();
    expect(screen.getByText('Please select a customer to view details.')).toBeInTheDocument();
  });

  test('allows selecting a customer and displays their details', async () => {
    render(
      <CustomerProvider>
        <CurrentQuoteSidebar {...mockProps} />
      </CustomerProvider>
    );

    // Find and click the select customer button
    const selectCustomerButton = screen.getByTitle('Select Customer');
    fireEvent.click(selectCustomerButton);

    // Search input should appear
    const searchInput = screen.getByPlaceholderText('Search customers...');
    expect(searchInput).toBeInTheDocument();

    // Customer list should show all customers initially
    expect(screen.getByText('Test Customer')).toBeInTheDocument();
    expect(screen.getByText('Another Customer')).toBeInTheDocument();

    // Click on a customer
    fireEvent.click(screen.getByText('Test Customer'));

    // Check that the onCustomerSelect handler was called with the right ID
    expect(mockProps.onCustomerSelect).toHaveBeenCalledWith('1');
  });

  test('displays customer details and quotes when a customer is selected', () => {
    // Render with a selected customer
    const propsWithCustomer = {
      ...mockProps,
      customer: mockCustomers[0],
      quotes: mockQuotes.filter(q => q.customerId === mockCustomers[0].id)
    };

    render(
      <CustomerProvider>
        <CurrentQuoteSidebar {...propsWithCustomer} />
      </CustomerProvider>
    );

    // Customer details should be visible
    expect(screen.getByText('Customer')).toBeInTheDocument();
    expect(screen.getByText('Test Customer')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('555-1234')).toBeInTheDocument();

    // Quote dropdown should be visible with the customer's quote
    expect(screen.getByText('Current Quote')).toBeInTheDocument();
    
    // Click to open the dropdown
    fireEvent.click(screen.getByText('Create new quote'));
    
    // Customer's quote should be in the dropdown
    expect(screen.getByText(/Q-1001/)).toBeInTheDocument();
    expect(screen.getByText(/Test Quote 1/)).toBeInTheDocument();
  });
}); 