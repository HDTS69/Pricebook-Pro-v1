// Import the functions we are testing
import { 
    fetchServiceM8Customers, 
    fetchServiceM8Customer, 
    updateServiceM8Customer, 
    createServiceM8Customer,
    // We also need the contact functions if we test them directly later
    fetchPrimaryCompanyContact,
    updatePrimaryCompanyContact,
    createPrimaryCompanyContact
} from './servicem8'; 
// Import types used in tests
import { Customer } from '@/types/quote'; // <<< ADDED Customer import
// import { ServiceM8CompanyContact } from './servicem8'; // Type is defined in the file itself

// Mock the global fetch function
global.fetch = jest.fn();

// REMOVED module mock for './servicem8'
// // Option 1: Mock the whole module (if auth helper is internal)
// jest.mock('./servicem8', () => {
//   const originalModule = jest.requireActual('./servicem8');
//   return {
//     ...originalModule, 
//   };
// });

// Mock supabase functions globally for these tests
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: { access_token: 'mock_supabase_token' } }, error: null }),
    },
    functions: {
      invoke: jest.fn(), // Default mock, configure per test case
    },
  },
}));

// Helper to get the mock invoke function
const getMockSupabaseInvoke = () => {
    const { supabase } = require('@/lib/supabase');
    return supabase.functions.invoke as jest.Mock;
}

// --- Mocks for fetchPrimaryCompanyContact --- 
// Test is now possible as the function is exported

