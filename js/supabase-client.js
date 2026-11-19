
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

const configured = SUPABASE_URL.startsWith("https://") &&
  !SUPABASE_URL.includes("COLOQUE_AQUI") &&
  SUPABASE_ANON_KEY.length > 20 &&
  !SUPABASE_ANON_KEY.includes("COLOQUE_AQUI");

export const supabase = configured ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
export const isConfigured = configured;
