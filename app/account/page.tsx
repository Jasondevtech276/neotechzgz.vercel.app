'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AccountPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    createClient().auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace('/login'); return }
      setEmail(user.email ?? '')
      const { data } = await createClient().from('profiles').select('display_name').eq('id', user.id).maybeSingle()
      setName(data?.display_name ?? '')
    })
  }, [router])

  async function save() {
    setMessage(''); setError('')
    const { data: { user } } = await createClient().auth.getUser()
    if (!user) { router.replace('/login'); return }
    const { error: updateError } = await createClient().from('profiles').update({ display_name: name.trim().slice(0, 80) }).eq('id', user.id)
    if (updateError) setError('No se pudo guardar el perfil')
    else setMessage('Perfil actualizado')
  }

  async function logout() { await createClient().auth.signOut(); router.replace('/') }

  return <main className="account-shell"><section className="account-card"><p className="eyebrow">CUENTA / PERFIL</p><h1>Tu espacio de trabajo</h1><p className="account-lede">Gestiona tus datos y consulta tus solicitudes privadas.</p><label>Nombre visible<input value={name} onChange={event => setName(event.target.value)} maxLength={80} /></label><label>Email<input value={email} readOnly /></label>{message && <p className="form-success" role="status">{message}</p>}{error && <p className="form-error" role="alert">{error}</p>}<div className="account-actions"><button className="button-primary" onClick={save}>Guardar cambios</button><a className="button-secondary" href="/#seguimiento">Ver seguimiento</a><button className="button-secondary" onClick={logout}>Cerrar sesión</button></div></section></main>
}
