import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

async function hashToken(token: string) {
  const bytes = new TextEncoder().encode(token)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

function response(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await request.json()
    if (body.action === 'create') {
      const authHeader = request.headers.get('Authorization')
      const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader ?? '' } } })
      const { data: { user } } = await userClient.auth.getUser()
      if (!user) return response({ error: 'Authentication required.' }, 401)

      const token = `${crypto.randomUUID()}-${crypto.randomUUID()}`
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()
      const { error } = await supabase.from('capture_sessions').insert({ player_id: body.playerId, token_hash: await hashToken(token), expires_at: expiresAt })
      if (error) return response({ error: error.message }, 400)
      return response({ token, expiresAt })
    }

    if (body.action === 'upload') {
      const token = String(body.token ?? '')
      const playerId = String(body.playerId ?? '')
      const { data: session } = await supabase.from('capture_sessions').select('*').eq('player_id', playerId).eq('token_hash', await hashToken(token)).is('used_at', null).gt('expires_at', new Date().toISOString()).maybeSingle()
      if (!session) return response({ error: 'This capture link is invalid or expired.' }, 401)

      const dataUrl = String(body.image ?? '')
      const match = dataUrl.match(/^data:image\/jpeg;base64,(.+)$/)
      if (!match) return response({ error: 'Only JPEG images are accepted.' }, 400)
      const bytes = Uint8Array.from(atob(match[1]), (character) => character.charCodeAt(0))
      const path = `${playerId}/${crypto.randomUUID()}.jpg`
      const { error: uploadError } = await supabase.storage.from('player-photos').upload(path, bytes, { contentType: 'image/jpeg', upsert: false })
      if (uploadError) return response({ error: uploadError.message }, 400)
      const { data: publicUrl } = supabase.storage.from('player-photos').getPublicUrl(path)
      const { error: playerError } = await supabase.from('players').update({ photo_url: publicUrl.publicUrl }).eq('id', playerId)
      if (playerError) return response({ error: playerError.message }, 400)
      await supabase.from('capture_sessions').update({ used_at: new Date().toISOString() }).eq('id', session.id)
      return response({ photoUrl: publicUrl.publicUrl })
    }

    return response({ error: 'Unknown action.' }, 400)
  } catch (error) {
    return response({ error: error instanceof Error ? error.message : 'Unexpected error.' }, 500)
  }
})
