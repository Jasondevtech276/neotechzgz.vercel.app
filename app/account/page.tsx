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

  return <main className="account-shell"><section className="account-card"><p className="eyebrow">CUENTA / PERFIL</p><h1>Tu espacio de trabajo</h1><p className="account-lede">Gestiona tus datos y consulta tus solicitudes privadas.</p><label>Nombre visible<input value={name} onChange={event => setName(event.target.value)} maxLength={80} /></label><label>Email<input value={email} readOnly /></label>{message && <p className="form-success" role="status">{message}</p>}{error && <p className="form-error" role="alert">{error}</p>}<div className="account-actions"><button className="button-primary" onClick={save}>Guardar cambios</button><a className="button-secondary" href="/#seguimiento">Ver seguimiento</a><button className="button-secondary" onClick={logout}>Cerrar sesión</button></div></section></main>
}
