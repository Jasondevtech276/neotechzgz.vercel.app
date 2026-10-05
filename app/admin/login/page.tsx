'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  async function submit(event: FormEvent) {
    event.preventDefault(); setLoading(true); setError('')
    const { error } = await createClient().auth.signInWithPassword({ email, password })
    if (error) setError('Email o contraseña no válidos')
    else router.replace('/admin')
    setLoading(false)
  }
  return <main className="admin-shell min-h-screen px-5 py-20 text-white"><div className="admin-card mx-auto max-w-md rounded-sm p-8"><p className="mono text-xs tracking-[.3em] text-cyan-300">NEOTECH / ADMIN</p><h1 className="mt-3 text-3xl font-bold">Acceso administrativo</h1><p className="mt-3 text-sm text-slate-400">Gestiona solicitudes de presupuesto de forma segura.</p><form onSubmit={submit} className="mt-8 flex flex-col gap-4"><label className="text-sm text-slate-300">Email<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} className="field mt-2 w-full" autoComplete="email" /></label><label className="text-sm text-slate-300">Contraseña<input required type="password" value={password} onChange={e=>setPassword(e.target.value)} className="field mt-2 w-full" autoComplete="current-password" /></label>{error&&<p role="alert" className="text-sm text-amber-300">{error}</p>}<button disabled={loading} className="cta rounded-lg py-3 font-semibold">{loading?'Comprobando...':'Entrar'}</button></form></div></main>
}
