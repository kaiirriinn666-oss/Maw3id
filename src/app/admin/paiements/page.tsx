'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default function PaiementsPage() {
  const [paiements, setPaiements] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [filtre, setFiltre] = useState('Tous')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const [{ data: p }, { data: c }] = await Promise.all([
        supabase.from('paiements').select('*').order('created_at', { ascending: false }),
        supabase.from('clients').select('id, nom_commerce')
      ])
      setPaiements(p || [])
      setClients(c || [])
      setLoading(false)
    }
    fetchData()
  }, [])

  const getClientName = (id: string) => clients.find(c => c.id === id)?.nom_commerce || '—'
  const filtres = ['Tous', 'Payé', 'En attente', 'Retard']
  const paiementsFiltres = filtre === 'Tous' ? paiements : paiements.filter(p => p.statut === filtre)
  const now = new Date()
  const totalMois = paiements
    .filter(p => {
      const d = new Date(p.mois)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && p.statut === 'Payé'
    })
    .reduce((sum, p) => sum + (p.montant_mad || 0), 0)

  const statutBadge: Record<string, string> = {
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

  return (
    <div className="min-h-screen text-white" style={{ background: 'linear-gradient(135deg, #0a0a14 0%, #0f0a1e 50%, #0a1410 100%)' }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-emerald-500/8 rounded-full blur-3xl" />
      </div>

      <nav className="sticky top-0 z-50 border-b border-white/5" style={{ background: 'rgba(10,10,20,0.8)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/admin">
            <button className="p-2 rounded-xl border border-white/10 hover:border-white/20 transition-all cursor-pointer" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <ArrowLeft className="w-4 h-4 text-slate-300" />
            </button>
          </Link>
          <h1 className="font-bold text-lg">Paiements</h1>
        </div>
      </nav>

      <div className="relative max-w-5xl mx-auto px-6 py-8">
        {/* Total card */}
        <div className="rounded-2xl p-6 border border-white/10 mb-6 flex items-center gap-4" style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)' }}>
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="text-slate-400 text-sm">Total encaissé ce mois</div>
            <div className="text-3xl font-bold text-white">{totalMois.toLocaleString()} <span className="text-emerald-400 text-xl">MAD</span></div>
          </div>
        </div>

        {/* Filtres */}
        <div className="flex gap-2 mb-5">
          {filtres.map(f => (
            <button
              key={f}
              onClick={() => setFiltre(f)}
              className={`px-4 py-1.5 text-sm rounded-xl border transition-all cursor-pointer ${filtre === f ? 'border-emerald-500/50 text-emerald-300' : 'border-white/10 text-slate-400 hover:border-white/20 hover:text-white'}`}
              style={{ background: filtre === f ? 'rgba(37,211,102,0.1)' : 'rgba(255,255,255,0.04)' }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {['Commerce', 'Mois', 'Montant', 'Méthode', 'Statut'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paiementsFiltres.map(p => (
                <tr key={p.id} className="hover:bg-white/3 transition-colors">
                  <td className="px-6 py-4 font-medium text-white">{getClientName(p.client_id)}</td>
                  <td className="px-6 py-4 text-slate-400">{p.mois}</td>
                  <td className="px-6 py-4 font-semibold text-white">{p.montant_mad} MAD</td>
                  <td className="px-6 py-4 text-slate-400">{p.methode}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statutBadge[p.statut] || ''}`}>{p.statut}</span>
                  </td>
                </tr>
              ))}
              {paiementsFiltres.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-16 text-center text-slate-500">Aucun paiement</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
