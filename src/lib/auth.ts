// Centralized Supabase session/auth state.
//
// - `initAuthSync()` mirrors the current Supabase access token into
//   localStorage (`auth_token`) so the legacy fetch wrapper in main.tsx keeps
//   attaching a valid Authorization header for same-origin /api/* calls, and
//   clears it on sign-out.
// - `useSupabaseSession()` is the single source of truth React components
//   should consult when they need the current session/user.
// - `hasActiveSession()` is a synchronous cached check for imperative
//   callers (analytics, bookings side-effects) so they can no-op cleanly
//   when the visitor is signed out instead of firing failing requests.

import { useEffect, useState } from "react";
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "../integrations/supabase/client";

const TOKEN_KEY = "auth_token";

let cachedSession: Session | null = null;
let initialized = false;
let initPromise: Promise<void> | null = null;

function writeToken(session: Session | null) {
  try {
    if (session?.access_token) {
      localStorage.setItem(TOKEN_KEY, session.access_token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    /* localStorage may be unavailable (SSR, privacy mode) */
  }
}

/**
 * Idempotent. Hydrates the cached Supabase session, mirrors the access token
 * into localStorage, and subscribes to auth state changes so the token stays
 * in sync with sign-in / refresh / sign-out.
 */
export function initAuthSync(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const { data } = await supabase.auth.getSession();
    cachedSession = data.session ?? null;
    writeToken(cachedSession);
    initialized = true;

    supabase.auth.onAuthStateChange((_event, session) => {
      cachedSession = session ?? null;
      writeToken(cachedSession);
    });
  })();
  return initPromise;
}

/** Synchronous check — safe to use in imperative guards. */
export function hasActiveSession(): boolean {
  return !!cachedSession?.access_token;
}

/** Current cached user id, or null when signed out. */
export function getCurrentUserId(): string | null {
  return cachedSession?.user?.id ?? null;
}

export interface SupabaseSessionState {
  session: Session | null;
  user: SupabaseUser | null;
  loading: boolean;
}

/**
 * React hook exposing the current Supabase session. Components should prefer
 * this over calling `supabase.auth.getSession()` directly so we have a single
 * subscription and consistent re-render behavior.
 */
export function useSupabaseSession(): SupabaseSessionState {
  const [session, setSession] = useState<Session | null>(cachedSession);
  const [loading, setLoading] = useState<boolean>(!initialized);

  useEffect(() => {
    let cancelled = false;

    initAuthSync().then(() => {
      if (cancelled) return;
      setSession(cachedSession);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      if (cancelled) return;
      setSession(next ?? null);
      setLoading(false);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { session, user: session?.user ?? null, loading };
}
