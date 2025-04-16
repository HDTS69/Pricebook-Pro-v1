import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CompanySettingsProvider } from '@/contexts/SupabaseCompanySettingsContext';
import { SettingsPage } from '@/pages/settings/SettingsPage';

// Mock modules
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' },
    refreshSession: jest.fn(),
  }),
}));

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ 
            data: null, 
            error: { code: 'PGRST116' } 
          }),
        }),
      }),
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'test-settings-id',
              user_id: 'test-user-id',
              name: 'Default Company',
              address: '',
              phone: '',
              email: '',
              website: '',
              logo_url: null,
            },
            error: null
          }),
        }),
      }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
    }),
    auth: {
      updateUser: jest.fn().mockResolvedValue({ error: null }),
      getUser: jest.fn().mockResolvedValue({ 
        data: { user: { id: 'test-user-id' } }, 
        error: null 
      }),
    },
    storage: {
      from: jest.fn().mockReturnValue({
        upload: jest.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'test-url' } }),
      }),
    },
  },
}));

jest.mock('@/lib/servicem8', () => ({
  getActiveServiceM8Token: jest.fn().mockResolvedValue(null),
  disconnectServiceM8: jest.fn(),
}));

// Mock localStorage with proper typing
const mockLocalStorage = (function() {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

describe('Business Info Save Functionality with Supabase', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    jest.clearAllMocks();
  });

  test('should save business information to Supabase when save button is clicked', async () => {
    const supabaseMock = require('@/lib/supabase').supabase;
    
    // Render the settings page with Supabase provider
    render(
      <CompanySettingsProvider>
        <SettingsPage />
      </CompanySettingsProvider>
    );
    
    // Wait for initial data fetch
    await waitFor(() => {
      expect(supabaseMock.from).toHaveBeenCalledWith('company_settings');
    });
    
    // Business section should be active by default
    expect(screen.getByText('Business Information')).toBeInTheDocument();
    
    // Get form fields
    const nameInput = screen.getByLabelText(/Business Name/i);
    const addressInput = screen.getByLabelText(/Business Address/i);
    const phoneInput = screen.getByLabelText(/Business Phone/i);
    const emailInput = screen.getByLabelText(/Business Email/i);
    const websiteInput = screen.getByLabelText(/Business Website/i);
    
    // Change input values
    fireEvent.change(nameInput, { target: { value: 'Test Company Name' } });
    fireEvent.change(addressInput, { target: { value: '123 Test Street' } });
    fireEvent.change(phoneInput, { target: { value: '555-1234' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(websiteInput, { target: { value: 'https://example.com' } });
    
    // Find and click the save button
    const saveButton = screen.getByRole('button', { name: /Save Business Info/i });
    fireEvent.click(saveButton);
    
    // Verify Supabase was called with the updated settings
    await waitFor(() => {
      expect(supabaseMock.from).toHaveBeenCalledWith('company_settings');
      expect(supabaseMock.from().update).toHaveBeenCalled();
      
      // Get the update call arguments
      const updateCall = supabaseMock.from().update.mock.calls[0][0];
      
      // Verify the data
      expect(updateCall).toEqual(expect.objectContaining({
        name: 'Test Company Name',
        address: '123 Test Street',
        phone: '555-1234',
        email: 'test@example.com',
        website: 'https://example.com',
      }));
    });
  });
}); 