import type { AppSupabaseClient } from './client';

export interface SosAlertResult {
  sent: boolean;
  recipientCount: number;
  reason?: string;
}

/**
 * Triggers the SOS alert Edge Function.
 * The function calls Twilio to send SMS + voice calls to all guardians.
 */
export async function sendSosAlert(
  supabase: AppSupabaseClient,
  userId: string,
  method: 'button' | 'shake' = 'button'
): Promise<SosAlertResult> {
  const { data, error } = await supabase.functions.invoke('send-sos-alert', {
    body: { userId, method },
  });
  if (error) {
    return { sent: false, recipientCount: 0, reason: error.message };
  }
  return data as SosAlertResult;
}
