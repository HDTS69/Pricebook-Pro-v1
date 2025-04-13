import { Customer, Address } from '@/types/quote';
import { supabase } from '@/lib/supabase'; // Use the correct client path

// TODO: Implement proper OAuth 2.0 authentication flow for ServiceM8
// See: https://developer.servicem8.com/docs/authentication
// const getServiceM8AccessToken = async (): Promise<string | null> => {
//   // Fetch/refresh token logic here
//   console.warn("ServiceM8 authentication not implemented.");
//   return null; 
// };

// --- Authentication Helper --- 

/**
 * Calls the Supabase Edge Function to get a valid (decrypted, potentially refreshed) 
 * ServiceM8 access token.
 * Returns null if connection doesn't exist or an error occurs.
 */
async function getActiveServiceM8Token(): Promise<string | null> {
  console.log("Attempting to retrieve ServiceM8 token...");
  try {
    // Ensure user is logged in to Supabase
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      console.error('Supabase session error:', sessionError);
      throw new Error('User session not found. Please log in.');
    }
    const userAccessToken = sessionData.session.access_token;

    // Call the edge function
    const { data, error } = await supabase.functions.invoke('get-servicem8-token', {
      headers: { 'Authorization': `Bearer ${userAccessToken}` }
    });

    if (error) {
      console.error('Error calling get-servicem8-token function:', error);
      // Handle specific errors like 404 Not Connected?
      if (error.message.includes("404")) { // Simple check, might need refinement
           console.log("ServiceM8 connection not found for user.");
      } else {
          console.error("Token retrieval failed:", error.message);
      }
      return null; // Indicate failure to get token
    }

    if (!data?.accessToken) {
      console.error('get-servicem8-token function did not return an access token.', data);
      return null;
    }
    
    console.log("Successfully retrieved active ServiceM8 token.");
    return data.accessToken;

  } catch (err: any) {
    console.error("Error getting ServiceM8 token:", err.message);
    return null;
  }
}

// --- API Configuration ---
const API_BASE_URL = 'https://api.servicem8.com/api_1.0';
// const APP_ID = import.meta.env.VITE_SERVICEM8_APP_ID; 
// const APP_SECRET = import.meta.env.VITE_SERVICEM8_APP_SECRET; // Note: Secret shouldn't be exposed client-side in prod

// --- Data Mapping Utilities ---

/**
 * Maps data from the ServiceM8 Company object to our Customer type.
 * Note: Email/Phone likely come from CompanyContact, not Company.
 */
function mapServiceM8CompanyToCustomer(s8Company: any): Customer {
  const address: Address = {
    street: s8Company.address_street,
    city: s8Company.address_city,
    state: s8Company.address_state,
    postcode: s8Company.address_postcode,
    country: s8Company.address_country,
  };

  return {
    id: s8Company.uuid, // Assuming ServiceM8 response includes uuid
    name: s8Company.name,
    billing_address: address,
    // active: s8Company.active === 1, // Example if we add 'active' to our Customer type
    // website: s8Company.website, // Example if we add 'website' 
    // abn_number: s8Company.abn_number, // Example if we add 'abn_number'
    // Note: email, phone, mobile_phone are missing from Company object
    email: s8Company.primary_contact_email || null, // <<< Assuming we fetch this separately later
    phone: s8Company.primary_contact_phone || null, // <<< Assuming we fetch this separately later
    mobile_phone: s8Company.primary_contact_mobile || null, // <<< Assuming we fetch this separately later
  };
}

/**
 * Maps our Customer type to the payload expected by ServiceM8 for creating/updating a Company.
 */
function mapCustomerToServiceM8CompanyPayload(customer: Customer | Omit<Customer, 'id'>): any {
  const payload: any = {
    name: customer.name,
    active: 1, // Assuming we always create/update as active unless specified otherwise
    // website: customer.website, // If added to our type
    // abn_number: customer.abn_number, // If added to our type
    address_street: customer.billing_address?.street,
    address_city: customer.billing_address?.city,
    address_state: customer.billing_address?.state,
    address_postcode: customer.billing_address?.postcode,
    address_country: customer.billing_address?.country,
    // Note: email, phone, mobile are NOT part of the Company payload
  };

  // Only include UUID when updating (implicitly via endpoint URL)
  // if ('id' in customer) {
  //   payload.uuid = customer.id; // Usually ID is in URL for updates, not payload
  // }

  // Clean up undefined/null values which might cause issues with the API
  Object.keys(payload).forEach(key => {
    if (payload[key] === null || payload[key] === undefined) {
      delete payload[key];
    }
  });

  return payload;
}

// TODO: Implement functions to fetch/create/update the primary CompanyContact
// async function getPrimaryCompanyContact(companyId: string, accessToken: string): Promise<any | null> { ... }
// async function updatePrimaryCompanyContact(...) { ... }
// async function createPrimaryCompanyContact(...) { ... }

// --- API Functions ---

