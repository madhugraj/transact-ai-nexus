
import { createClient } from '@supabase/supabase-js';

// Add constants for Supabase URL and key
const SUPABASE_URL = 'https://ezwoozlwsokkkbkeolmu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6d29vemx3c29ra2tia2VvbG11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxODc4MjIsImV4cCI6MjA2Mjc2MzgyMn0.YWVJHeTHXc03CDS4MY7bd8kzQZXGYgJMy5xY69LbGoM';

// Create and export the Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Function to get secret from Supabase or localStorage
export const getSecret = async (secretName: string): Promise<string | null> => {
  try {
    // Try to get from Supabase secrets first
    const { data: secretData, error: secretError } = await supabase
      .rpc('get_secret', { secret_name: secretName });
    
    if (secretData) {
      return secretData;
    }
    
    // Fall back to localStorage if needed
    const localStorageValue = localStorage.getItem(secretName);
    return localStorageValue;
  } catch (error) {
    console.error(`Error retrieving secret ${secretName}:`, error);
    return null;
  }
};
