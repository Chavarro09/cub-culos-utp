import { createClient } from "@supabase/supabase-js";

// Las llaves NO van en el código: Vercel las inyecta en el build como variables de entorno.
// La publishable es la llave pública; lo que cada quien puede leer o escribir lo deciden las políticas de RLS.
declare global {
  interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL: string;
    readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
  }
}

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
);
