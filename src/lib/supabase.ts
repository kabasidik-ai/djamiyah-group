import { cookies } from "next/headers";
import {
  createBrowserClient as createSupabaseBrowserClient,
  createServerClient as createSupabaseServerClient,
} from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Type temporaire en attendant src/types/database.ts.
 * Remplacer par: import type { Database } from "@/types/database";
 */
export type SupabaseDatabase = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

type SupabaseConfig = {
  url: string;
  anonKey: string;
};

function getSupabaseConfig(): SupabaseConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL in environment variables.");
  }

  if (!anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY in environment variables.");
  }

  return { url, anonKey };
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/**
 * Client Supabase côté navigateur (Client Components).
 */
export function createBrowserClient<Database = SupabaseDatabase>(): SupabaseClient<Database> {
  const { url, anonKey } = getSupabaseConfig();

  return createSupabaseBrowserClient<Database>(url, anonKey);
}

/**
 * Client Supabase côté serveur (Server Components / Route Handlers / Server Actions).
 * Utilise le store de cookies Next.js pour la persistance de session.
 */
export async function createServerClient<Database = SupabaseDatabase>(): Promise<
  SupabaseClient<Database>
> {
  const { url, anonKey } = getSupabaseConfig();
  const cookieStore = await cookies();

  return createSupabaseServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Dans certains contextes (ex: Server Components), set peut être indisponible.
        }
      },
    },
  });
}

/**
 * Client admin avec SERVICE_ROLE (serveur uniquement).
 * Ne jamais exposer côté client.
 */
export function createServiceRoleClient<Database = SupabaseDatabase>(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL in environment variables.");
  }

  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY in environment variables.");
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
