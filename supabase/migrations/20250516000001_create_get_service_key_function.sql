
-- Create a secure function to retrieve service API keys
create or replace function public.get_service_key(service_name text)
returns text[] as $$
declare
  key_value text;
  result text[];
begin
  -- Only proceed if this is called by an authenticated user
  if auth.uid() is null then
    return '{}';
  end if;
  
  -- For now, just return empty array since actual keys will be stored in Supabase edge function
  -- In production, this would integrate with a secure vault or secrets manager
  
  -- This is just a placeholder to ensure the function exists and can be called from the frontend
  if service_name = 'gemini' then
    result := array['placeholder'];
  else
    result := '{}';
  end if;
  
  return result;
end;
$$ language plpgsql security definer;

-- Grant access to the function
grant execute on function public.get_service_key(text) to authenticated;
grant execute on function public.get_service_key(text) to service_role;
