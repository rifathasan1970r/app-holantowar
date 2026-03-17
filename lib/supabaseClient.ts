import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vbhplybsodeyxnwksucw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZiaHBseWJzb2RleXhud2tzdWN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0ODM1NTAsImV4cCI6MjA4NzA1OTU1MH0.cT3bvYfdxxA5QHxD4YYJ7ilUtMCHOsaEww5JqP4yixg';

export const supabase = createClient(supabaseUrl, supabaseKey);