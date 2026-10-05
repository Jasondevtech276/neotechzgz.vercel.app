'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AccountPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/account').then(async response => {
      if (!response.ok) { router.replace('/login'); return }
      const data = await response.json()
      setEmail(data.email)
      setName(data.name)
    }).catch(() => setError('No se pudo cargar el perfil'))
  }, [router])

  async function save() {
    setMessage(''); setError('')
    const response = await fetch('/api/account', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) })
    if (!response.ok) setError('No se pudo guardar el perfil')
    else setMessage('Perfil actualizado')
  }

  async function logout() { await fetch('/api/account', { method: 'DELETE' }); router.replace('/') }

  return <main className="account-shell"><section className="account-card"><a href="/" className="account-brand"><span className="brand-mark">N</span><span>NeoTech <em>ZGZ</em></span></a><p className="eyebrow">CUENTA / ESPACIO DE TRABAJO</p><h1>Gracias por confiar en NeoTech.</h1><p className="account-lede">Tu sesión está activa. Desde aquí puedes mantener tus datos y gestionar cada solicitud con la misma claridad que define nuestro servicio.</p><div className="account-welcome"><span className="account-welcome-mark">✓</span><div><strong>Sesión iniciada correctamente</strong><small>{email}</small></div></div><label>Nombre visible<input value={name} onChange={event => setName(event.target.value)} maxLength={80} placeholder="Cómo quieres que te llamemos" /></label><label>Email<input value={email} readOnly /></label>{message && <p className="form-success" role="status">{message}</p>}{error && <p className="form-error" role="alert">{error}</p>}<div className="account-actions"><button className="button-primary" onClick={save}>Guardar cambios</button><a className="button-secondary" href="/#servicios">Solicitar presupuesto</a><a className="button-secondary" href="/#seguimiento">Ver seguimiento</a><button className="button-secondary" onClick={logout}>Cerrar sesión</button></div></section></main>
}
