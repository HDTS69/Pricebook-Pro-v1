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