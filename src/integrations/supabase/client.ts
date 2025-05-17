
import { createClient } from '@supabase/supabase-js';

// Add constants for Supabase URL and key
const SUPABASE_URL = 'https://ezwoozlwsokkkbkeolmu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6d29vemx3c29ra2tia2VvbG11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxODc4MjIsImV4cCI6MjA2Mjc2MzgyMn0.YWVJHeTHXc03CDS4MY7bd8kzQZXGYgJMy5xY69LbGoM';

// Export environment variables for client-side access if we have them
export const GEMINI_API_KEY = typeof window !== 'undefined' ? 
  localStorage.getItem('Gemini_key') || 'AIzaSyAe8rheF4wv2ZHJB2YboUhyyVlM2y0vmlk' : 
  'AIzaSyAe8rheF4wv2ZHJB2YboUhyyVlM2y0vmlk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
