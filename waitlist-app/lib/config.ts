// Launch date shown in the countdown (IST).
export const LAUNCH_AT = new Date("2026-12-15T10:00:00+05:30");

// Supabase publishable key: public by design, and RLS allows insert only on `waitlist`.
// Env vars override these when set at build time.
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://smofafboqldhgpbazpgs.supabase.co";
export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_KEY ??
  "sb_publishable_DJ4W2uSGYsUFbUE4rl3Hmg_aISwHGJ4";