/**
 * Fetches all active companies from ServiceM8.
 * Requires OAuth scope: read_customers
 * TODO: Implement pagination if needed.
 * TODO: Fetch associated primary CompanyContact for email/phone.
 */
export async function fetchServiceM8Customers(): Promise<Customer[]> {
  const accessToken = await getActiveServiceM8Token(); // <<< Use the helper
  if (!accessToken) {
    console.error("ServiceM8 Access Token not available.");
    // Optionally: Trigger re-authentication flow?
    return []; // Return empty or throw error
  }

  try {
    console.log("Fetching companies from ServiceM8...");
    const response = await fetch(`${API_BASE_URL}/company.json?$filter=active%20eq%20'1'`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`ServiceM8 API Error: ${response.status} ${await response.text()}`);
    }
    const data = await response.json();

    if (!Array.isArray(data)) {
        console.error("Unexpected response format from ServiceM8 /company.json:", data);
        return [];
    }

    // TODO: Enhance this to fetch primary contact details for each company in parallel?
    const customers = data.map(mapServiceM8CompanyToCustomer);
    console.log("Fetched ServiceM8 Companies (mapped):", customers);
    return customers;
  } catch (error) {
    console.error("Error fetching ServiceM8 customers:", error);
    return [];
  }
}

/**
 * Fetches a single company by UUID from ServiceM8.
 * Requires OAuth scope: read_customers
 * TODO: Fetch associated primary CompanyContact for email/phone.
 */
export async function fetchServiceM8Customer(customerId: string): Promise<Customer | null> {
  const accessToken = await getActiveServiceM8Token(); // <<< Use the helper
  if (!accessToken) {
    console.error("ServiceM8 Access Token not available.");
    return null;
  }

  try {
     console.log(`Fetching company ${customerId} from ServiceM8...`);
    const response = await fetch(`${API_BASE_URL}/company/${customerId}.json`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });
    if (!response.ok) {
        if (response.status === 404) return null; // Not found
        throw new Error(`ServiceM8 API Error fetching company ${customerId}: ${response.status} ${await response.text()}`);
    }
    const data = await response.json();

    // TODO: Fetch primary contact details
    const customer = mapServiceM8CompanyToCustomer(data);
    console.log(`Fetched ServiceM8 Company ${customerId} (mapped):`, customer);
    return customer;

  } catch (error) {
    console.error(`Error fetching ServiceM8 customer ${customerId}:`, error);
    return null;
  }
}

/**
 * Updates an existing company in ServiceM8.
 * Requires OAuth scope: manage_customers
 * TODO: Implement update for associated primary CompanyContact.
 */
export async function updateServiceM8Customer(customer: Customer): Promise<boolean> {
  const accessToken = await getActiveServiceM8Token(); // <<< Use the helper
  if (!accessToken) {
    console.error("ServiceM8 Access Token not available.");
    return false;
  }

  const payload = mapCustomerToServiceM8CompanyPayload(customer);

  try {
     console.log(`Updating company ${customer.id} in ServiceM8...`);
    // Use POST to update, as per ServiceM8 examples for other objects
    const response = await fetch(`${API_BASE_URL}/company/${customer.id}.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`ServiceM8 API Error updating company ${customer.id}: ${response.status} ${await response.text()}`);
    }
    console.log(`Successfully updated ServiceM8 Company ${customer.id}`);
    // TODO: Update primary CompanyContact details (email, phone, etc.)
    return true;
  } catch (error) {
    console.error(`Error updating ServiceM8 customer ${customer.id}:`, error);
    return false;
  }
}

/**
 * Creates a new company in ServiceM8.
 * Requires OAuth scope: manage_customers
 * TODO: Implement creation of associated primary CompanyContact.
 * @returns The UUID of the newly created company, or null if failed.
 */
export async function createServiceM8Customer(customerData: Omit<Customer, 'id'>): Promise<string | null> {
  const accessToken = await getActiveServiceM8Token(); // <<< Use the helper
  if (!accessToken) {
    console.error("ServiceM8 Access Token not available.");
    return null;
  }

  const payload = mapCustomerToServiceM8CompanyPayload(customerData);

  try {
     console.log("Creating new company in ServiceM8...");
    const response = await fetch(`${API_BASE_URL}/company.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`ServiceM8 API Error creating company: ${response.status} ${await response.text()}`);
    }

    const newCompanyUUID = response.headers.get('x-record-uuid');
    if (!newCompanyUUID) {
        throw new Error("ServiceM8 did not return x-record-uuid header after creating company.");
    }
    console.log(`Successfully created ServiceM8 Company ${newCompanyUUID}`);

    // TODO: Create primary CompanyContact using customerData (email, phone, name parts) and newCompanyUUID
    // Need to extract first/last name from customerData.name for the contact.

    return newCompanyUUID;
  } catch (error) {
    console.error("Error creating ServiceM8 customer:", error);
    return null;
  }
} 