import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL      = Deno.env.get('SUPABASE_URL')              ?? ''
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')         ?? ''
const SERVICE_KEY       = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const RESEND_KEY        = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  // ── Auth: verify caller is an admin ──────────────────────────────────
  const jwt = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!jwt) return new Response('Unauthorized', { status: 401, headers: corsHeaders })

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  })
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401, headers: corsHeaders })

  const admin = createClient(SUPABASE_URL, SERVICE_KEY)
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return new Response('Forbidden', { status: 403, headers: corsHeaders })

  // ── Parse body ───────────────────────────────────────────────────────
  const { submissionId, decision, adminNotes } = await req.json()
  if (!submissionId || !['approved', 'rejected'].includes(decision)) {
    return new Response('Bad request', { status: 400, headers: corsHeaders })
  }

  // ── Update submission ────────────────────────────────────────────────
  const { data: sub, error } = await admin
    .from('operator_submissions')
    .update({
      status:       decision,
      admin_notes:  adminNotes || null,
      reviewed_at:  new Date().toISOString(),
    })
    .eq('id', submissionId)
    .select()
    .single()

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // ── Send operator notification email ─────────────────────────────────
  if (RESEND_KEY && sub.operator_email) {
    const approved = decision === 'approved'
    await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from:    'Vtopia <hello@vtopia.world>',
        to:      sub.operator_email,
        subject: approved
          ? `Your listing "${sub.title}" is approved on Vtopia!`
          : `Update on your Vtopia listing submission`,
        html: approved
          ? `<h2>You're live on Vtopia! 🎉</h2>
<p>Hi ${sub.operator_name},</p>
<p>Your experience <strong>"${sub.title}"</strong> has been approved and will appear to visitors on Vtopia.</p>
${adminNotes ? `<p><strong>Note from our team:</strong> ${adminNotes}</p>` : ''}
<p>Questions? Reply to this email or contact <a href="mailto:support@vtopia.world">support@vtopia.world</a>.</p>
<p>— The Vtopia team</p>`
          : `<h2>Update on your submission</h2>
<p>Hi ${sub.operator_name},</p>
<p>Thank you for submitting <strong>"${sub.title}"</strong>. Unfortunately we're unable to list this experience at this time.</p>
${adminNotes ? `<p><strong>Reason:</strong> ${adminNotes}</p>` : ''}
<p>Want to resubmit with changes? Contact us at <a href="mailto:support@vtopia.world">support@vtopia.world</a>.</p>
<p>— The Vtopia team</p>`,
      }),
    }).catch(e => console.error('Resend failed:', e))
  }

  return new Response(JSON.stringify({ ok: true, status: decision }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
