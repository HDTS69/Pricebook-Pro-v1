import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define the structure for company settings
export interface CompanySettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logo?: string;
}

// Default settings to use if no saved settings exist
const defaultCompanySettings: CompanySettings = {
  name: 'Your Company',
  address: '',
  phone: '',
  email: '',
  website: '',
  logo: ''
};

// Define the storage key
const COMPANY_SETTINGS_STORAGE_KEY = 'pricebook_company_settings';

// Define the context type
interface CompanySettingsContextType {
  companySettings: CompanySettings;
  updateCompanySettings: (settings: Partial<CompanySettings>) => void;
  resetCompanySettings: () => void;
  uploadLogo: (file: File) => Promise<void>;
  isLoading: boolean;
}

// Create the context
const CompanySettingsContext = createContext<CompanySettingsContextType | undefined>(undefined);

// Provider component
export function CompanySettingsProvider({ children }: { children: ReactNode }) {
  // Initialize state with settings from localStorage or defaults
  const [companySettings, setCompanySettings] = useState<CompanySettings>(() => {
    try {
      const savedSettings = localStorage.getItem(COMPANY_SETTINGS_STORAGE_KEY);
      if (savedSettings) {
        return JSON.parse(savedSettings);
      }
    } catch (error) {
      console.error('Failed to load company settings from localStorage:', error);
    }
    return defaultCompanySettings;
  });
  
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Update settings in localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem(COMPANY_SETTINGS_STORAGE_KEY, JSON.stringify(companySettings));
    } catch (error) {
      console.error('Failed to save company settings to localStorage:', error);
    }
  }, [companySettings]);

  // Function to update settings (partial update)
  const updateCompanySettings = (settings: Partial<CompanySettings>) => {
    setCompanySettings((prevSettings) => ({
      ...prevSettings,
      ...settings
    }));
  };

  // Function to reset settings to defaults
  const resetCompanySettings = () => {
    setCompanySettings(defaultCompanySettings);
  };
  
  // Function to upload a logo and store it as a data URL
  const uploadLogo = async (file: File): Promise<void> => {
    setIsLoading(true);
    try {
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image file is too large. Maximum size is 5MB.');
      }
      
      // Convert file to data URL
      const reader = new FileReader();
      
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      // Update company settings with the logo data URL
      updateCompanySettings({ logo: dataUrl });
    } catch (error) {
      console.error('Error uploading logo:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Provide the context value
  const value = {
    companySettings,
    updateCompanySettings,
    resetCompanySettings,
    uploadLogo,
    isLoading
  };

  return (
    <CompanySettingsContext.Provider value={value}>
      {children}
    </CompanySettingsContext.Provider>
  );
}

// Custom hook for using the company settings context
export function useCompanySettings() {
  const context = useContext(CompanySettingsContext);
  if (context === undefined) {
    throw new Error('useCompanySettings must be used within a CompanySettingsProvider');
  }
  return context;
} 