import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function parseResume(resume: string) {
  const get = (key: string) => {
    const match = resume.match(new RegExp(`${key}:([^|\\n]+)`))
    return match ? match[1].trim() : null
  }
  return {
    service: get('SERVICE'),
    date_rdv: get('DATE'),
    heure: get('HEURE'),
    nom_client: get('NOM'),
    telephone: get('TEL'),
  }
}

function parseDate(val: string | null): string | null {
  if (!val) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val
  const fr = val.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (fr) return `${fr[3]}-${fr[2].padStart(2, '0')}-${fr[1].padStart(2, '0')}`
  return null
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-webhook-secret')
  if (secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { slug, resume } = body

  if (!slug) {
    return NextResponse.json({ error: 'Slug manquant' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: client, error: clientError } = await supabase
    .from('clients').select('id').eq('slug', slug).single()

  if (clientError || !client) {
    return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })
  }

  // Parser le résumé si fourni, sinon utiliser les champs directs
  let nom_client = body.nom_client || null
  let telephone = body.telephone || null
  let service = body.service || null
  let date_rdv = parseDate(body.date_rdv) || null
  let heure = body.heure || null

  if (resume) {
    const parsed = parseResume(resume)
    nom_client = nom_client || parsed.nom_client
    telephone = telephone || parsed.telephone
    service = service || parsed.service
    date_rdv = date_rdv || parseDate(parsed.date_rdv)
    heure = heure || parsed.heure
  }

  const { error } = await supabase.from('reservations').insert([{
    client_id: client.id,
    nom_client_final: nom_client,
    telephone_client_final: telephone,
    service,
    date_rdv,
    heure,
    statut: 'Confirmé',
  }])

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
