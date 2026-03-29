import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  // Vérification du secret
  const secret = req.headers.get('x-webhook-secret')
  if (secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { slug, nom_client, telephone, service, date_rdv, heure } = body

  if (!slug || !nom_client || !service || !date_rdv) {
    return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
  }

  // Client Supabase avec service role (bypass RLS)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Trouver le client par slug
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('id')
    .eq('slug', slug)
    .single()

  if (clientError || !client) {
    return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })
  }

  // Insérer la réservation
  const { error } = await supabase.from('reservations').insert([{
    client_id: client.id,
    nom_client_final: nom_client,
    telephone_client_final: telephone || null,
    service,
    date_rdv,
    heure: heure || null,
    statut: 'Confirmé',
  }])

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
