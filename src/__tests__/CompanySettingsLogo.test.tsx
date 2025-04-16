import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CompanySettingsProvider } from '@/contexts/CompanySettingsContext';
import { SettingsPage } from '@/pages/settings/SettingsPage';
import userEvent from '@testing-library/user-event';

// Mock the useToast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock the supabase client
jest.mock('@/lib/supabase', () => ({
  supabase: {
    storage: {
      from: jest.fn().mockReturnValue({
        upload: jest.fn().mockResolvedValue({ data: { path: 'logos/test-logo.png' }, error: null }),
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/logos/test-logo.png' } }),
      }),
    },
  },
}));

// Mock useAuth hook
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' },
    refreshSession: jest.fn(),
  }),
}));

// Create a mock file
function createMockFile() {
  const file = new File(['dummy content'], 'logo.png', { type: 'image/png' });
  return file;
}

describe('Company Logo Upload', () => {
  test('renders logo upload component in settings page', async () => {
    render(
      <CompanySettingsProvider>
        <SettingsPage />
      </CompanySettingsProvider>
    );
    
    // Business Info section should be visible by default
    expect(screen.getByText('Business Information')).toBeInTheDocument();
    
    // Logo upload component should be visible
    expect(screen.getByLabelText(/Company Logo/i)).toBeInTheDocument();
    expect(screen.getByText(/Upload a company logo/i)).toBeInTheDocument();
  });
  
  test('allows uploading a logo', async () => {
    render(
      <CompanySettingsProvider>
        <SettingsPage />
      </CompanySettingsProvider>
    );
    
    // Get the file input
    const fileInput = screen.getByLabelText(/Company Logo/i);
    
    // Create a mock file and upload it
    const file = createMockFile();
    userEvent.upload(fileInput, file);
    
    // Check that the logo preview appears after upload
    await waitFor(() => {
      expect(screen.getByAltText('Company Logo')).toBeInTheDocument();
    });
  });
  
  test('allows removing the logo', async () => {
    // Render with a pre-existing logo
    const CompanySettingsWithLogo = () => {
      const [initialized, setInitialized] = React.useState(false);
      
      React.useEffect(() => {
        // Set the logo in localStorage to simulate a pre-existing logo
        if (!initialized) {
          const settings = {
            name: 'Test Company',
            address: '123 Test St',
            phone: '555-1234',
            email: 'test@example.com',
            website: 'www.example.com',
            logo: 'https://example.com/logos/test-logo.png'
          };
          localStorage.setItem('pricebook_company_settings', JSON.stringify(settings));
          setInitialized(true);
        }
      }, [initialized]);
      
      return (
        <CompanySettingsProvider>
          <SettingsPage />
        </CompanySettingsProvider>
      );
    };
    
    render(<CompanySettingsWithLogo />);
    
    // Wait for the logo to appear
    await waitFor(() => {
      expect(screen.getByAltText('Company Logo')).toBeInTheDocument();
    });
    
    // Find and click the remove button
    const removeButton = screen.getByRole('button', { name: /Remove logo/i });
    fireEvent.click(removeButton);
    
    // Logo should be removed
    await waitFor(() => {
      expect(screen.queryByAltText('Company Logo')).not.toBeInTheDocument();
    });
  });
}); 