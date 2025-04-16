import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Define the structure for company settings
export interface CompanySettings {
  id?: string;
  user_id?: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logo?: string;
  logo_url?: string;
  created_at?: string;
  updated_at?: string;
}

// Default settings to use if no saved settings exist
const defaultCompanySettings: CompanySettings = {
  name: 'Your Company',
  address: '',
  phone: '',
  email: '',
  website: '',
  logo: '',
  logo_url: ''
};

// LocalStorage keys
const COMPANY_SETTINGS_STORAGE_KEY = 'pricebook_company_settings';

// Helper functions for localStorage
const getSettingsFromLocalStorage = (): CompanySettings | null => {
  try {
    const storedSettings = localStorage.getItem(COMPANY_SETTINGS_STORAGE_KEY);
    if (storedSettings) {
      return JSON.parse(storedSettings);
    }
  } catch (error) {
    console.error('Error retrieving settings from localStorage:', error);
  }
  return null;
};

const saveSettingsToLocalStorage = (settings: CompanySettings): void => {
  try {
    localStorage.setItem(COMPANY_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving settings to localStorage:', error);
  }
};

// Define the context type
interface CompanySettingsContextType {
  companySettings: CompanySettings;
  updateCompanySettings: (settings: Partial<CompanySettings>) => Promise<void>;
  resetCompanySettings: () => Promise<void>;
  uploadLogo: (file: File) => Promise<void>;
  isLoading: boolean;
}

// Create the context
const CompanySettingsContext = createContext<CompanySettingsContextType | undefined>(undefined);

// Function to check if REST API access is failing and try direct SQL as a fallback
const tryDirectSqlQuery = async (userId: string): Promise<CompanySettings | null> => {
  try {
    console.log('Trying direct SQL query as fallback...');
    
    // Execute a PostgreSQL query directly through RPC
    const { data, error } = await supabase.rpc('get_company_settings', {
      user_id_param: userId,
    });
    
    if (error) {
      console.error('Direct SQL query error:', error);
      return null;
    }
    
    if (data && data.length > 0) {
      console.log('Direct SQL query succeeded:', data[0]);
      return data[0];
    }
    
    return null;
  } catch (error) {
    console.error('Error in direct SQL query:', error);
    return null;
  }
};

// Provider component
export function CompanySettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [companySettings, setCompanySettings] = useState<CompanySettings>(defaultCompanySettings);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch company settings from Supabase when user changes
  useEffect(() => {
    async function fetchCompanySettings() {
      if (!user) {
        setCompanySettings(defaultCompanySettings);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
        console.log('Attempting to fetch company settings for user:', user.id);
        
        // Check for localStorage settings first as fallback
        const localSettings = getSettingsFromLocalStorage();
        if (localSettings) {
          console.log('Found settings in localStorage, using as fallback if needed');
        }
        
        // Skip the table check - it was causing 400 errors
        // Table exists, proceed with the query directly
        console.log('Querying company_settings for user:', user.id);
        
        // Get current auth session to debug
        const { data: sessionData } = await supabase.auth.getSession();
        console.log('Current auth session:', sessionData?.session ? 'Active' : 'None');
        
        const { data, error } = await supabase
          .from('company_settings')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle(); // Use maybeSingle instead of single to handle empty results without error

        if (error) {
          console.error('Error fetching company settings:', error);
          console.error('Error code:', error.code);
          console.error('Error message:', error.message);
          console.error('Error details:', error.details);
          
          // For other errors, try to use localStorage if available
          if (localSettings) {
            console.log('Using localStorage settings as fallback due to fetch error');
            setCompanySettings(localSettings);
            setIsLoading(false);
            return;
          }

          // Try direct SQL as a last resort before giving up
          const directSqlSettings = await tryDirectSqlQuery(user.id);
          if (directSqlSettings) {
            console.log('Retrieved settings via direct SQL query');
            const processedData = {
              ...directSqlSettings,
              logo: directSqlSettings.logo_url || directSqlSettings.logo || '',
            };
            setCompanySettings(processedData);
            // Save to localStorage as backup
            saveSettingsToLocalStorage(processedData);
            setIsLoading(false);
            return;
          }
            
          throw error;
        }

        if (data) {
          console.log('Found company settings:', data);
          // If logo_url exists, use it, otherwise keep existing logo (could be data URL)
          const processedData = {
            ...data,
            logo: data.logo_url || data.logo || '',
          };
          setCompanySettings(processedData);
          // Save to localStorage as backup
          saveSettingsToLocalStorage(processedData);
        } else {
          console.log('No company settings found, creating default settings');
          
          // Check if we have localStorage settings to use instead of defaults
          const settingsToCreate = localSettings || {
            ...defaultCompanySettings, 
            user_id: user.id
          };
          
          // No settings exist yet, create default settings
          console.log('Inserting new company settings for user:', user.id);
          
          // Create with service role key if available through RPC
          try {
            // Try using an RPC function to bypass RLS
            console.log('Attempting to use create_company_settings RPC...');
            const { data: rpcData, error: rpcError } = await supabase.rpc(
              'create_company_settings_for_user',
              { 
                settings_user_id: user.id,
                settings_name: settingsToCreate.name,
                settings_address: settingsToCreate.address,
                settings_phone: settingsToCreate.phone,
                settings_email: settingsToCreate.email,
                settings_website: settingsToCreate.website
              }
            );
            
            if (rpcError) {
              console.error('Error using RPC to create settings:', rpcError);
              throw rpcError;
            }
            
            if (rpcData) {
              console.log('Created company settings via RPC:', rpcData);
              const newSettings = {
                ...settingsToCreate,
                id: rpcData.id
              };
              setCompanySettings(newSettings);
              saveSettingsToLocalStorage(newSettings);
              setIsLoading(false);
              return;
            }
          } catch (rpcErr) {
            console.error('RPC approach failed:', rpcErr);
            // Continue with regular insert attempt
          }
          
          const { data: newData, error: insertError } = await supabase
            .from('company_settings')
            .insert([settingsToCreate])
            .select()
            .maybeSingle();

          if (insertError) {
            console.error('Error creating company settings:', insertError);
            console.error('Error code:', insertError.code);
            console.error('Error message:', insertError.message);
            console.error('Error details:', insertError.details);
            
            // Use localStorage settings if available and insert failed
            if (localSettings) {
              console.log('Using localStorage settings as fallback due to insert error');
              setCompanySettings(localSettings);
              setIsLoading(false);
              return;
            }
            
            toast({
              variant: "destructive",
              title: "Setup Failed",
              description: "Could not create company settings. Database error occurred.",
            });
            throw insertError;
          }

          if (newData) {
            console.log('Created company settings:', newData);
            setCompanySettings(newData);
            // Save to localStorage as backup
            saveSettingsToLocalStorage(newData);
          } else {
            // If insert worked but returned no data, use the settings we tried to create
            console.log('Insert succeeded but returned no data, using created settings');
            setCompanySettings(settingsToCreate);
            saveSettingsToLocalStorage(settingsToCreate);
          }
        }
      } catch (error) {
        console.error('Failed to load company settings:', error);
        
        // Try to use localStorage settings if available
        const localSettings = getSettingsFromLocalStorage();
        if (localSettings) {
          console.log('Using localStorage settings as final fallback');
          setCompanySettings(localSettings);
        } else {
          // Set to default settings if we can't load from database or localStorage
          setCompanySettings(defaultCompanySettings);
        }
        
        toast({
          variant: "destructive",
          title: "Settings Error",
          description: "Could not load company settings from database.",
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchCompanySettings();
  }, [user, toast]);

  // Function to update settings
  const updateCompanySettings = async (settings: Partial<CompanySettings>) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "You must be logged in to update settings.",
      });
      return;
    }

    try {
      setIsLoading(true);
      console.log('Saving company settings to Supabase:', settings);
      
      // Also save to localStorage as backup
      const updatedSettings = { ...companySettings, ...settings };
      saveSettingsToLocalStorage(updatedSettings);
      
      // If there's a logo in settings but it's a data URL, we need to handle it differently
      const settingsToUpdate = { ...settings };
      if (settings.logo && settings.logo.startsWith('data:')) {
        console.log('Logo is a data URL, not saving to Supabase directly');
        // This is a data URL, so we'll set it locally but not try to save it to Supabase
        // The logo_url field will be updated when we call uploadLogo()
        delete settingsToUpdate.logo;
      } else if (settings.logo) {
        console.log('Logo is a URL, updating logo_url field');
        // This is a regular URL, update the logo_url field
        settingsToUpdate.logo_url = settings.logo;
      } else if (settings.logo === '') {
        // If logo is explicitly set to empty string, clear both fields
        settingsToUpdate.logo = '';
        settingsToUpdate.logo_url = '';
      }

      const { error } = await supabase
        .from('company_settings')
        .update(settingsToUpdate)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating company settings:', error);
        toast({
          variant: "destructive",
          title: "Update Failed",
          description: "Could not update company settings in database.",
        });
        throw error;
      }

      console.log('Successfully updated company settings in Supabase');
      
      // Update local state with all changes including logo
      setCompanySettings(prev => ({ ...prev, ...settings }));
    } catch (error) {
      console.error('Failed to update company settings:', error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Could not update company settings. Please try again.",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to upload a logo
  const uploadLogo = async (file: File) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: "You must be logged in to upload a logo.",
      });
      return;
    }

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
      
      // Generate a unique file path for this user's logo
      const filePath = `${user.id}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      
      // Upload the file to Supabase Storage
      const { error } = await supabase.storage
        .from('company_logos')
        .upload(filePath, file, { upsert: true });

      if (error) {
        console.error('Error uploading logo:', error);
        throw error;
      }

      // Get the public URL for the uploaded file
      const { data: urlData } = supabase.storage
        .from('company_logos')
        .getPublicUrl(filePath);

      // Update the company settings with the new logo URL
      await updateCompanySettings({ 
        logo: urlData.publicUrl,
        logo_url: urlData.publicUrl,
      });
      
      toast({
        title: "Logo Uploaded",
        description: "Your company logo has been updated successfully.",
      });
    } catch (error: any) {
      console.error('Failed to upload logo:', error);
      
      // If this is an image type or size error, show a more specific message
      if (error.message.includes('image') || error.message.includes('size')) {
        toast({
          variant: "destructive",
          title: "Upload Failed",
          description: error.message,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Upload Failed",
          description: "Could not upload logo to storage. Please try again.",
        });
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to reset settings to defaults
  const resetCompanySettings = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Reset Failed",
        description: "You must be logged in to reset settings.",
      });
      return;
    }

    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('company_settings')
        .update({ 
          ...defaultCompanySettings, 
          user_id: user.id,
          logo: '',
          logo_url: '',
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error resetting company settings:', error);
        throw error;
      }

      setCompanySettings(defaultCompanySettings);
      
      toast({
        title: "Settings Reset",
        description: "Your company settings have been reset to defaults.",
      });
    } catch (error) {
      console.error('Failed to reset company settings:', error);
      toast({
        variant: "destructive",
        title: "Reset Failed",
        description: "Could not reset company settings. Please try again.",
      });
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