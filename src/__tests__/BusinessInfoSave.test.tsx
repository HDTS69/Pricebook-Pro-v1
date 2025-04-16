import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CompanySettingsProvider } from '@/contexts/CompanySettingsContext';
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

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
    }),
    auth: {
      updateUser: jest.fn().mockResolvedValue({ error: null }),
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

describe('Business Info Save Functionality', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    jest.clearAllMocks();
  });

  test('should save business information when save button is clicked', async () => {
    // Render the settings page
    render(
      <CompanySettingsProvider>
        <SettingsPage />
      </CompanySettingsProvider>
    );
    
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
    
    // Verify localStorage was called with the updated settings
    await waitFor(() => {
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });
    
    // Verify that the correct data was stored
    const lastCallIndex = mockLocalStorage.setItem.mock.calls.length - 1;
    const storedData = JSON.parse(mockLocalStorage.setItem.mock.calls[lastCallIndex][1]);
    
    expect(storedData.name).toBe('Test Company Name');
    expect(storedData.address).toBe('123 Test Street');
    expect(storedData.phone).toBe('555-1234');
    expect(storedData.email).toBe('test@example.com');
    expect(storedData.website).toBe('https://example.com');
  });

  test('should maintain existing logo when saving other business info', async () => {
    // Set initial state with a logo
    mockLocalStorage.setItem('pricebook_company_settings', JSON.stringify({
      name: 'Old Name',
      address: 'Old Address',
      phone: 'Old Phone',
      email: 'old@example.com',
      website: 'https://old.com',
      logo: 'data:image/png;base64,fakedata'
    }));
    
    render(
      <CompanySettingsProvider>
        <SettingsPage />
      </CompanySettingsProvider>
    );
    
    // Change business name only
    const nameInput = screen.getByLabelText(/Business Name/i);
    fireEvent.change(nameInput, { target: { value: 'New Company Name' } });
    
    // Find and click the save button
    const saveButton = screen.getByRole('button', { name: /Save Business Info/i });
    fireEvent.click(saveButton);
    
    // Verify localStorage was updated correctly
    await waitFor(() => {
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });
    
    // Check that the logo was preserved
    const lastCallIndex = mockLocalStorage.setItem.mock.calls.length - 1;
    const storedData = JSON.parse(mockLocalStorage.setItem.mock.calls[lastCallIndex][1]);
    
    expect(storedData.name).toBe('New Company Name');
    expect(storedData.logo).toBe('data:image/png;base64,fakedata');
  });
}); 