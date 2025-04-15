import { Customer, Address } from '@/types/quote';
import { supabase } from '@/lib/supabase'; // Use the correct client path

// --- ServiceM8 Specific Types ---
interface ServiceM8CompanyContact {
  uuid: string;
  company_uuid: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null; // Office phone?
  mobile_phone: string | null;
  is_primary_contact: 1 | 0; // Assuming 1 for true, 0 for false
  // Add other relevant fields if known from API docs
}

// Type for data needed to create a contact (UUIDs assigned by API)
interface ServiceM8CreateContactPayload {
  company_uuid: string;
  first_name?: string | null;
  last_name?: string | null; // Often needed if first_name is used
  email?: string | null;
  phone?: string | null;
  mobile_phone?: string | null;
  is_primary_contact?: 1 | 0;
}

// --- End ServiceM8 Specific Types ---

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
export async function getActiveServiceM8Token(): Promise<string | null> {
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

// --- NEW Contact API Functions --- 

/**
 * Fetches the primary company contact for a given company UUID.
 * Assumes API endpoint /companycontact.json with OData filter.
 * Returns the first contact found marked as primary, or null.
 */
export async function fetchPrimaryCompanyContact(
  companyId: string,
  accessToken: string
): Promise<ServiceM8CompanyContact | null> {
  console.log(`Fetching primary contact for company ${companyId}...`);
  // Construct the OData filter: company_uuid eq '...' and is_primary_contact eq 1
  // Ensure proper URL encoding for the filter value
  const filter = encodeURIComponent(`company_uuid eq '${companyId}' and is_primary_contact eq 1`);
  const url = `${API_BASE_URL}/companycontact.json?$filter=${filter}`; // Use const API_BASE_URL

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      // Don't treat 404 as error, just means no contact found
      if (response.status === 404) {
        console.log(`No primary contact found for company ${companyId}.`);
        return null;
      }
      throw new Error(`ServiceM8 API Error fetching contact for company ${companyId}: ${response.status} ${await response.text()}`);
    }

    const data = await response.json();

    // API usually returns an array, even if filtering for one
    if (Array.isArray(data) && data.length > 0) {
      // Find the first one explicitly marked as primary (though filter should handle it)
      const primaryContact = data.find(contact => contact.is_primary_contact === 1);
      if (primaryContact) {
         console.log(`Found primary contact for company ${companyId}:`, primaryContact.uuid);
         return primaryContact as ServiceM8CompanyContact; // Assume structure matches type
      } else {
         console.log(`No contact marked as primary returned for company ${companyId}, despite filter.`);
         return null;
      }
    } else {
      console.log(`No primary contact data returned for company ${companyId}.`);
      return null;
    }
  } catch (error) {
    console.error(`Error in fetchPrimaryCompanyContact for company ${companyId}:`, error);
    return null; // Return null on any error
  }
}

/**
 * Updates specific fields (email, phone, mobile) of an existing company contact.
 * Assumes API endpoint POST /companycontact/{contactId}.json
 */
export async function updatePrimaryCompanyContact(
  contactId: string,
  contactData: Partial<Pick<ServiceM8CompanyContact, 'email' | 'phone' | 'mobile_phone'>>,
  accessToken: string
): Promise<boolean> {
  console.log(`Updating contact ${contactId} with data:`, contactData);
  const url = `${API_BASE_URL}/companycontact/${contactId}.json`;

  // Clean the payload - only include non-null/undefined values provided
  const payload: Partial<Pick<ServiceM8CompanyContact, 'email' | 'phone' | 'mobile_phone'>> = {};
  if (contactData.email !== undefined) payload.email = contactData.email;
  if (contactData.phone !== undefined) payload.phone = contactData.phone;
  if (contactData.mobile_phone !== undefined) payload.mobile_phone = contactData.mobile_phone;

  if (Object.keys(payload).length === 0) {
      console.warn(`No valid data provided to update contact ${contactId}. Skipping update.`);
      return true; // Nothing to update, consider it a success
  }

  try {
    const response = await fetch(url, {
      method: 'POST', // ServiceM8 often uses POST for updates
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`ServiceM8 API Error updating contact ${contactId}: ${response.status} ${await response.text()}`);
    }
    console.log(`Successfully updated contact ${contactId}.`);
    return true;
  } catch (error) {
    console.error(`Error in updatePrimaryCompanyContact for ${contactId}:`, error);
    return false;
  }
}

