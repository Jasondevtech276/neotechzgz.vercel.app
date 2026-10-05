'use client'

import { useEffect, useState } from 'react'
import { LogOut } from 'lucide-react'

type Account = { email: string; name: string | null }

export function AuthNav() {
  const [account, setAccount] = useState<Account | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/account', { cache: 'no-store' })
      .then(async response => response.ok ? setAccount(await response.json()) : setAccount(null))
      .catch(() => setAccount(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <span className="auth-nav-placeholder" aria-hidden="true" />
  if (!account) return <><a className="button button-quiet" href="/login">Acceder</a><a className="button button-primary" href="/register">Crear cuenta</a></>

  return <div className="auth-nav-user"><button className="auth-nav-logout" onClick={async () => { await fetch('/api/account', { method: 'DELETE' }); window.location.href = '/' }}><LogOut size={14} /> Cerrar sesión</button></div>
}

export function MobileAuthNav() {
  const [account, setAccount] = useState<Account | null>(null)
  useEffect(() => { fetch('/api/account', { cache: 'no-store' }).then(async response => response.ok ? setAccount(await response.json()) : setAccount(null)).catch(() => setAccount(null)) }, [])
  return account ? <button onClick={async () => { await fetch('/api/account', { method: 'DELETE' }); window.location.href = '/' }}>Cerrar sesión</button> : <><a href="/login">Acceder</a><a href="/register">Crear cuenta</a></>
}