describe('ServiceM8 API Functions', () => {

  beforeEach(() => {
    // Reset mocks before each test
    (fetch as jest.Mock).mockClear();
    getMockSupabaseInvoke().mockClear();
    // Reset getSession mock if needed, but it's usually static
    // const { supabase } = require('@/lib/supabase'); 
    // supabase.auth.getSession.mockClear(); 
  });

  // --- Tests for getActiveServiceM8Token (indirectly tested via others) ---
  describe('getActiveServiceM8Token Error Handling', () => {
      // Test the exported function directly
      const { getActiveServiceM8Token } = require('./servicem8'); 

      it('should return null if the edge function invocation fails', async () => {
          const invokeMock = getMockSupabaseInvoke();
          const mockError = new Error("Edge Function crashed!");
          invokeMock.mockRejectedValue(mockError);
          // invokeMock.mockResolvedValue({ error: mockError }); // Alternative failure mode

          console.error = jest.fn(); // Suppress console.error output for this test

          const token = await getActiveServiceM8Token();

          expect(token).toBeNull();
          expect(invokeMock).toHaveBeenCalledTimes(1);
          expect(invokeMock).toHaveBeenCalledWith('get-servicem8-token', expect.anything());
          // Check if error was logged
          expect(console.error).toHaveBeenCalledWith(
              expect.stringContaining('Error calling get-servicem8-token function:'), 
              expect.any(Error) // Check that an Error object was logged
          );
          (console.error as jest.Mock).mockRestore(); // Restore console.error
      });

      it('should return null if the edge function returns no accessToken', async () => {
          const invokeMock = getMockSupabaseInvoke();
          invokeMock.mockResolvedValue({ data: { someOtherData: 'foo' }, error: null }); // No accessToken

          console.error = jest.fn(); // Suppress console.error

          const token = await getActiveServiceM8Token();

          expect(token).toBeNull();
          expect(invokeMock).toHaveBeenCalledTimes(1);
          expect(invokeMock).toHaveBeenCalledWith('get-servicem8-token', expect.anything());
          expect(console.error).toHaveBeenCalledWith(
              'get-servicem8-token function did not return an access token.',
              { someOtherData: 'foo' } // Check that the data was logged
          );
          (console.error as jest.Mock).mockRestore(); 
      });
       it('should return null if Supabase session is not found', async () => {
          // Mock getSession to return no session
          const { supabase } = require('@/lib/supabase');
          supabase.auth.getSession.mockResolvedValueOnce({ data: { session: null }, error: null });
          const invokeMock = getMockSupabaseInvoke();

          console.error = jest.fn(); // Suppress console.error

          const token = await getActiveServiceM8Token();

          expect(token).toBeNull();
          expect(invokeMock).not.toHaveBeenCalled(); // Should not attempt invoke if no session
          expect(console.error).toHaveBeenCalledWith(
              expect.stringContaining("Supabase session error:"),
              null // Or the specific error object if getSession returned one
          );
          expect(console.error).toHaveBeenCalledWith(
              expect.stringContaining("Error getting ServiceM8 token:"),
              expect.stringContaining('User session not found')
          );
          (console.error as jest.Mock).mockRestore();
          // Restore getSession mock for other tests if necessary
          supabase.auth.getSession.mockResolvedValue({ data: { session: { access_token: 'mock_supabase_token' } }, error: null }); 
      });
  });

  // --- Tests for fetchPrimaryCompanyContact ---
  describe('fetchPrimaryCompanyContact', () => {
      // Add tests specifically for this function if desired
      it('should correctly build the URL and handle the fetch response', async () => {
          const companyId = 'test-comp-id';
          const accessToken = 'test-token';
          const mockContact = { uuid: 'contact-id', company_uuid: companyId, email:'test@contact.com', is_primary_contact: 1 };
          (fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => [mockContact] });

          const contact = await fetchPrimaryCompanyContact(companyId, accessToken);

          expect(fetch).toHaveBeenCalledTimes(1);
          const expectedUrl = `https://api.servicem8.com/api_1.0/companycontact.json?$filter=${encodeURIComponent(`company_uuid eq '${companyId}' and is_primary_contact eq 1`)}`;
          expect(fetch).toHaveBeenCalledWith(expectedUrl, {
              headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Accept': 'application/json',
              },
          });
          expect(contact).toEqual(mockContact);
      });
  });

  // --- Tests for fetchServiceM8Customers (with Contact Fetching) ---
  describe('fetchServiceM8Customers (with Contact Fetching)', () => {
    
    it('should fetch companies AND their primary contacts', async () => {
        // Mock getActiveServiceM8Token response (via supabase mock)
        getMockSupabaseInvoke().mockResolvedValueOnce({ data: { accessToken: 'mock_s8_token' }, error: null });

        // Mock fetch for Companies (/company.json)
        const mockCompanies = [
            { uuid: 'comp-1', name: 'Company A', address_street: '1 Street' },
            { uuid: 'comp-2', name: 'Company B', address_street: '2 Street' },
        ];
        (fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => mockCompanies });

        // Mock fetch for Primary Contact of Company A 
        const mockContactA = { uuid: 'cont-a', company_uuid: 'comp-1', email: 'a@example.com', is_primary_contact: 1 };
        (fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => [mockContactA] });

         // Mock fetch for Primary Contact of Company B (no contact found)
         (fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => [] });

        // EXECUTE
        const customers = await fetchServiceM8Customers();

        // VERIFY
        expect(customers).toHaveLength(2);
        expect(customers[0].name).toBe('Company A');
        expect(customers[0].email).toBe('a@example.com'); 
        expect(customers[1].name).toBe('Company B');
        expect(customers[1].email).toBeNull(); 
        
        expect(getMockSupabaseInvoke()).toHaveBeenCalledTimes(1);
        expect(getMockSupabaseInvoke()).toHaveBeenCalledWith('get-servicem8-token', expect.anything());
        expect(fetch).toHaveBeenCalledTimes(3); // 1 token + 1 company + 2 contacts (via fetchPrimaryCompanyContact calls)
        expect(fetch).toHaveBeenCalledWith( expect.stringContaining('/company.json'), expect.anything());
        expect(fetch).toHaveBeenCalledWith( expect.stringContaining(`/companycontact.json?%24filter=${encodeURIComponent(`company_uuid eq 'comp-1' and is_primary_contact eq 1`)}`), expect.anything());
        expect(fetch).toHaveBeenCalledWith( expect.stringContaining(`/companycontact.json?%24filter=${encodeURIComponent(`company_uuid eq 'comp-2' and is_primary_contact eq 1`)}`), expect.anything());
    });
  });

  // --- Tests for fetchServiceM8Customer (with Contact Fetching) ---
  describe('fetchServiceM8Customer (with Contact Fetching)', () => {
    it('should fetch a single company AND its primary contact', async () => {
        const customerId = 'comp-single';
        getMockSupabaseInvoke().mockResolvedValueOnce({ data: { accessToken: 'mock_s8_token' }, error: null });

        // Mock fetch for Company
        const mockCompany = { uuid: customerId, name: 'Single Co', address_street: '1 Single St' };
        (fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => mockCompany });

        // Mock fetch for Primary Contact
        const mockContact = { uuid: 'cont-single', company_uuid: customerId, email: 'single@example.com', is_primary_contact: 1 };
        (fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => [mockContact] });

        const customer = await fetchServiceM8Customer(customerId);

        expect(customer).not.toBeNull();
        expect(customer?.id).toBe(customerId);
        expect(customer?.name).toBe('Single Co');
        expect(customer?.email).toBe('single@example.com'); 
        
        expect(getMockSupabaseInvoke()).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledTimes(2); // 1 company, 1 contact (via fetchPrimaryCompanyContact)
        expect(fetch).toHaveBeenCalledWith(expect.stringContaining(`/company/${customerId}.json`), expect.anything());
        expect(fetch).toHaveBeenCalledWith(expect.stringContaining(`/companycontact.json?%24filter=${encodeURIComponent(`company_uuid eq '${customerId}' and is_primary_contact eq 1`)}`), expect.anything());
    });
  });

  // --- Tests for updateServiceM8Customer (with Contact Update) ---
  describe('updateServiceM8Customer (with Contact Update)', () => {
     it('should update company AND update primary contact details', async () => {
        const customerToUpdate: Customer = {
            id: 'comp-update',
            name: 'Updated Name',
            email: 'updated@example.com',
            phone: '0123456789',
            mobile_phone: '9876543210',
            billing_address: { street: 'Up St', city: 'Up City', state: 'UP', postcode: '1234', country: 'AUS' },
        };
        const existingContactId = 'cont-update';

        getMockSupabaseInvoke().mockResolvedValue({ data: { accessToken: 'mock_s8_token' }, error: null }); // Mock token needed for update AND contact fetch/update

        // 1. Mock Company Update (POST /company/{id}.json)
        (fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) });

        // 2. Mock Primary Contact Fetch (fetchPrimaryCompanyContact call)
        const mockExistingContact = { uuid: existingContactId, company_uuid: customerToUpdate.id, email: 'old@example.com', is_primary_contact: 1 };
        (fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => [mockExistingContact] });

        // 3. Mock Contact Update (updatePrimaryCompanyContact call)
        (fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) });

        const success = await updateServiceM8Customer(customerToUpdate);

        expect(success).toBe(true);
        expect(getMockSupabaseInvoke()).toHaveBeenCalledTimes(1); // Only called once by updateServiceM8Customer itself
        expect(fetch).toHaveBeenCalledTimes(3); // 1 company update + 1 contact fetch + 1 contact update

        // Check company update call (POST)
        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining(`/company/${customerToUpdate.id}.json`),
            expect.objectContaining({ method: 'POST' /* ... other details */ })
        );
        // Check contact fetch call (via fetchPrimaryCompanyContact)
        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining(`/companycontact.json?%24filter=${encodeURIComponent(`company_uuid eq '${customerToUpdate.id}' and is_primary_contact eq 1`)}`),
            expect.objectContaining({ headers: { 'Authorization': 'Bearer mock_s8_token' } })
        );
        // Check contact update call (via updatePrimaryCompanyContact)
        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining(`/companycontact/${existingContactId}.json`),
            expect.objectContaining({ method: 'POST' /* ... other details */ })
        );
     });
  });

  // --- Tests for createServiceM8Customer (with Contact Creation) ---
   describe('createServiceM8Customer (with Contact Creation)', () => {
     it('should create company AND THEN create primary contact', async () => {
        const customerToCreate: Omit<Customer, 'id'> = {
            name: 'New Company Ltd',
            email: 'new@example.com',
            phone: '111111111',
            mobile_phone: '222222222',
            billing_address: { street: 'New St', city: 'New City', state: 'NW', postcode: '5678', country: 'AUS' },
        };
        const newCompanyId = 'comp-new-abc';
        const newContactId = 'cont-new-xyz';

        getMockSupabaseInvoke().mockResolvedValue({ data: { accessToken: 'mock_s8_token' }, error: null }); // Mock token

        // 1. Mock Company Create (POST /company.json)
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true, status: 201, headers: { get: (h:string) => h==='Location'?`/api_1.0/company/${newCompanyId}.json`:null }, json: async () => ({ uuid: newCompanyId }),
        });

        // 2. Mock Contact Create (createPrimaryCompanyContact call)
         (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true, status: 201, headers: { get: (h:string) => h==='Location'?`/api_1.0/companycontact/${newContactId}.json`:null }, json: async () => ({ uuid: newContactId }),
        });

        const createdCompanyId = await createServiceM8Customer(customerToCreate);

        expect(createdCompanyId).toBe(newCompanyId);
        expect(getMockSupabaseInvoke()).toHaveBeenCalledTimes(1); // Called once by createServiceM8Customer
        expect(fetch).toHaveBeenCalledTimes(2); // 1 company create, 1 contact create

        // Check company create call
        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining(`/company.json`),
            expect.objectContaining({ method: 'POST' /* ... */ })
        );
        // Check contact create call (via createPrimaryCompanyContact)
        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining(`/companycontact.json`),
            expect.objectContaining({ method: 'POST' /* ... */ })
        );
     });
   });

});