/**
 * Creates a new company contact associated with a company.
 * Assumes API endpoint POST /companycontact.json
 * Returns the UUID of the newly created contact, or null on failure.
 */
export async function createPrimaryCompanyContact(
  contactData: ServiceM8CreateContactPayload,
  accessToken: string
): Promise<string | null> { 
  console.log(`Creating contact for company ${contactData.company_uuid} with data:`, contactData);
  const url = `${API_BASE_URL}/companycontact.json`;

  // Ensure essential data is present (e.g., company_uuid)
  if (!contactData.company_uuid) {
      console.error("Cannot create contact: company_uuid is missing.");
      return null;
  }
  
  // Default to is_primary_contact=1 if not specified
  const payload = {
      is_primary_contact: 1, 
      ...contactData 
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok || response.status !== 201) { // Check for 201 Created status
      throw new Error(`ServiceM8 API Error creating contact for company ${contactData.company_uuid}: ${response.status} ${await response.text()}`);
    }

    // Attempt to extract the new contact UUID from the Location header
    const locationHeader = response.headers.get('Location');
    let newContactId: string | null = null;
    if (locationHeader) {
      const match = locationHeader.match(/companycontact\/([a-f0-9\-]+)\.json/i);
      if (match && match[1]) {
        newContactId = match[1];
      }
    }

    // Fallback: Try getting UUID from response body if header fails (less common for POST)
    if (!newContactId) {
        try {
            const responseData = await response.json();
            if (responseData && responseData.uuid) {
                newContactId = responseData.uuid;
            }
        } catch (jsonError) {
            console.warn("Could not parse response body for new contact UUID after creation.");
        }
    }

    if (!newContactId) {
        console.error(`Successfully created contact for company ${contactData.company_uuid}, but failed to extract the new contact UUID.`);
        // This is problematic - the contact exists but we don't know its ID
        // Depending on requirements, maybe return a specific error or attempt recovery?
        return null; // Indicate failure to get ID
    }

    console.log(`Successfully created contact ${newContactId} for company ${contactData.company_uuid}.`);
    return newContactId;

  } catch (error) {
    console.error(`Error in createPrimaryCompanyContact for company ${contactData.company_uuid}:`, error);
    return null;
  }
}

// --- API Functions ---

/**
 * Fetches all active companies from ServiceM8 AND their primary contact details.
 * Requires OAuth scope: read_customers
 * TODO: Implement pagination if needed.
 */
export async function fetchServiceM8Customers(): Promise<Customer[]> {
  const accessToken = await getActiveServiceM8Token();
  if (!accessToken) {
    console.error("ServiceM8 Access Token not available.");
    return []; 
  }

  try {
    console.log("Fetching companies from ServiceM8...");
    const companyResponse = await fetch(`${API_BASE_URL}/company.json?$filter=active%20eq%201`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });
    if (!companyResponse.ok) {
      throw new Error(`ServiceM8 API Error fetching companies: ${companyResponse.status} ${await companyResponse.text()}`);
    }
    const companiesData = await companyResponse.json();

    if (!Array.isArray(companiesData)) {
      console.error("Unexpected response format from ServiceM8 /company.json:", companiesData);
      return [];
    }

    console.log(`Fetched ${companiesData.length} companies. Now fetching primary contacts...`);

    // Fetch primary contact for each company concurrently
    const customerPromises = companiesData.map(async (s8Company) => {
      let primaryContact: ServiceM8CompanyContact | null = null;
      if (s8Company.uuid) { // Ensure company has UUID before fetching contact
        primaryContact = await fetchPrimaryCompanyContact(s8Company.uuid, accessToken);
      }
      
      // Map company data to base customer structure
      const customer = mapServiceM8CompanyToCustomer(s8Company);
      
      // Merge contact details if found
      if (primaryContact) {
        customer.email = primaryContact.email || customer.email; // Keep existing if contact email is null
        customer.phone = primaryContact.phone || customer.phone;
        customer.mobile_phone = primaryContact.mobile_phone || customer.mobile_phone;
        // Optionally store contact UUID if needed later for updates
        // customer.primary_contact_uuid = primaryContact.uuid; 
      }
      return customer;
    });

    // Wait for all customer data (including contact fetches) to resolve
    const customers = await Promise.all(customerPromises);

    console.log("Fetched ServiceM8 Companies with contact details (mapped):", customers);
    return customers;

  } catch (error) {
    console.error("Error fetching ServiceM8 customers or contacts:", error);
    return [];
  }
}

