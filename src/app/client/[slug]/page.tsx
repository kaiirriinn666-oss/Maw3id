'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Calendar, CreditCard, Bot, Users, CheckCircle, XCircle, Clock, Phone, ChevronRight } from 'lucide-react'
import Link from 'next/link'

type Client = {
  id: string
  nom_commerce: string
  proprietaire: string
  plan: string
  statut: string
  slug: string
}

type Reservation = {
  id: string
  nom_client_final: string
  telephone_client_final: string
  service: string
  date_rdv: string
  heure: string
  statut: string
}

const statutBadge: Record<string, string> = {
  'Actif': 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  'Inactif': 'bg-red-500/20 text-red-300 border border-red-500/30',
  'Essai': 'bg-sky-500/20 text-sky-300 border border-sky-500/30',
}

function toDateStr(d: Date) {
  return d.toISOString().split('T')[0]
}

export default function ClientPortal() {
  const { slug } = useParams()
  const [client, setClient] = useState<Client | null>(null)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [paiements, setPaiements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      const { data: c } = await supabase.from('clients').select('*').eq('slug', slug).single()
      if (!c) { setLoading(false); return }
      const [{ data: r }, { data: p }] = await Promise.all([
        supabase.from('reservations').select('*').eq('client_id', c.id)
          .order('date_rdv', { ascending: true }).order('heure', { ascending: true }),
        supabase.from('paiements').select('*').eq('client_id', c.id).order('mois', { ascending: false }),
      ])
      setClient(c)
      setReservations(r || [])
      setPaiements(p || [])
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

  const today = toDateStr(new Date())
  const in7days = toDateStr(new Date(Date.now() + 7 * 86400000))

  const rdvAujourdhui = reservations.filter(r => r.date_rdv === today && r.statut !== 'Annulé')
  const rdvAVenir = reservations.filter(r => r.date_rdv > today && r.date_rdv <= in7days && r.statut !== 'Annulé')

  const now = new Date()
  const rdvCeMois = reservations.filter(r => {
    const d = new Date(r.date_rdv)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const totalMois = rdvCeMois.length
  const confirmes = rdvCeMois.filter(r => r.statut === 'Confirmé').length
  const tauxConfirmation = totalMois > 0 ? Math.round((confirmes / totalMois) * 100) : 0
  const nouveauxClients = new Set(
    rdvCeMois.filter(r => r.nom_client_final).map(r => r.nom_client_final.toLowerCase().trim())
  ).size

  const prochainPaiement = paiements.find(p => p.statut === 'En attente' || p.statut === 'Retard')

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
      <div className="text-center">
        <Bot className="w-12 h-12 text-slate-700 mx-auto mb-3" />
        <div className="text-slate-400">Espace client introuvable</div>
        <div className="text-slate-600 text-sm mt-1">Vérifiez votre lien d'accès</div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen text-white" style={{ background: 'linear-gradient(135deg, #0a0a14 0%, #0f0a1e 50%, #0a1410 100%)' }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/8 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-80 h-80 bg-violet-500/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/2 w-72 h-72 bg-teal-500/6 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5" style={{ background: 'rgba(10,10,20,0.85)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center font-bold text-sm shadow-lg shadow-emerald-500/20">
              {client.nom_commerce[0]}
            </div>
            <div>
              <div className="font-bold text-sm leading-tight">{client.nom_commerce}</div>
              {client.proprietaire && <div className="text-xs text-slate-500">{client.proprietaire}</div>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statutBadge[client.statut] || ''}`}>
              {client.statut}
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-slate-500">Bot actif</span>
            </div>
          </div>
        </div>
      </header>

      <div className="relative max-w-4xl mx-auto px-6 py-8 grid gap-6">

        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { title: 'RDV ce mois', value: totalMois, icon: Calendar, color: 'text-emerald-400' },
            { title: 'Nouveaux clients', value: nouveauxClients, icon: Users, color: 'text-violet-400' },
            { title: 'Taux confirmation', value: `${tauxConfirmation}%`, icon: CheckCircle, color: 'text-teal-400' },
          ].map(({ title, value, icon: Icon, color }) => (
            <div key={title}
              className="rounded-2xl p-4 sm:p-5 border border-white/10 transition-all duration-300 hover:border-white/20 hover:-translate-y-1 cursor-default"
              style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-xs font-medium uppercase tracking-wider leading-tight">{title}</span>
                <Icon className={`w-4 h-4 shrink-0 ${color}`} />
              </div>
              <div className="text-2xl font-bold tracking-tight">{value}</div>
            </div>
          ))}
        </div>

        {/* Aujourd'hui */}
        <div className="rounded-2xl border overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.03)', borderColor: rdvAujourdhui.length > 0 ? 'rgba(37,211,102,0.25)' : 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}>
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between"
            style={{ background: rdvAujourdhui.length > 0 ? 'rgba(37,211,102,0.05)' : 'transparent' }}>
            <div className="flex items-center gap-2">
              <Clock className={`w-4 h-4 ${rdvAujourdhui.length > 0 ? 'text-emerald-400' : 'text-slate-500'}`} />
              <h2 className="font-semibold text-white">Aujourd'hui</h2>
              {rdvAujourdhui.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {rdvAujourdhui.length} RDV
                </span>
              )}
            </div>
            <span className="text-xs text-slate-500">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          </div>

          {rdvAujourdhui.length === 0 ? (
            <div className="px-6 py-10 text-center text-slate-500">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-700" />
              <div className="text-sm">Aucun rendez-vous aujourd'hui</div>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {rdvAujourdhui.map(r => (
                <div key={r.id} className="px-6 py-4 flex items-center gap-4 hover:bg-white/3 transition-colors group">
                  {/* Heure */}
                  <div className="shrink-0 w-14 text-center">
                    <div className="text-base font-bold text-emerald-300">{r.heure || '—'}</div>
                  </div>
                  {/* Infos */}
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
                    {r.statut === 'Confirmé' ? (
                      <>
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Confirmé</span>
                        <button
                          onClick={() => updateStatut(r.id, 'Annulé')}
                          disabled={toggling === r.id}
                          className="p-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all cursor-pointer disabled:opacity-50"
                          title="Annuler">
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    ) : r.statut === 'Modifié' ? (
                      <>
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">Modifié</span>
                        <button
                          onClick={() => updateStatut(r.id, 'Confirmé')}
                          disabled={toggling === r.id}
                          className="p-1.5 rounded-lg border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 transition-all cursor-pointer disabled:opacity-50"
                          title="Confirmer">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => updateStatut(r.id, 'Annulé')}
                          disabled={toggling === r.id}
                          className="p-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all cursor-pointer disabled:opacity-50"
                          title="Annuler">
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">En attente</span>
                        <button
                          onClick={() => updateStatut(r.id, 'Confirmé')}
                          disabled={toggling === r.id}
                          className="p-1.5 rounded-lg border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 transition-all cursor-pointer disabled:opacity-50"
                          title="Confirmer">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => updateStatut(r.id, 'Annulé')}
                          disabled={toggling === r.id}
                          className="p-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all cursor-pointer disabled:opacity-50"
                          title="Annuler">
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Prochains RDV (7 jours) */}
        <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)' }}>
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-violet-400" />
              <h2 className="font-semibold text-white">Prochains RDV</h2>
              <span className="text-slate-500 text-xs">7 prochains jours</span>
            </div>
            <Link href={`/client/${slug}/reservations`} className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1">
              Tout voir <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {rdvAVenir.length === 0 ? (
            <div className="px-6 py-10 text-center text-slate-500">
              <div className="text-sm">Aucun RDV dans les 7 prochains jours</div>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {rdvAVenir.map(r => {
                const dateObj = new Date(r.date_rdv + 'T00:00:00')
                const dateLabel = dateObj.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
                return (
                  <div key={r.id} className="px-6 py-3.5 flex items-center gap-4 hover:bg-white/3 transition-colors group">
                    <div className="shrink-0 w-20">
                      <div className="text-xs font-medium text-violet-300 capitalize">{dateLabel}</div>
                      <div className="text-xs text-slate-500">{r.heure || ''}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{r.nom_client_final}</div>
                      <div className="text-xs text-slate-500 truncate">{r.service}</div>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        r.statut === 'Confirmé' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                        r.statut === 'Annulé' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                        'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>{r.statut}</span>
                      {r.statut !== 'Confirmé' && r.statut !== 'Annulé' && (
                        <button
                          onClick={() => updateStatut(r.id, 'Confirmé')}
                          disabled={toggling === r.id}
                          className="p-1.5 rounded-lg border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 transition-all cursor-pointer disabled:opacity-50 opacity-0 group-hover:opacity-100"
                          title="Confirmer">
                          <CheckCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Prochain paiement */}
        {prochainPaiement && (
          <div className="rounded-2xl border p-5 flex items-center justify-between"
            style={{
              background: prochainPaiement.statut === 'Retard' ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.06)',
              borderColor: prochainPaiement.statut === 'Retard' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.25)',
              backdropFilter: 'blur(20px)'
            }}>
            <div className="flex items-center gap-3">
              <CreditCard className={`w-5 h-5 ${prochainPaiement.statut === 'Retard' ? 'text-red-400' : 'text-amber-400'}`} />
              <div>
                <div className="text-sm font-medium text-white">
                  {prochainPaiement.statut === 'Retard' ? 'Paiement en retard' : 'Paiement à venir'}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {prochainPaiement.montant_mad} MAD — {prochainPaiement.mois}
                </div>
              </div>
            </div>
            <Link href={`/client/${slug}/paiements`}>
              <span className={`px-3 py-1.5 rounded-xl text-xs font-medium border cursor-pointer transition-all hover:opacity-80 ${
                prochainPaiement.statut === 'Retard'
                  ? 'bg-red-500/10 text-red-300 border-red-500/30'
                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
              }`}>Voir →</span>
            </Link>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pb-2">
          <div className="flex items-center justify-center gap-2 text-xs text-slate-700">
            <Bot className="w-3 h-3" />
            <span>Propulsé par BotMaroc</span>
          </div>
        </div>
      </div>
    </div>
  )
}
