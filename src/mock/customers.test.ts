import { customers, getCustomerById, findCustomers } from './customers';
import { Customer } from '@/types/quote';

describe('Customers mock data', () => {
  it('should have a non-empty array of customers', () => {
    expect(customers).toBeDefined();
    expect(Array.isArray(customers)).toBe(true);
    expect(customers.length).toBeGreaterThan(0);
  });

  it('should have customers with all required fields', () => {
    customers.forEach((customer: Customer) => {
      expect(customer.id).toBeDefined();
      expect(customer.name).toBeDefined();
      // Check that required fields conform to the Customer interface
      const customerCheck: Customer = customer;
      expect(customerCheck).toBe(customer);
    });
  });

  it('should include customers with complete address information', () => {
    const customersWithFullAddress = customers.filter(
      (c: Customer) => c.billing_address && 
      c.billing_address.street && 
      c.billing_address.city && 
      c.billing_address.state && 
      c.billing_address.postcode
    );
    expect(customersWithFullAddress.length).toBeGreaterThan(0);
  });

  describe('getCustomerById', () => {
    it('should return a customer when given a valid ID', () => {
      const firstCustomer = customers[0];
      const retrievedCustomer = getCustomerById(firstCustomer.id);
      expect(retrievedCustomer).toEqual(firstCustomer);
    });

    it('should return undefined when given an invalid ID', () => {
      const invalidId = 'invalid-id-123';
      const retrievedCustomer = getCustomerById(invalidId);
      expect(retrievedCustomer).toBeUndefined();
    });
  });

  describe('findCustomers', () => {
    it('should return all customers when given an empty search string', () => {
      const result = findCustomers('');
      expect(result).toEqual(customers);
    });

    it('should return matching customers when searching by name', () => {
      // Take a substring from a customer's name
      const searchTerm = customers[0].name.substring(0, 3).toLowerCase();
      const result = findCustomers(searchTerm);
      
      // All returned customers should have the search term in their name
      result.forEach((customer: Customer) => {
        expect(
          customer.name.toLowerCase().includes(searchTerm) ||
          customer.email?.toLowerCase().includes(searchTerm) ||
          customer.phone?.toLowerCase().includes(searchTerm) ||
          customer.mobile_phone?.toLowerCase().includes(searchTerm) ||
          customer.billing_address?.street?.toLowerCase().includes(searchTerm) ||
          customer.billing_address?.city?.toLowerCase().includes(searchTerm) ||
          customer.billing_address?.state?.toLowerCase().includes(searchTerm) ||
          customer.billing_address?.postcode?.toLowerCase().includes(searchTerm)
        ).toBe(true);
      });
    });
  });
}); 