/**
 * Fetches a single company by UUID from ServiceM8 AND its primary contact.
 * Requires OAuth scope: read_customers
 */
export async function fetchServiceM8Customer(customerId: string): Promise<Customer | null> {
  const accessToken = await getActiveServiceM8Token(); 
  if (!accessToken) {
    console.error("ServiceM8 Access Token not available.");
    return null;
  }

  try {
    console.log(`Fetching company ${customerId} from ServiceM8...`);
    const companyResponse = await fetch(`${API_BASE_URL}/company/${customerId}.json`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });
    if (!companyResponse.ok) {
      if (companyResponse.status === 404) return null; // Company not found
      throw new Error(`ServiceM8 API Error fetching company ${customerId}: ${companyResponse.status} ${await companyResponse.text()}`);
    }
    const s8Company = await companyResponse.json();

    // Fetch primary contact
    let primaryContact: ServiceM8CompanyContact | null = null;
    if (s8Company.uuid) {
      primaryContact = await fetchPrimaryCompanyContact(s8Company.uuid, accessToken);
    }

    // Map and merge
    const customer = mapServiceM8CompanyToCustomer(s8Company);
    if (primaryContact) {
      customer.email = primaryContact.email || customer.email;
      customer.phone = primaryContact.phone || customer.phone;
      customer.mobile_phone = primaryContact.mobile_phone || customer.mobile_phone;
      // customer.primary_contact_uuid = primaryContact.uuid;
    }

    console.log(`Fetched ServiceM8 Company ${customerId} with contact (mapped):`, customer);
    return customer;

  } catch (error) {
    console.error(`Error fetching ServiceM8 customer ${customerId} or contact:`, error);
    return null;
  }
}

/**
 * Updates an existing company in ServiceM8 AND its primary contact details.
 * Requires OAuth scope: manage_customers
 */
