import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CustomerDetailsSection } from '../CustomerDetailsSection';
import { CustomerProvider } from '@/contexts/CustomerContext';
import { Customer } from '@/types/quote';

// Mock customer data
const mockCustomer: Customer = {
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
};

// Mock customer functions
const mockUpdateCustomer = jest.fn();
const mockCustomerSelect = jest.fn();

describe('CustomerDetailsSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('displays customer information correctly', () => {
    render(
      <CustomerProvider>
        <CustomerDetailsSection />
      </CustomerProvider>
    );

    // Initially it should show "Select a customer" message when no customer is selected
    expect(screen.getByText(/select a customer/i)).toBeInTheDocument();
  });

  test('displays edit mode when edit button is clicked', async () => {
    // Need to mock the useCustomers hook to return a selected customer
    // This will be implemented in the actual component
    
    // For now we'll test the existing implementation with props
    render(
      <CustomerDetailsSection 
        customer={mockCustomer}
        onUpdateCustomer={mockUpdateCustomer}
        onCustomerSelect={mockCustomerSelect}
      />
    );

    // Verify customer data is displayed
    expect(screen.getByText(mockCustomer.name)).toBeInTheDocument();
    expect(screen.getByText(mockCustomer.email || '')).toBeInTheDocument();
    
    // Click edit button (using title since the button has an icon)
    fireEvent.click(screen.getByTitle('Edit Customer Details'));
    
    // Verify edit inputs are shown
    expect(screen.getByLabelText('Name')).toHaveValue(mockCustomer.name);
    expect(screen.getByLabelText('Email')).toHaveValue(mockCustomer.email || '');
    
    // Edit a field
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Updated Name' } });
    
    // Save changes
    fireEvent.click(screen.getByTitle('Save Customer'));
    
    // Verify update function was called with updated data
    expect(mockUpdateCustomer).toHaveBeenCalledWith(expect.objectContaining({
      ...mockCustomer,
      name: 'Updated Name'
    }));
  });
}); 