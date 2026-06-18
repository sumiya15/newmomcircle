import type { AuthError } from "@supabase/supabase-js";

/** Maps a Supabase AuthError to an i18n translation key. */
export function authErrorKey(error: AuthError): string {
  const msg = error.message?.toLowerCase() ?? "";
  if (msg.includes("already registered") || msg.includes("already been used") || msg.includes("user_already_exists")) return "error_email_in_use";
  if (msg.includes("invalid login credentials") || msg.includes("invalid_credentials")) return "error_invalid_credentials";
  if (msg.includes("weak password") || msg.includes("at least 6 characters")) return "error_weak_password";
  if (msg.includes("invalid email") || msg.includes("unable to validate email")) return "error_required";
  if (msg.includes("rate limit") || msg.includes("too many requests")) return "error_too_many_requests";
  return "error_generic";
}

/** Maps a Supabase AuthError to a human-readable message (for contexts where i18next is unavailable). */
export function getAuthErrorMessage(error: AuthError): string {
  const msg = error.message?.toLowerCase() ?? "";
  if (msg.includes("already registered") || msg.includes("already been used")) return "This email is already associated with an account. Try signing in instead.";
  if (msg.includes("invalid login credentials")) return "Incorrect email or password. Please try again.";
  if (msg.includes("weak password") || msg.includes("at least 6 characters")) return "Password is too weak. Please use at least 6 characters.";
  if (msg.includes("invalid email") || msg.includes("unable to validate email")) return "The email address is not valid. Please check and try again.";
  if (msg.includes("rate limit") || msg.includes("too many requests")) return "Too many failed attempts. Please wait a moment before trying again.";
  if (msg.includes("email not confirmed")) return "Please verify your email address before signing in.";
  return error.message ?? "Something went wrong. Please try again or contact support.";
}
