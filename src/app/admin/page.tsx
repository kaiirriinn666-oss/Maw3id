'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Users, TrendingUp, MessageSquare, Clock, Plus, ExternalLink, Bot, LogOut } from 'lucide-react'
import Link from 'next/link'

type Client = {
  id: string
  nom_commerce: string
  proprietaire: string
  telephone: string
  email: string
  ville: string
  plan: string
  statut: string
  date_debut: string
  slug: string
  numero_whatsapp: string
}

const planBadge: Record<string, string> = {
  'Starter': 'bg-slate-500/20 text-slate-300 border border-slate-500/30',
  'Pro': 'bg-violet-500/20 text-violet-300 border border-violet-500/30',
  'Business': 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
}

const statutBadge: Record<string, string> = {
  'Actif': 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  'Inactif': 'bg-red-500/20 text-red-300 border border-red-500/30',
  'Essai': 'bg-sky-500/20 text-sky-300 border border-sky-500/30',
}

export default function AdminDashboard() {
  const [clients, setClients] = useState<Client[]>([])
  const [paiements, setPaiements] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    nom_commerce: '', proprietaire: '', telephone: '',
    email: '', ville: '', plan: 'Starter', statut: 'Essai',
    numero_whatsapp: '', slug: ''
  })

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const [{ data: c }, { data: p }, { data: m }] = await Promise.all([
      supabase.from('clients').select('*').order('created_at', { ascending: false }),
      supabase.from('paiements').select('*'),
      supabase.from('messages').select('*')
    ])
    setClients(c || [])
    setPaiements(p || [])
    setMessages(m || [])
    setLoading(false)
  }

  const now = new Date()
  const clientsActifs = clients.filter(c => c.statut === 'Actif').length
  const clientsEssai = clients.filter(c => c.statut === 'Essai').length
  const revenuesMois = paiements
    .filter(p => {
      const d = new Date(p.mois)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && p.statut === 'Payé'
    })
    .reduce((sum, p) => sum + (p.montant_mad || 0), 0)
  const messagesMois = messages
    .filter(m => {
      const d = new Date(m.mois)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    .reduce((sum, m) => sum + (m.nombre_messages || 0), 0)

  async function handleAddClient() {
    if (!form.nom_commerce) return
    setSaving(true)
    const { error } = await supabase.from('clients').insert([{
      ...form,
      date_debut: new Date().toISOString().split('T')[0]
    }])
    setSaving(false)
    if (!error) {
      setOpen(false)
      setForm({ nom_commerce: '', proprietaire: '', telephone: '', email: '', ville: '', plan: 'Starter', statut: 'Essai', numero_whatsapp: '', slug: '' })
      fetchData()
    }
  }

  const kpis = [
    { title: 'Clients Actifs', value: clientsActifs, icon: Users },
    { title: 'Revenus du mois', value: `${revenuesMois.toLocaleString()} MAD`, icon: TrendingUp },
    { title: 'Clients en Essai', value: clientsEssai, icon: Clock },
    { title: 'Messages ce mois', value: messagesMois.toLocaleString(), icon: MessageSquare },
  ]

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
      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-40 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-72 h-72 bg-sky-500/8 rounded-full blur-3xl" />
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-white/5" style={{ background: 'rgba(10,10,20,0.8)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">BotMaroc <span className="text-emerald-400">Admin</span></span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin/paiements">
              <button className="px-4 py-2 text-sm text-slate-300 hover:text-white border border-white/10 rounded-xl hover:border-white/20 transition-all cursor-pointer" style={{ background: 'rgba(255,255,255,0.05)' }}>
                Paiements
              </button>
            </Link>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <button className="px-4 py-2 text-sm font-medium text-white rounded-xl flex items-center gap-2 transition-all cursor-pointer hover:opacity-90" style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}>
                  <Plus className="w-4 h-4" /> Ajouter un client
                </button>
              </DialogTrigger>
              <DialogContent className="border-white/10 text-white max-w-md" style={{ background: 'rgba(15,15,30,0.95)', backdropFilter: 'blur(20px)' }}>
                <DialogHeader>
                  <DialogTitle className="text-white text-lg">Nouveau client</DialogTitle>
                </DialogHeader>
                <div className="grid gap-3 mt-2">
                  {[
                    { label: 'Nom du commerce *', key: 'nom_commerce', placeholder: 'Salon Chez Marie' },
                    { label: 'Propriétaire', key: 'proprietaire', placeholder: 'Marie Dupont' },
                    { label: 'Téléphone', key: 'telephone', placeholder: '+212 6XX XXX XXX' },
                    { label: 'Email', key: 'email', placeholder: 'contact@salon.ma' },
                    { label: 'Ville', key: 'ville', placeholder: 'Casablanca' },
                    { label: 'Numéro WhatsApp bot', key: 'numero_whatsapp', placeholder: '+1 415 XXX XXXX' },
                    { label: 'Slug URL', key: 'slug', placeholder: 'salon-chez-marie' },
                  ].map(({ label, key, placeholder }) => (
                    <div key={key}>
                      <Label className="text-slate-400 text-xs mb-1 block">{label}</Label>
                      <Input
                        placeholder={placeholder}
                        value={(form as any)[key]}
                        onChange={e => setForm({ ...form, [key]: e.target.value })}
                        className="border-white/10 text-white placeholder:text-slate-600 focus:border-emerald-500/50"
                        style={{ background: 'rgba(255,255,255,0.05)' }}
                      />
                    </div>
                  ))}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-slate-400 text-xs mb-1 block">Plan</Label>
                      <Select value={form.plan} onValueChange={v => setForm({ ...form, plan: v })}>
                        <SelectTrigger className="border-white/10 text-white" style={{ background: 'rgba(255,255,255,0.05)' }}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-white/10" style={{ background: 'rgba(15,15,30,0.98)' }}>
                          <SelectItem value="Starter" className="text-white">Starter — 199 MAD</SelectItem>
                          <SelectItem value="Pro" className="text-white">Pro — 399 MAD</SelectItem>
                          <SelectItem value="Business" className="text-white">Business — 699 MAD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-slate-400 text-xs mb-1 block">Statut</Label>
                      <Select value={form.statut} onValueChange={v => setForm({ ...form, statut: v })}>
                        <SelectTrigger className="border-white/10 text-white" style={{ background: 'rgba(255,255,255,0.05)' }}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-white/10" style={{ background: 'rgba(15,15,30,0.98)' }}>
                          <SelectItem value="Essai" className="text-white">Essai</SelectItem>
                          <SelectItem value="Actif" className="text-white">Actif</SelectItem>
                          <SelectItem value="Inactif" className="text-white">Inactif</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <button
                    onClick={handleAddClient}
                    disabled={saving || !form.nom_commerce}
                    className="w-full py-2.5 text-sm font-medium text-white rounded-xl mt-1 transition-all hover:opacity-90 disabled:opacity-50 cursor-pointer"
                    style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}
                  >
                    {saving ? 'Enregistrement...' : 'Enregistrer le client'}
                  </button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </nav>

      <div className="relative max-w-7xl mx-auto px-6 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {kpis.map(({ title, value, icon: Icon }) => (
            <div
              key={title}
              className="rounded-2xl p-5 border border-white/10 transition-all duration-300 hover:border-white/20 hover:-translate-y-1 hover:shadow-2xl cursor-default"
              style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">{title}</span>
                <Icon className="w-4 h-4 text-slate-500" />
              </div>
              <div className="text-2xl font-bold tracking-tight">{value}</div>
            </div>
          ))}
        </div>

        {/* Clients Table */}
        <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)' }}>
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <h2 className="font-semibold text-white">Clients <span className="text-slate-500 text-sm font-normal ml-1">({clients.length})</span></h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {['Nom Commerce', 'Plan', 'Statut', 'Ville', 'Date début', ''].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {clients.map(client => (
                  <tr key={client.id} className="hover:bg-white/5 transition-all duration-200 group">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white group-hover:text-emerald-300 transition-colors duration-200">{client.nom_commerce}</div>
                      {client.proprietaire && <div className="text-xs text-slate-500 mt-0.5">{client.proprietaire}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${planBadge[client.plan] || ''}`}>{client.plan}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statutBadge[client.statut] || ''}`}>{client.statut}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-400">{client.ville || '—'}</td>
                    <td className="px-6 py-4 text-slate-400">{client.date_debut || '—'}</td>
                    <td className="px-6 py-4">
                      <Link href={`/admin/clients/${client.id}`}>
                        <button className="px-3 py-1.5 text-xs text-slate-400 hover:text-white border border-white/10 rounded-lg hover:border-emerald-500/40 hover:bg-emerald-500/10 transition-all duration-200 cursor-pointer flex items-center gap-1.5 opacity-0 group-hover:opacity-100">
                          Voir <ExternalLink className="w-3 h-3" />
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))}
                {clients.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                      <Bot className="w-10 h-10 mx-auto mb-3 text-slate-700" />
                      Aucun client pour l'instant.<br />
                      <span className="text-xs">Ajoutez votre premier client avec le bouton en haut.</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
