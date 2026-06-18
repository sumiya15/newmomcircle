import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    // Authenticate user
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const { userId, method = 'button' } = await req.json() as { userId: string; method?: string };

    // Security: requesting user can only trigger their own SOS
    if (user.id !== userId) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: corsHeaders });
    }

    // Use service role client for writing SOS event + reading guardians
    const adminSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch user profile
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('display_name')
      .eq('id', userId)
      .single();

    // Fetch guardians
    const { data: guardians } = await adminSupabase
      .from('guardians')
      .select('*')
      .eq('user_id', userId);

    const recipients = guardians ?? [];
    const userName = profile?.display_name ?? 'A NewMomCircle member';

    const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioFrom = Deno.env.get('TWILIO_FROM_NUMBER');
    const hospitalPhone = Deno.env.get('HOSPITAL_PHONE');

    if (hospitalPhone) {
      recipients.push({ phone: hospitalPhone, name: 'Emergency Contact', relationship: 'hospital' });
    }

    let sent = false;
    let recipientCount = 0;

    if (twilioSid && twilioToken && twilioFrom && recipients.length > 0) {
      const smsMessage = `URGENT: ${userName} needs immediate help. This is an automated SOS from NewMomCircle.`;
      const voiceBody = `<Response><Say voice="alice" language="en-IN">This is an emergency alert from New Mom Circle. ${userName} needs immediate help. Please call them right away.</Say></Response>`;

      for (const guardian of recipients) {
        const formData = new URLSearchParams({ To: guardian.phone, From: twilioFrom, Body: smsMessage });
        await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
          method: 'POST',
          headers: { Authorization: `Basic ${btoa(`${twilioSid}:${twilioToken}`)}`, 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData,
        });
        const voiceData = new URLSearchParams({ To: guardian.phone, From: twilioFrom, Twiml: voiceBody });
        await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Calls.json`, {
          method: 'POST',
          headers: { Authorization: `Basic ${btoa(`${twilioSid}:${twilioToken}`)}`, 'Content-Type': 'application/x-www-form-urlencoded' },
          body: voiceData,
        });
        recipientCount++;
      }
      sent = true;
    }

    // Write audit log using service role (bypasses RLS)
    await adminSupabase.from('sos_events').insert({
      user_id: userId,
      triggered_at: new Date().toISOString(),
      recipient_count: recipientCount,
      method,
      status: sent ? 'sent' : 'mocked',
    });

    return new Response(JSON.stringify({ sent, recipientCount }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders });
  }
});
