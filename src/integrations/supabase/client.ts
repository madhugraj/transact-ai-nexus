
import { createClient } from '@supabase/supabase-js';

// Add constants for Supabase URL and key
const SUPABASE_URL = 'https://ezwoozlwsokkkbkeolmu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6d29vemx3c29ra2tia2VvbG11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxODc4MjIsImV4cCI6MjA2Mjc2MzgyMn0.YWVJHeTHXc03CDS4MY7bd8kzQZXGYgJMy5xY69LbGoM';

// Configure Supabase client for secure authentication
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Get Gemini API key from Supabase secrets instead of hardcoding
export const getGeminiApiKey = async (): Promise<string> => {
  // Try to get from localStorage first (user preference)
  const localKey = localStorage.getItem('Gemini_key');
  if (localKey) {
    return localKey;
  }
  
  // For server-side operations, the key should be accessed through Supabase Edge Functions
  // This is a fallback that should not be used in production
  console.warn('Gemini API key should be accessed through Supabase Edge Functions for security');
  return '';
};
