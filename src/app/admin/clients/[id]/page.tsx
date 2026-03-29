'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Phone, Mail, MapPin, Bot, Calendar, ExternalLink, Power } from 'lucide-react'
import Link from 'next/link'

export default function ClientDetail() {
  const { id } = useParams()
  const [client, setClient] = useState<any>(null)
  const [paiements, setPaiements] = useState<any[]>([])
  const [reservations, setReservations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)

  useEffect(() => { fetchClient() }, [id])

  async function fetchClient() {
    const [{ data: c }, { data: p }, { data: r }] = await Promise.all([
      supabase.from('clients').select('*').eq('id', id).single(),
      supabase.from('paiements').select('*').eq('client_id', id).order('created_at', { ascending: false }),
      supabase.from('reservations').select('*').eq('client_id', id).order('created_at', { ascending: false }).limit(5)
    ])
    setClient(c)
    setPaiements(p || [])
    setReservations(r || [])
    setLoading(false)
  }

  async function toggleStatut() {
    setToggling(true)
    const newStatut = client.statut === 'Actif' ? 'Inactif' : 'Actif'
    await supabase.from('clients').update({ statut: newStatut }).eq('id', id)
    setClient({ ...client, statut: newStatut })
    setToggling(false)
  }

  const statutBadge: Record<string, string> = {
    'Actif': 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    'Inactif': 'bg-red-500/20 text-red-300 border border-red-500/30',
    'Essai': 'bg-sky-500/20 text-sky-300 border border-sky-500/30',
  }

  const paiementBadge: Record<string, string> = {
    'Payé': 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    'En attente': 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    'Retard': 'bg-red-500/20 text-red-300 border border-red-500/30',
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0a0a14 0%, #0f0a1e 50%, #0a1410 100%)' }}>
      <div className="text-slate-400 flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        Chargement...
      </div>
    </div>
  )

  if (!client) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0a0a14 0%, #0f0a1e 50%, #0a1410 100%)' }}>
      <div className="text-slate-400">Client introuvable</div>
    </div>
  )

  return (
    <div className="min-h-screen text-white" style={{ background: 'linear-gradient(135deg, #0a0a14 0%, #0f0a1e 50%, #0a1410 100%)' }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/8 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-40 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl" />
      </div>

      <nav className="sticky top-0 z-50 border-b border-white/5" style={{ background: 'rgba(10,10,20,0.8)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/admin">
            <button className="p-2 rounded-xl border border-white/10 hover:border-white/20 transition-all cursor-pointer" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <ArrowLeft className="w-4 h-4 text-slate-300" />
            </button>
          </Link>
          <div>
            <h1 className="font-bold text-lg leading-tight">{client.nom_commerce}</h1>
            {client.proprietaire && <div className="text-xs text-slate-500">{client.proprietaire}</div>}
          </div>
        </div>
      </nav>

      <div className="relative max-w-4xl mx-auto px-6 py-8 grid gap-5">
        {/* Infos + Toggle */}
        <div className="rounded-2xl border border-white/10 p-6" style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)' }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-xl font-bold shadow-lg shadow-emerald-500/20">
                {client.nom_commerce[0]}
              </div>
              <div>
                <div className="font-semibold text-white">{client.nom_commerce}</div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statutBadge[client.statut] || ''}`}>{client.statut}</span>
              </div>
            </div>
            <button
              onClick={toggleStatut}
              disabled={toggling}
              className={`px-4 py-2 text-sm font-medium rounded-xl flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50 border ${client.statut === 'Actif' ? 'border-red-500/30 text-red-300 hover:bg-red-500/10' : 'border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10'}`}
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              <Power className="w-4 h-4" />
              {toggling ? '...' : client.statut === 'Actif' ? 'Désactiver' : 'Activer'}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Phone, value: client.telephone, label: 'Téléphone' },
              { icon: Mail, value: client.email, label: 'Email' },
              { icon: MapPin, value: client.ville, label: 'Ville' },
              { icon: Bot, value: client.numero_whatsapp, label: 'WhatsApp bot' },
              { icon: Calendar, value: client.date_debut, label: 'Depuis' },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex items-center gap-3 text-sm">
                <Icon className="w-4 h-4 text-slate-500 shrink-0" />
                <div>
                  <div className="text-xs text-slate-500">{label}</div>
                  <div className="text-slate-300">{value || '—'}</div>
                </div>
              </div>
            ))}
            {client.slug && (
              <div className="flex items-center gap-3 text-sm">
                <ExternalLink className="w-4 h-4 text-slate-500 shrink-0" />
                <div>
                  <div className="text-xs text-slate-500">Lien client</div>
                  <Link href={`/client/${client.slug}`} target="_blank" className="text-emerald-400 hover:text-emerald-300 transition-colors">
                    /client/{client.slug}
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Paiements */}
        <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)' }}>
          <div className="px-6 py-4 border-b border-white/5">
            <h2 className="font-semibold">Historique paiements</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {['Mois', 'Montant', 'Méthode', 'Statut'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paiements.map(p => (
                <tr key={p.id} className="hover:bg-white/3 transition-colors">
                  <td className="px-6 py-3 text-slate-400">{p.mois}</td>
                  <td className="px-6 py-3 font-semibold">{p.montant_mad} MAD</td>
                  <td className="px-6 py-3 text-slate-400">{p.methode}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${paiementBadge[p.statut] || ''}`}>{p.statut}</span>
                  </td>
                </tr>
              ))}
              {paiements.length === 0 && <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">Aucun paiement</td></tr>}
            </tbody>
          </table>
        </div>

        {/* Réservations */}
        <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)' }}>
          <div className="px-6 py-4 border-b border-white/5">
            <h2 className="font-semibold">Réservations récentes</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {['Client', 'Service', 'Date & Heure', 'Statut'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {reservations.map(r => (
                <tr key={r.id} className="hover:bg-white/3 transition-colors">
                  <td className="px-6 py-3 text-white">{r.nom_client_final}</td>
                  <td className="px-6 py-3 text-slate-400">{r.service}</td>
                  <td className="px-6 py-3 text-slate-400">{r.date_rdv} {r.heure}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${r.statut === 'Confirmé' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : r.statut === 'Annulé' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                      {r.statut}
                    </span>
                  </td>
                </tr>
              ))}
              {reservations.length === 0 && <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">Aucune réservation</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
