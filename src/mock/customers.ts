import { Customer, Address } from '@/types/quote';

// Create a set of comprehensive, realistic customers with addresses
export const customers: Customer[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '0412 345 678',
    mobile_phone: '0412 345 678',
    billing_address: {
      street: '42 Main Street',
      city: 'Sydney',
      state: 'NSW',
      postcode: '2000',
      country: 'Australia'
    }
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '0423 456 789',
    mobile_phone: '0423 456 789',
    billing_address: {
      street: '15 High Street',
      city: 'Melbourne',
      state: 'VIC',
      postcode: '3000',
      country: 'Australia'
    }
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    phone: '0434 567 890',
    mobile_phone: null,
    billing_address: {
      street: '7 Park Avenue',
      city: 'Brisbane',
      state: 'QLD',
      postcode: '4000',
      country: 'Australia'
    }
  },
  {
    id: '4',
    name: 'Alice Brown',
    email: 'alice@example.com',
    phone: null,
    mobile_phone: '0445 678 901',
    billing_address: {
      street: '22 Ocean Drive',
      city: 'Perth',
      state: 'WA',
      postcode: '6000',
      country: 'Australia'
    }
  },
  {
    id: '5',
    name: 'Charlie Wilson',
    email: null,
    phone: '0456 789 012',
    mobile_phone: '0456 789 012',
    billing_address: null
  },
  {
    id: '6',
    name: 'Eve Davis',
    email: 'eve@example.com',
    phone: '0467 890 123',
    mobile_phone: '0467 890 123',
    billing_address: {
      street: '101 River Road',
      city: 'Adelaide',
      state: 'SA',
      postcode: '5000',
      country: 'Australia'
    }
  },
  {
    id: '7',
    name: 'Frank Miller',
    email: 'frank@example.com',
    phone: '0478 901 234',
    mobile_phone: null,
    billing_address: {
      street: '8 Queen Street',
      city: 'Hobart',
      state: 'TAS',
      postcode: '7000',
      country: 'Australia'
    }
  },
  {
    id: '8',
    name: 'Grace Taylor',
    email: 'grace@example.com',
    phone: '0489 012 345',
    mobile_phone: '0489 012 345',
    billing_address: {
      street: '55 King Street',
      city: 'Darwin',
      state: 'NT',
      postcode: '0800',
      country: 'Australia'
    }
  },
  {
    id: '9',
    name: 'HD Trade Services',
    email: 'admin@hdtradeservices.com.au',
    phone: '0490 123 456',
    mobile_phone: '0490 123 456',
    billing_address: {
      street: '10 Business Park Way',
      city: 'Canberra',
      state: 'ACT',
      postcode: '2600',
      country: 'Australia'
    }
  },
  {
    id: '10',
    name: 'Pricebook Pro Client',
    email: 'client@pricebook-pro.com',
    phone: '0491 234 567',
    mobile_phone: '0491 234 567',
    billing_address: {
      street: '200 Tech Avenue',
      city: 'Gold Coast',
      state: 'QLD',
      postcode: '4217',
      country: 'Australia'
    }
  }
];

/**
 * Get a customer by their ID
 * @param id The customer ID to look up
 * @returns The customer object or undefined if not found
 */
export function getCustomerById(id: string): Customer | undefined {
  return customers.find(customer => customer.id === id);
}

/**
 * Find customers matching a search query
 * @param query The search string to match against customer fields
 * @returns Array of matching customers
 */
export function findCustomers(query: string): Customer[] {
  if (!query) return customers;
  
  const lowercaseQuery = query.toLowerCase().trim();
  
  return customers.filter(customer => 
    customer.name.toLowerCase().includes(lowercaseQuery) ||
    (customer.email?.toLowerCase() || '').includes(lowercaseQuery) ||
    (customer.phone?.toLowerCase() || '').includes(lowercaseQuery) ||
    (customer.mobile_phone?.toLowerCase() || '').includes(lowercaseQuery) ||
    (customer.billing_address?.street?.toLowerCase() || '').includes(lowercaseQuery) ||
    (customer.billing_address?.city?.toLowerCase() || '').includes(lowercaseQuery) ||
    (customer.billing_address?.state?.toLowerCase() || '').includes(lowercaseQuery) ||
    (customer.billing_address?.postcode?.toLowerCase() || '').includes(lowercaseQuery)
  );
}

/**
 * Get customers with quote statistics
 * Used for the customers list page
 */
export function getCustomersWithQuoteStats(): Array<Customer & { totalQuotes: number; lastQuoteDate: string }> {
  // This is a mock implementation that adds quote stats to customers
  // In a real implementation, this would derive from actual quote data
  return customers.map((customer, index) => ({
    ...customer,
    totalQuotes: Math.max(0, Math.floor(Math.random() * 5)),
    lastQuoteDate: index % 3 === 0 ? '2024-04-01' : 
                   index % 3 === 1 ? '2024-03-28' : 
                   '2024-03-15'
  }));
} 