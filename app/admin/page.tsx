'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Quote = { id: string; client_code: string; name: string; email: string; company: string | null; service: string; hours: number; description: string | null; budget_calculated: number; status: string; created_at: string }
type Payment = { id: string; product_id: string; status: string; amount_cents: number; invoice_id: string | null; receipt_url: string | null; created_at: string }
type Ticket = { id: string; user_id: string; subject: string; message: string; status: string; created_at: string; updated_at: string }
const statuses = ['recibida', 'en revisión', 'presupuesto enviado', 'aceptada', 'en curso', 'completada', 'cancelada']

function date(value: string) { return new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) }
function money(cents: number) { return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(cents / 100) }

export default function AdminPage() {
  const router = useRouter()
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [view, setView] = useState<'quotes' | 'payments' | 'tickets'>('quotes')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')

  async function load() {
    try {
      const [quotesResponse, overviewResponse] = await Promise.all([fetch('/api/admin/quotes', { cache: 'no-store' }), fetch('/api/admin/overview', { cache: 'no-store' })])
      if (quotesResponse.status === 401 || overviewResponse.status === 401) { router.replace('/admin/login'); return }
      const quotesData = await quotesResponse.json(); const overviewData = await overviewResponse.json()
      if (!quotesResponse.ok || !overviewResponse.ok) throw new Error(quotesData.error || overviewData.error)
      setQuotes(quotesData.quotes || []); setPayments(overviewData.payments || []); setTickets(overviewData.tickets || [])
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo cargar el panel') } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])
  async function updateQuote(id: string, status: string) { const response = await fetch('/api/admin/quotes', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id, status }) }); if (!response.ok) setError('No se pudo actualizar'); else setQuotes(rows => rows.map(row => row.id === id ? { ...row, status } : row)) }
  async function logout() { await createClient().auth.signOut(); router.replace('/admin/login') }
  const visibleQuotes = useMemo(() => quotes.filter(quote => { const value = `${quote.client_code} ${quote.name} ${quote.email} ${quote.service}`.toLowerCase(); return value.includes(query.toLowerCase()) && (statusFilter === 'todos' || quote.status === statusFilter) }), [quotes, query, statusFilter])

  return <main className="admin-shell min-h-screen px-5 py-12 text-white"><div className="mx-auto max-w-7xl"><header className="flex flex-wrap items-end justify-between gap-5"><div><p className="mono text-xs tracking-[.3em] text-cyan-300">NEOTECH / CONTROL ROOM</p><h1 className="mt-3 text-4xl font-bold">Panel administrativo</h1><p className="mt-3 text-slate-400">Presupuestos, pagos y soporte en una sola vista.</p></div><button onClick={logout} className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:border-cyan-300">Cerrar sesión</button></header>
      {error && <p className="mt-6 rounded-lg border border-amber-400/30 bg-amber-400/10 p-4 text-amber-200">{error}</p>}
      <nav aria-label="Secciones administrativas" className="mt-8 flex flex-wrap gap-2">{[['quotes', `Presupuestos (${quotes.length})`], ['payments', `Pagos (${payments.length})`], ['tickets', `Soporte (${tickets.length})`]].map(([key, label]) => <button key={key} onClick={() => setView(key as typeof view)} className={`rounded-lg px-4 py-2 text-sm ${view === key ? 'bg-cyan-400 text-slate-950' : 'border border-white/10 text-slate-300'}`}>{label}</button>)}</nav>
      {loading ? <p className="mt-10 text-slate-400">Cargando panel...</p> : view === 'quotes' ? <section aria-labelledby="quotes-title"><h2 id="quotes-title" className="sr-only">Presupuestos</h2><div className="mt-6 flex flex-wrap gap-3"><input aria-label="Buscar solicitudes" value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar por código, cliente o email" className="min-w-[280px] flex-1 rounded border border-cyan-400/20 bg-[#111827] px-3 py-2 text-sm" /><select aria-label="Filtrar por estado" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rounded border border-cyan-400/20 bg-[#111827] px-3 py-2 text-sm"><option value="todos">Todos los estados</option>{statuses.map(status => <option key={status}>{status}</option>)}</select></div><div className="mt-6 overflow-x-auto rounded-sm border"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-white/[.05] text-slate-400"><tr>{['Código', 'Cliente', 'Servicio', 'Importe', 'Fecha', 'Estado'].map(label => <th key={label} className="px-5 py-4 font-medium">{label}</th>)}</tr></thead><tbody>{visibleQuotes.map(quote => <tr key={quote.id} className="border-t border-white/10"><td className="px-5 py-4 font-mono text-cyan-300">{quote.client_code}</td><td className="px-5 py-4"><strong>{quote.name}</strong><span className="block text-xs text-slate-500">{quote.email}</span></td><td className="px-5 py-4">{quote.service}</td><td className="px-5 py-4">{money(quote.budget_calculated)}</td><td className="px-5 py-4 text-slate-400">{date(quote.created_at)}</td><td className="px-5 py-4"><select aria-label={`Estado ${quote.client_code}`} value={quote.status} onChange={e => updateQuote(quote.id, e.target.value)} className="rounded border border-white/10 bg-[#111827] px-2 py-1 text-xs">{statuses.map(status => <option key={status}>{status}</option>)}</select></td></tr>)}</tbody></table></div></section> : view === 'payments' ? <section aria-labelledby="payments-title" className="mt-6"><h2 id="payments-title" className="text-xl font-semibold">Pagos y facturas</h2><div className="mt-4 grid gap-3 md:grid-cols-2">{payments.map(payment => <article key={payment.id} className="rounded-lg border border-white/10 bg-white/[.03] p-4"><div className="flex justify-between gap-3"><strong>{payment.product_id}</strong><span className="text-cyan-300">{money(payment.amount_cents)}</span></div><p className="mt-2 text-sm text-slate-400">{payment.status} · {date(payment.created_at)}</p>{payment.invoice_id && <p className="mt-1 text-xs text-slate-500">Factura: {payment.invoice_id}</p>}{payment.receipt_url && <a className="mt-3 inline-block text-sm text-cyan-300 underline" href={payment.receipt_url} target="_blank" rel="noreferrer">Abrir recibo</a>}</article>)}</div></section> : <section aria-labelledby="tickets-title" className="mt-6"><h2 id="tickets-title" className="text-xl font-semibold">Tickets de soporte</h2><div className="mt-4 grid gap-3">{tickets.map(ticket => <article key={ticket.id} className="rounded-lg border border-white/10 bg-white/[.03] p-4"><div className="flex flex-wrap justify-between gap-2"><strong>{ticket.subject}</strong><span className="text-sm text-cyan-300">{ticket.status}</span></div><p className="mt-2 text-sm text-slate-300">{ticket.message}</p><p className="mt-2 text-xs text-slate-500">{date(ticket.created_at)} · Usuario {ticket.user_id}</p></article>)}</div></section>}</div></main>
}
