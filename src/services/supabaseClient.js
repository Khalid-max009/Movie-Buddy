import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("🔍 CHECKING SUPABASE CONFIG:");
console.log("URL:", supabaseUrl);
console.log("ANON KEY PRESENT:", supabaseAnonKey ? `Yes (Length: ${supabaseAnonKey.length}, Starts with: ${supabaseAnonKey.substring(0, 5)}...)` : "NO - MISSING");

export const supabase = createClient(supabaseUrl, supabaseAnonKey);