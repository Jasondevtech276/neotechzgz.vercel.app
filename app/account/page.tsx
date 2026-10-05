'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

type Quote = { id: string; client_code: string; service: string; status: string; budget_calculated: number; created_at: string; description: string | null }
type AccountData = { email: string; name: string; quotes: Quote[]; notifications: { id: string; title: string; text: string; date: string }[] }

const statusLabels: Record<string, string> = { pending: 'Pendiente', in_progress: 'En curso', completed: 'Completada', cancelled: 'Cancelada' }

export default function AccountPage() {
  const router = useRouter()
  const [data, setData] = useState<AccountData | null>(null)
  const [name, setName] = useState('')
  const [tab, setTab] = useState('overview')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetch('/api/account').then(async response => {
      if (!response.ok) { router.replace('/login'); return }
      const next = await response.json() as AccountData
      setData(next); setName(next.name)
    }).catch(() => setError('No se pudo cargar tu espacio de trabajo'))
  }, [router])

  const stats = useMemo(() => {
    const quotes = data?.quotes ?? []
    return { total: quotes.length, active: quotes.filter(quote => ['pending', 'in_progress'].includes(quote.status)).length, completed: quotes.filter(quote => quote.status === 'completed').length }
  }, [data])

  async function save() {
    setMessage(''); setError('')
    const response = await fetch('/api/account', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) })
    if (!response.ok) setError('No se pudo guardar el perfil'); else { setMessage('Perfil actualizado'); setData(current => current ? { ...current, name } : current) }
  }

  async function logout() { await fetch('/api/account', { method: 'DELETE' }); router.replace('/') }
  async function deleteAccount() {
    if (!window.confirm('Tu cuenta se desactivará y quedará retenida durante 60 días por motivos de investigación. ¿Continuar?')) return
    setDeleting(true)
    const response = await fetch('/api/account', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete' }) })
    if (response.ok) router.replace('/?account=deleted'); else { setError('No se pudo solicitar la eliminación'); setDeleting(false) }
  }

  if (!data) return <main className="account-shell"><section className="account-card"><p className="eyebrow">NEOTECH / CUENTA</p><h1>Cargando tu espacio.</h1><p className="account-lede">Estamos preparando tus solicitudes y actividad.</p></section></main>
  const tabs = [['overview', 'Resumen'], ['orders', 'Pedidos'], ['activity', 'Actividad'], ['profile', 'Perfil y seguridad'], ['support', 'Soporte']]
  return <main className="account-shell"><div className="account-app">
    <header className="account-topbar"><a href="/" className="account-brand"><span className="brand-mark">N</span><span>NeoTech <em>ZGZ</em></span></a><div className="account-user"><span className="avatar">{(name || data.email)[0].toUpperCase()}</span><span>{name || data.email}</span><button onClick={logout}>Salir</button></div></header>
    <div className="account-layout"><aside className="account-sidebar"><p className="eyebrow">ESPACIO DE TRABAJO</p><h1>Hola{name ? `, ${name}` : ''}.</h1><p>Todo lo que necesitas para avanzar, en un solo lugar.</p><nav aria-label="Secciones de cuenta">{tabs.map(([id, label]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{label}</button>)}</nav><a className="button button-primary" href="/#servicios">+ Nueva solicitud</a></aside>
    <section className="account-content" aria-live="polite">{tab === 'overview' && <><div className="account-heading"><div><p className="eyebrow">PANEL / RESUMEN</p><h2>Tu actividad, clara.</h2><p>Gracias por confiar en NeoTech. Aquí tienes el estado de tu relación con nosotros.</p></div><span className="account-status"><i /> Cuenta activa</span></div><div className="metric-grid"><article><small>Solicitudes totales</small><strong>{stats.total}</strong><span>Desde tu registro</span></article><article><small>En curso</small><strong>{stats.active}</strong><span>Requieren seguimiento</span></article><article><small>Completadas</small><strong>{stats.completed}</strong><span>Trabajo entregado</span></article></div><div className="account-panels"><section className="account-panel"><div className="panel-heading"><h3>Últimas solicitudes</h3><button onClick={() => setTab('orders')}>Ver todas</button></div>{data.quotes.slice(0, 3).map(quote => <QuoteRow key={quote.id} quote={quote} />)}{!data.quotes.length && <EmptyState />}</section><section className="account-panel"><div className="panel-heading"><h3>Actividad reciente</h3></div>{data.notifications.length ? data.notifications.slice(0, 4).map(item => <div className="activity-row" key={item.id}><span className="activity-dot" /><div><strong>{item.title}</strong><p>{item.text}</p><small>{new Date(item.date).toLocaleDateString('es-ES')}</small></div></div>) : <p className="muted-copy">Cuando haya novedades sobre tus solicitudes, aparecerán aquí.</p>}</section></div></>}{tab === 'orders' && <><div className="account-heading"><div><p className="eyebrow">PEDIDOS / SEGUIMIENTO</p><h2>Tus solicitudes.</h2><p>Consulta el estado de cada encargo sin perder el contexto.</p></div></div><section className="account-panel order-list">{data.quotes.length ? data.quotes.map(quote => <QuoteRow key={quote.id} quote={quote} detailed />) : <EmptyState />}</section></>}{tab === 'activity' && <section className="account-panel"><p className="eyebrow">ACTIVIDAD / AVISOS</p><h2>Todo al día.</h2>{data.notifications.map(item => <div className="activity-row" key={item.id}><span className="activity-dot" /><div><strong>{item.title}</strong><p>{item.text}</p><small>{new Date(item.date).toLocaleDateString('es-ES')}</small></div></div>)}</section>}{tab === 'profile' && <section className="account-panel profile-panel"><p className="eyebrow">PERFIL / SEGURIDAD</p><h2>Tus datos.</h2><label>Nombre visible<input value={name} onChange={event => setName(event.target.value)} maxLength={80} /></label><label>Email<input value={data.email} readOnly /></label>{message && <p className="form-success" role="status">{message}</p>}{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-primary" onClick={save}>Guardar cambios</button><hr /><h3>Eliminar cuenta</h3><p className="muted-copy">Tu cuenta se desactivará y conservaremos un registro limitado durante 60 días para resolver investigaciones o incidencias. Después se eliminará.</p><button className="danger-button" onClick={deleteAccount} disabled={deleting}>{deleting ? 'Procesando…' : 'Solicitar eliminación'}</button></section>}{tab === 'support' && <section className="account-panel support-panel"><p className="eyebrow">SOPORTE / AYUDA</p><h2>Estamos para ayudarte.</h2><p>Si tienes dudas sobre una solicitud o necesitas ajustar el alcance de un servicio, escríbenos y te responderemos desde el equipo de NeoTech ZGZ.</p><a className="button button-primary" href="/#contacto">Abrir consulta</a><a className="button button-secondary" href="/#seguimiento">Consultar seguimiento público</a></section>}</section></div>
  </div></main>
}

function QuoteRow({ quote, detailed = false }: { quote: Quote; detailed?: boolean }) { return <article className={`quote-row ${detailed ? 'quote-row-detailed' : ''}`}><div><span className="quote-code">{quote.client_code}</span><strong>{quote.service}</strong>{detailed && quote.description && <p>{quote.description}</p>}<small>{new Date(quote.created_at).toLocaleDateString('es-ES')} · {quote.budget_calculated.toLocaleString('es-ES')} €</small></div><span className={`quote-pill ${quote.status}`}>{statusLabels[quote.status] ?? quote.status}</span></article> }
function EmptyState() { return <div className="empty-state"><strong>Aún no hay solicitudes.</strong><p>Cuando necesites avanzar, crea tu primera solicitud y la veremos contigo.</p><a href="/#servicios">Explorar servicios →</a></div> }
