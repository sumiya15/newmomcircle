// Maps Supabase Auth error messages to i18n keys.
// Supabase errors come as plain English strings, not codes like Firebase.
export function authErrorKey(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('email') && m.includes('already')) return 'error_email_in_use';
  if (m.includes('invalid login') || m.includes('invalid credentials')) return 'error_invalid_credentials';
  if (m.includes('password') && m.includes('weak')) return 'error_weak_password';
  if (m.includes('user not found')) return 'error_invalid_credentials';
  if (m.includes('rate limit')) return 'error_rate_limit';
  return 'error_generic';
}

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'Email already in use': 'This email is already associated with an account. Try signing in instead.',
  'User already registered': 'This email is already associated with an account. Try signing in instead.',
  'Invalid login credentials': 'Incorrect email or password. Please try again.',
  'User not found': 'No account found with this email address. Please check and try again.',
  'Password should be at least 6 characters': 'Password is too weak. Please use at least 6 characters.',
  'Email not confirmed': 'Please confirm your email address before signing in. Check your inbox for the confirmation link.',
  'Email rate limit exceeded': 'Too many attempts. Please wait a few minutes before trying again.',
  'Token has expired or is invalid': 'Your session has expired. Please sign in again.',
  'For security purposes, you can only request this once every 60 seconds':
    'Please wait 60 seconds before requesting another email.',
};

export function getAuthErrorMessage(message: string): string {
  // Try exact match first, then substring match for Supabase message variations
  if (AUTH_ERROR_MESSAGES[message]) return AUTH_ERROR_MESSAGES[message];
  const lower = message.toLowerCase();
  if (lower.includes('email not confirmed')) return AUTH_ERROR_MESSAGES['Email not confirmed']!;
  if (lower.includes('invalid login') || lower.includes('invalid credentials')) return AUTH_ERROR_MESSAGES['Invalid login credentials']!;
  if (lower.includes('already registered') || lower.includes('already been used')) return AUTH_ERROR_MESSAGES['User already registered']!;
  return 'Something went wrong. Please try again or contact support.';
}
