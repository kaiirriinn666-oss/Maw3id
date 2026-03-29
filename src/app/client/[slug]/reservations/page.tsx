'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Calendar, Search, CheckCircle, XCircle, Phone } from 'lucide-react'
import Link from 'next/link'

type Reservation = {
  id: string
  nom_client_final: string
  telephone_client_final: string
  service: string
  date_rdv: string
  heure: string
  statut: string
}

export default function ReservationsPage() {
  const { slug } = useParams()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [filtre, setFiltre] = useState('Tous')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      const { data: c } = await supabase.from('clients').select('id').eq('slug', slug).single()
      if (!c) { setLoading(false); return }
      const { data: r } = await supabase
        .from('reservations').select('*').eq('client_id', c.id)
        .order('date_rdv', { ascending: false }).order('heure', { ascending: false })
      setReservations(r || [])
      setLoading(false)
    }
    fetchData()
  }, [slug])

  async function updateStatut(id: string, newStatut: string) {
    setToggling(id)
    await supabase.from('reservations').update({ statut: newStatut }).eq('id', id)
    setReservations(prev => prev.map(r => r.id === id ? { ...r, statut: newStatut } : r))
    setToggling(null)
  }

  const filtres = ['Tous', 'Confirmé', 'Annulé', 'Modifié']
  const filtered = reservations
    .filter(r => filtre === 'Tous' || r.statut === filtre)
    .filter(r => !search ||
      r.nom_client_final?.toLowerCase().includes(search.toLowerCase()) ||
      r.service?.toLowerCase().includes(search.toLowerCase())
    )

  const counts = {
    Confirmé: reservations.filter(r => r.statut === 'Confirmé').length,
    Annulé: reservations.filter(r => r.statut === 'Annulé').length,
    enAttente: reservations.filter(r => r.statut !== 'Confirmé' && r.statut !== 'Annulé').length,
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0a0a14 0%, #0f0a1e 50%, #0a1410 100%)' }}>
      <div className="text-slate-400 flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        Chargement...
      </div>
    </div>
  )

  return (
    <div className="min-h-screen text-white" style={{ background: 'linear-gradient(135deg, #0a0a14 0%, #0f0a1e 50%, #0a1410 100%)' }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-violet-500/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-emerald-500/6 rounded-full blur-3xl" />
      </div>

      <nav className="sticky top-0 z-50 border-b border-white/5" style={{ background: 'rgba(10,10,20,0.85)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href={`/client/${slug}`}>
            <button className="p-2 rounded-xl border border-white/10 hover:border-white/20 transition-all cursor-pointer" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <ArrowLeft className="w-4 h-4 text-slate-300" />
            </button>
          </Link>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-violet-400" />
            <h1 className="font-bold text-lg">Réservations</h1>
            <span className="text-slate-500 text-sm font-normal">({reservations.length})</span>
          </div>
        </div>
      </nav>

      <div className="relative max-w-4xl mx-auto px-6 py-8 grid gap-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Confirmées', count: counts.Confirmé, color: 'text-emerald-300', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
            { label: 'En attente', count: counts.enAttente, color: 'text-amber-300', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
            { label: 'Annulées', count: counts.Annulé, color: 'text-red-300', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' },
          ].map(({ label, count, color, bg, border }) => (
            <div key={label} className="rounded-xl p-4 border text-center" style={{ background: bg, borderColor: border, backdropFilter: 'blur(20px)' }}>
              <div className={`text-2xl font-bold ${color}`}>{count}</div>
              <div className="text-xs text-slate-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Search + filtres */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Rechercher un client ou service..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            />
          </div>
          <div className="flex gap-2">
            {filtres.map(f => (
              <button
                key={f}
                onClick={() => setFiltre(f)}
                className={`px-3 py-2 text-xs rounded-xl border transition-all cursor-pointer ${filtre === f ? 'border-emerald-500/50 text-emerald-300' : 'border-white/10 text-slate-400 hover:border-white/20 hover:text-white'}`}
                style={{ background: filtre === f ? 'rgba(37,211,102,0.1)' : 'rgba(255,255,255,0.04)' }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Liste */}
        <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)' }}>
          <div className="divide-y divide-white/5">
            {filtered.map(r => {
              const dateObj = new Date(r.date_rdv + 'T00:00:00')
              const dateLabel = dateObj.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
              return (
                <div key={r.id} className="px-6 py-4 flex items-center gap-4 hover:bg-white/3 transition-colors group">
                  {/* Date + heure */}
                  <div className="shrink-0 w-24">
                    <div className="text-xs font-medium text-slate-300 capitalize leading-tight">{dateLabel}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{r.heure || '—'}</div>
                  </div>
                  {/* Infos client */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white text-sm truncate">{r.nom_client_final}</div>
                    <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>{r.service}</span>
                      {r.telephone_client_final && (
                        <>
                          <span className="text-slate-700">·</span>
                          <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{r.telephone_client_final}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {/* Statut + actions */}
                  <div className="shrink-0 flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      r.statut === 'Confirmé' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      r.statut === 'Annulé' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                      'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>{r.statut}</span>

                    {r.statut !== 'Annulé' && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {r.statut !== 'Confirmé' && (
                          <button
                            onClick={() => updateStatut(r.id, 'Confirmé')}
                            disabled={toggling === r.id}
                            className="p-1.5 rounded-lg border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 transition-all cursor-pointer disabled:opacity-50"
                            title="Confirmer">
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => updateStatut(r.id, 'Annulé')}
                          disabled={toggling === r.id}
                          className="p-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all cursor-pointer disabled:opacity-50"
                          title="Annuler">
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            {filtered.length === 0 && (
              <div className="px-6 py-16 text-center text-slate-500">
                <Calendar className="w-9 h-9 mx-auto mb-3 text-slate-700" />
                {search ? 'Aucun résultat pour cette recherche' : 'Aucune réservation'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
