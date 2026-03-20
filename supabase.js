import { createClient } from '@supabase/supabase-js';

// UNI-LINK LIVE BACKEND (MOBILE-READY)
const supabaseUrl = "https://jqlzjbuktfeentfuvzhg.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxbHpqYnVrdGZlZW50ZnV2emhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5ODUxMTEsImV4cCI6MjA4OTU2MTExMX0.BYNXdzDoXv6l6C0-j7_IThH7cnckh45H0XeKK9kYneM";

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);
