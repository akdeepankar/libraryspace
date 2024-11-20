// lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://dpgpqoezghwbsfszbokb.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwZ3Bxb2V6Z2h3YnNmc3pib2tiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzEyMzczMTcsImV4cCI6MjA0NjgxMzMxN30.UpT2si6NhP6DH4UjEcptgUXjOpqq7_QVJ-ZVmSxmDjg";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
