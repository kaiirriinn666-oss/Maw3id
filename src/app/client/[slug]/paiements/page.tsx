'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, CreditCard } from 'lucide-react'
import Link from 'next/link'

export default function ClientPaiementsPage() {
  const { slug } = useParams()
  const [paiements, setPaiements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const { data: c } = await supabase.from('clients').select('id, plan').eq('slug', slug).single()
      if (!c) { setLoading(false); return }
      const { data: p } = await supabase
        .from('paiements').select('*').eq('client_id', c.id)
        .order('mois', { ascending: false })
      setPaiements(p || [])
      setLoading(false)
    }
    fetchData()
  }, [slug])

  const totalPaye = paiements
    .filter(p => p.statut === 'Payé')
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
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-violet-500/8 rounded-full blur-3xl" />
      </div>

      <nav className="sticky top-0 z-50 border-b border-white/5" style={{ background: 'rgba(10,10,20,0.85)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href={`/client/${slug}`}>
            <button className="p-2 rounded-xl border border-white/10 hover:border-white/20 transition-all cursor-pointer" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <ArrowLeft className="w-4 h-4 text-slate-300" />
            </button>
          </Link>
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-amber-400" />
            <h1 className="font-bold text-lg">Paiements</h1>
          </div>
        </div>
      </nav>

      <div className="relative max-w-4xl mx-auto px-6 py-8 grid gap-5">
        {/* Total card */}
        <div className="rounded-2xl p-6 border border-white/10 flex items-center gap-4" style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)' }}>
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-slate-400 text-sm">Total payé</div>
            <div className="text-3xl font-bold text-white">
              {totalPaye.toLocaleString()} <span className="text-emerald-400 text-xl">MAD</span>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)' }}>
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
                  <td className="px-6 py-4 text-slate-400">{p.mois}</td>
                  <td className="px-6 py-4 font-semibold text-white">{p.montant_mad} MAD</td>
                  <td className="px-6 py-4 text-slate-400">{p.methode || '—'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statutBadge[p.statut] || ''}`}>
                      {p.statut}
                    </span>
                  </td>
                </tr>
              ))}
              {paiements.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center text-slate-500">
                    <CreditCard className="w-9 h-9 mx-auto mb-3 text-slate-700" />
                    Aucun paiement enregistré
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
