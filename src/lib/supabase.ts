import { cookies } from "next/headers";
import {
  createBrowserClient as createSupabaseBrowserClient,
  createServerClient as createSupabaseServerClient,
} from "@supabase/ssr";
import {
  createClient,
  type PostgrestError,
  type SupabaseClient,
} from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type SupabaseConfig = {
  url: string;
  anonKey: string;
};

type SupabaseServiceConfig = {
  url: string;
  serviceRoleKey: string;
};

export type TypedSupabaseClient = SupabaseClient<Database>;
export type TableName = keyof Database["public"]["Tables"];

export type TableRow<T extends TableName> =
  Database["public"]["Tables"][T]["Row"];
export type TableInsert<T extends TableName> =
  Database["public"]["Tables"][T]["Insert"];
export type TableUpdate<T extends TableName> =
  Database["public"]["Tables"][T]["Update"];

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

function getSupabaseServiceConfig(): SupabaseServiceConfig {
  const { url } = getSupabaseConfig();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY in environment variables.");
  }

  return { url, serviceRoleKey };
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function isSupabaseServiceConfigured(): boolean {
  return isSupabaseConfigured() && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * Client Supabase côté navigateur (Client Components).
 */
export function createBrowserClient(): TypedSupabaseClient {
  const { url, anonKey } = getSupabaseConfig();

  return createSupabaseBrowserClient<Database>(url, anonKey);
}

/**
 * Client Supabase côté serveur (Server Components / Route Handlers / Server Actions).
 * Utilise le store de cookies Next.js pour la persistance de session.
 */
export async function createServerClient(): Promise<TypedSupabaseClient> {
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
export function createServiceRoleClient(): TypedSupabaseClient {
  const { url, serviceRoleKey } = getSupabaseServiceConfig();

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function getPaginationRange(page: number, pageSize: number): {
  from: number;
  to: number;
} {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safePageSize =
    Number.isFinite(pageSize) && pageSize > 0 ? Math.floor(pageSize) : 10;

  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;

  return { from, to };
}

export function isSupabaseError(error: unknown): error is PostgrestError {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    "details" in error &&
    "hint" in error &&
    "code" in error
  );
}
