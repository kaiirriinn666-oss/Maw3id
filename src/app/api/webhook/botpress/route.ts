import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function parseDate(val: string | undefined): string | null {
  if (!val) return null
  // Accepte YYYY-MM-DD ou "demain" ou "30/03/2026" etc.
  // Essaie de parser en date valide
  const iso = val.match(/^\d{4}-\d{2}-\d{2}$/)
  if (iso) return val
  const fr = val.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (fr) return `${fr[3]}-${fr[2].padStart(2, '0')}-${fr[1].padStart(2, '0')}`
  // Si c'est une description textuelle, retourne null
  return null
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-webhook-secret')
  if (secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { slug, nom_client, telephone, service, date_rdv, heure } = body

  if (!slug) {
    return NextResponse.json({ error: 'Slug manquant' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('id')
    .eq('slug', slug)
    .single()

  if (clientError || !client) {
    return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })
  }

  const dateFormatted = parseDate(date_rdv)

  const { error } = await supabase.from('reservations').insert([{
    client_id: client.id,
    nom_client_final: nom_client || null,
    telephone_client_final: telephone || null,
    service: service || null,
    date_rdv: dateFormatted,
    heure: heure || null,
    statut: 'Confirmé',
  }])

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
