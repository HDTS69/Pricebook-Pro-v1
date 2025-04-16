-- Create a function to get company settings by user_id
CREATE OR REPLACE FUNCTION get_company_settings(user_id_param UUID)
RETURNS SETOF company_settings AS $$
BEGIN
  -- This function returns the company settings for a specific user
  -- It will be used as an RPC endpoint for troubleshooting
  RETURN QUERY 
    SELECT * FROM company_settings 
    WHERE user_id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to the anon role
GRANT EXECUTE ON FUNCTION get_company_settings(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_company_settings(UUID) TO authenticated; 