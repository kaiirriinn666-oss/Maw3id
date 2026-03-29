import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function parseRecap(text: string) {
  const get = (keys: string[]) => {
    for (const key of keys) {
      const match = text.match(new RegExp(`${key}\\s*[:\\-]\\s*([^\\n•\\*]+)`, 'i'))
      if (match) return match[1].trim()
    }
    return null
  }

  const service = get(['Service'])
  const nom = get(['Nom et prénom', 'Nom', 'Prénom et nom', 'Prénom'])
  const tel = get(['Téléphone', 'Tel', 'Phone', 'Numéro'])

  // Date parsing
  let date_rdv: string | null = null
  const dateMatch = text.match(/Date\s*[:\-]\s*([^\n•\*]+)/i)
  if (dateMatch) {
    const raw = dateMatch[1].trim()
    // Format DD/MM/YYYY
    const fr = raw.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
    if (fr) {
      date_rdv = `${fr[3]}-${fr[2].padStart(2,'0')}-${fr[1].padStart(2,'0')}`
    }
    // Format YYYY-MM-DD
    else if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
      date_rdv = raw.match(/(\d{4}-\d{2}-\d{2})/)![1]
    }
    // "Demain à 14h00" ou "Lundi 30 mars"
    else {
      const heureInDate = raw.match(/(\d{1,2})[h:](\d{2})/)
      if (heureInDate) {
        // On garde la date brute, on extrait l'heure
        const now = new Date()
        if (raw.toLowerCase().includes('demain')) {
          const tomorrow = new Date(now)
          tomorrow.setDate(tomorrow.getDate() + 1)
          date_rdv = tomorrow.toISOString().split('T')[0]
        }
      }
    }
  }

  // Heure parsing
  let heure: string | null = null
  const heureMatch = text.match(/(?:Heure|Créneau|heure)\s*[:\-]\s*([^\n•\*]+)/i)
  if (heureMatch) {
    const raw = heureMatch[1].trim()
    const h = raw.match(/(\d{1,2})[h:](\d{2})?/)
    if (h) heure = `${h[1].padStart(2,'0')}:${(h[2] || '00').padStart(2,'0')}`
  }
  // Chercher l'heure dans la date si pas trouvée
  if (!heure && dateMatch) {
    const h = dateMatch[1].match(/(\d{1,2})[h:](\d{2})?/)
    if (h) heure = `${h[1].padStart(2,'0')}:${(h[2] || '00').padStart(2,'0')}`
  }

  return { service, nom_client: nom, telephone: tel, date_rdv, heure }
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

  const parsed = resume ? parseRecap(resume) : {}
  const nom_client = body.nom_client || (parsed as any).nom_client || null
  const telephone = body.telephone || (parsed as any).telephone || null
  const service = body.service || (parsed as any).service || null
  const date_rdv = body.date_rdv || (parsed as any).date_rdv || null
  const heure = body.heure || (parsed as any).heure || null

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