export async function updateServiceM8Customer(customer: Customer): Promise<boolean> {
  const accessToken = await getActiveServiceM8Token();
  if (!accessToken) {
    console.error("ServiceM8 Access Token not available for update.");
    return false;
  }

  const companyPayload = mapCustomerToServiceM8CompanyPayload(customer);

  try {
    console.log(`Updating company ${customer.id} in ServiceM8...`);
    const companyResponse = await fetch(`${API_BASE_URL}/company/${customer.id}.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(companyPayload),
    });

    if (!companyResponse.ok) {
      throw new Error(`ServiceM8 API Error updating company ${customer.id}: ${companyResponse.status} ${await companyResponse.text()}`);
    }
    console.log(`Successfully updated ServiceM8 Company ${customer.id}. Now updating contact...`);

    // --- Update Primary Contact --- 
    // Find the primary contact first
    const primaryContact = await fetchPrimaryCompanyContact(customer.id, accessToken);

    if (primaryContact) {
      const contactUpdatePayload = {
        email: customer.email, // Get email from our Customer object
        phone: customer.phone,
        mobile_phone: customer.mobile_phone,
      };
      // Only proceed if there are details to update
      if (contactUpdatePayload.email || contactUpdatePayload.phone || contactUpdatePayload.mobile_phone) {
        const contactUpdateSuccess = await updatePrimaryCompanyContact(
            primaryContact.uuid, 
            contactUpdatePayload, 
            accessToken
        );
        if (!contactUpdateSuccess) {
          // Log warning but don't fail the whole operation? Or return false?
          console.warn(`Company ${customer.id} updated, but failed to update contact ${primaryContact.uuid}.`);
          // return false; // Optionally make the whole operation fail if contact update fails
        }
      } else {
          console.log(`No email/phone details provided for customer ${customer.id}, skipping contact update.`);
      }
    } else {
      // No primary contact found. Should we try to create one?
      // For updates, maybe only update if one exists to avoid complexity.
      console.warn(`Company ${customer.id} updated, but no existing primary contact found to update details.`);
      // Consider creating a contact here if required: 
      // await createPrimaryCompanyContact({ company_uuid: customer.id, email: customer.email, ... }, accessToken);
    }
    // --- End Contact Update ---

    return true; // Return true if company update succeeded (contact update is best-effort?)

  } catch (error) {
    console.error(`Error updating ServiceM8 customer ${customer.id} or contact:`, error);
    return false;
  }
}

/**
 * Creates a new company in ServiceM8 AND a primary contact for it.
 * Requires OAuth scope: manage_customers
 * Returns the UUID of the newly created company, or null on failure.
 */
export async function createServiceM8Customer(customerData: Omit<Customer, 'id'>): Promise<string | null> {
  const accessToken = await getActiveServiceM8Token();
  if (!accessToken) {
    console.error("ServiceM8 Access Token not available for create.");
    return null;
  }

  const companyPayload = mapCustomerToServiceM8CompanyPayload(customerData);
  let newCompanyId: string | null = null;

  try {
    // --- Create Company --- 
    console.log("Creating company in ServiceM8:", companyPayload);
    const companyResponse = await fetch(`${API_BASE_URL}/company.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(companyPayload),
    });

    if (!companyResponse.ok || companyResponse.status !== 201) {
      throw new Error(`ServiceM8 API Error creating company: ${companyResponse.status} ${await companyResponse.text()}`);
    }

    // Extract new company UUID (from Location header or body)
    const locationHeader = companyResponse.headers.get('Location');
    if (locationHeader) {
      const match = locationHeader.match(/company\/([a-f0-9\-]+)\.json/i);
      if (match && match[1]) {
        newCompanyId = match[1];
      }
    }
    if (!newCompanyId) {
        try {
            const responseData = await companyResponse.json();
            if (responseData && responseData.uuid) newCompanyId = responseData.uuid;
        } catch (jsonError) { /* Ignore */ }
    }

    if (!newCompanyId) {
      throw new Error("Created company, but failed to extract the new Company UUID.");
    }
    console.log(`Successfully created ServiceM8 Company ${newCompanyId}. Now creating contact...`);
    // --- End Create Company --- 

    // --- Create Primary Contact --- 
    const contactPayload: ServiceM8CreateContactPayload = {
        company_uuid: newCompanyId,
        // Assuming first name/last name aren't strictly needed for primary contact?
        // Extract from customerData.name if possible/needed?
        // first_name: ???,
        // last_name: ???,
        email: customerData.email,
        phone: customerData.phone,
        mobile_phone: customerData.mobile_phone,
        is_primary_contact: 1,
    };

    // Only create if there are details to add
    if (contactPayload.email || contactPayload.phone || contactPayload.mobile_phone) {
        const newContactId = await createPrimaryCompanyContact(contactPayload, accessToken);
        if (!newContactId) {
          // Log warning, but don't fail the company creation? 
          console.warn(`Company ${newCompanyId} created, but failed to create primary contact.`);
          // Depending on requirements, maybe delete the company if contact creation is essential?
          // Or maybe return the companyId anyway?
        }
    } else {
        console.log(`No email/phone details provided for new customer ${newCompanyId}, skipping contact creation.`);
    }
    // --- End Create Contact ---

    return newCompanyId; // Return the ID of the created company

  } catch (error) {
    console.error("Error creating ServiceM8 customer or contact:", error);
    // If company creation failed, newCompanyId is null. 
    // If contact creation failed after company succeeded, newCompanyId might have a value.
    // Decide on cleanup strategy if needed (e.g., delete partially created company).
    return null; // Indicate failure
  }
}

/**
 * Calls a Supabase Edge Function to securely delete the user's stored 
 * ServiceM8 tokens.
 */
export async function disconnectServiceM8(): Promise<boolean> {
  console.log("Attempting to disconnect ServiceM8 via Edge Function...");
  try {
    // Ensure user is logged in to Supabase
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      console.error('Supabase session error during disconnect:', sessionError);
      throw new Error('User session not found. Please log in.');
    }
    const userAccessToken = sessionData.session.access_token;

    // Call the edge function (e.g., 'delete-servicem8-token')
    const { error } = await supabase.functions.invoke('delete-servicem8-token', { // <<< Function name might differ
      headers: { 'Authorization': `Bearer ${userAccessToken}` }
    });

    if (error) {
      console.error('Error calling delete-servicem8-token function:', error);
      // Handle specific errors? (e.g., 404 if no token existed anyway)
      // Consider a 404 as a successful disconnect?
      if (error.message.includes("404")) { 
          console.log("No ServiceM8 connection found to delete.");
          return true; // Already disconnected
      }
      throw error; // Re-throw other errors
    }

    console.log("Successfully invoked disconnect function.");
    return true; // Indicate success

  } catch (err: any) {
    console.error("Error disconnecting ServiceM8:", err.message);
    return false;
  }
} 