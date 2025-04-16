-- Create a new RPC function that bypasses RLS to create company settings
CREATE OR REPLACE FUNCTION create_company_settings_for_user(
  settings_user_id UUID,
  settings_name TEXT DEFAULT '',
  settings_address TEXT DEFAULT '',
  settings_phone TEXT DEFAULT '',
  settings_email TEXT DEFAULT '',
  settings_website TEXT DEFAULT ''
) RETURNS "company_settings" AS $$
DECLARE
  new_settings "company_settings";
BEGIN
  -- Insert new company settings record, bypassing RLS as this is a security definer function
  INSERT INTO "company_settings" (
    user_id,
    name,
    address,
    phone,
    email,
    website
  ) VALUES (
    settings_user_id,
    settings_name,
    settings_address,
    settings_phone,
    settings_email,
    settings_website
  )
  RETURNING * INTO new_settings;
  
  RETURN new_settings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to the function for both authenticated and anonymous users
GRANT EXECUTE ON FUNCTION create_company_settings_for_user(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_company_settings_for_user(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon; 