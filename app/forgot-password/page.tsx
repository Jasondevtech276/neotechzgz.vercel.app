'use client'

import { FormEvent, useState } from 'react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request-reset', email }),
      })

      const result = await response.json()
      if (!response.ok) {
        setError(result.error || 'No se pudo procesar la solicitud. Inténtalo de nuevo más tarde.')
      } else {
        setMessage(result.message)
      }
    } catch {
      setError('No se pudo conectar con el servicio de autenticación.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="admin-shell min-h-screen px-5 py-20 text-white">
      <div className="admin-card mx-auto max-w-md rounded-sm p-8">
        <p className="mono text-xs tracking-[.3em] text-cyan-300">NEOTECH / ACCESS</p>
        <h1 className="mt-3 text-3xl font-bold">Recuperar contraseña</h1>
        <p className="mt-3 text-sm text-slate-400">
          Introduce tu email y te indicaremos cómo continuar si puede recibir mensajes de recuperación.
        </p>
        <form onSubmit={submit} className="mt-8 flex flex-col gap-4">
          <label className="text-sm text-slate-300">
            Email
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="field mt-2 w-full"
              autoComplete="email"
            />
          </label>
          {error && <p role="alert" className="text-sm text-amber-300">{error}</p>}
          {message && <p role="status" className="text-sm text-emerald-300">{message}</p>}
          <button disabled={loading} className="cta rounded-lg py-3 font-semibold">
            {loading ? 'Enviando...' : 'Enviar instrucciones'}
          </button>
        </form>
        <p className="mt-6 text-sm text-slate-400">
          <a className="text-cyan-300 hover:underline" href="/login">Volver al inicio de sesión</a>
        </p>
      </div>
    </main>
  )
}
