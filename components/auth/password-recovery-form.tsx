'use client'

import { FormEvent, useState } from 'react'
import { PasswordField } from '@/components/auth/password-field'

export function PasswordRecoveryForm() {
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [complete, setComplete] = useState(false)
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')

    if (password !== confirmation) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update-password', password }),
      })
      const result = await response.json()

      if (!response.ok) {
        setError(response.status === 401
          ? 'El enlace ha caducado o ya se ha utilizado. Solicita uno nuevo.'
          : result.error || 'No se pudo actualizar la contraseña. Inténtalo de nuevo.')
      } else {
        setComplete(true)
      }
    } catch {
      setError('No se pudo conectar con el servicio de autenticación.')
    } finally {
      setLoading(false)
    }
  }

  if (complete) {
    return (
      <div className="mt-8">
        <p role="status" className="text-sm text-emerald-300">
          Tu contraseña se ha actualizado.
        </p>
        <a className="cta mt-6 block rounded-lg py-3 text-center font-semibold" href="/login">
          Iniciar sesión
        </a>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="mt-8 flex flex-col gap-4">
      <PasswordField
        label="Nueva contraseña"
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
        minLength={6}
      />
      <PasswordField
        label="Confirmar contraseña"
        value={confirmation}
        onChange={setConfirmation}
        autoComplete="new-password"
        minLength={6}
      />
      {error && <p role="alert" className="text-sm text-amber-300">{error}</p>}
      <button disabled={loading} className="cta rounded-lg py-3 font-semibold">
        {loading ? 'Actualizando...' : 'Guardar contraseña'}
      </button>
    </form>
  )
}
