import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wjpgyrhkgaoivioyssea.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqcGd5cmhrZ2FvaXZpb3lzc2VhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNzU5NjgsImV4cCI6MjA4Njg1MTk2OH0.0ny5JNW11E3PR_ooEdgiQ3KzowtnPY41hFlSlphJoT8'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)