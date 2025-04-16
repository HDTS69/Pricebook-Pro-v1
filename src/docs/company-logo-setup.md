# Company Logo & Settings Setup Guide

This guide explains how to use the company logo feature and optionally set up Supabase for account-linked company settings.

## Current Implementation

By default, your company settings (including the logo) are stored in localStorage, which means:
- Settings persist between browser sessions on the same device
- Settings are NOT tied to user accounts
- Settings don't sync across different devices
- If a user clears browser data, settings will be lost

## Using the Logo Feature (localStorage version)

1. Navigate to the Settings page
2. In the Business Information section, you'll see a Company Logo field
3. Click "Browse" or "Choose File" to select an image from your computer
4. The logo will be uploaded and displayed in the preview area
5. To remove the logo, click the X button in the top-right corner of the preview
6. Click "Save Business Info" to save all your business information

### Technical Details
- Maximum logo size: 5MB
- Only image files are accepted
- Logo is encoded as a data URL and stored in localStorage
- The logo will appear in all PDF exports (quotes, jobs, etc.)

## Setting Up Supabase for Account-Linked Settings (Optional)

If you want company settings (including logos) to be:
- Tied to user accounts
- Synced across devices
- Persistent even if browser data is cleared
- Stored securely in a database

Follow these steps:

### 1. Set Up Supabase Tables and Storage

Run the following SQL script in your Supabase SQL Editor:

```sql
-- Create company_settings table
CREATE TABLE IF NOT EXISTS company_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Your Company',
  address TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  website TEXT DEFAULT '',
  logo_url TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create RLS policies
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- Policy for selecting settings (users can only see their own)
CREATE POLICY "Users can view their own company settings"
  ON company_settings
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy for inserting settings (users can only add their own)
CREATE POLICY "Users can insert their own company settings"
  ON company_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy for updating settings (users can only update their own)
CREATE POLICY "Users can update their own company settings"
  ON company_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create storage bucket for logos
INSERT INTO storage.buckets (id, name, public) VALUES ('company_logos', 'company_logos', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies
CREATE POLICY "Public can view company logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'company_logos');

CREATE POLICY "Users can upload their own company logo"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'company_logos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own company logo"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'company_logos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own company logo"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'company_logos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Create function to update 'updated_at' automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for updated_at
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON company_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

### 2. Update Your App Component

Modify your `App.tsx` file to use the Supabase-enabled CompanySettingsProvider:

```tsx
// Import the Supabase version instead of the localStorage version
import { CompanySettingsProvider } from '@/contexts/SupabaseCompanySettingsContext';

// Rest of your imports...

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CompanySettingsProvider>
          {/* Your existing app structure */}
        </CompanySettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
```

### 3. Migrating Existing Settings

The first time a user logs in after updating to the Supabase version:

1. The system will check for existing settings in localStorage
2. If found, these settings will be used as a starting point
3. If a data URL logo exists in localStorage, it will still be used in the UI but not saved to Supabase
4. When the user uploads a new logo through the UI, it will be stored in Supabase Storage

## Best Practices for Logo Images

For the best results in your PDFs:

1. **Size**: Use a logo between 200-400px wide for optimal display
2. **Format**: PNG format with transparency is recommended
3. **Resolution**: 72-150 DPI is sufficient for digital display and printing
4. **Background**: Use transparent backgrounds if possible
5. **Aspect Ratio**: Keep a balanced aspect ratio (not too wide or tall)

## Troubleshooting

**Logo not appearing in PDFs?**
- Check that the logo URL is accessible
- Ensure the logo is not too large (should be less than 5MB)
- If using data URLs, make sure they're properly formatted

**Logo not saving to Supabase?**
- Check browser console for errors
- Verify Supabase connection and authentication
- Ensure storage bucket permissions are set correctly

**Logo appears distorted?**
- Try a different image with a better aspect ratio
- Resize your image to be approximately 200-400px wide before uploading 