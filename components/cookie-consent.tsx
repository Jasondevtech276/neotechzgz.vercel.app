'use client'

import { useEffect, useState } from 'react'

const COOKIE_NAME = 'neotech_cookie_consent'
const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 180

function clearKnownAnalyticsCookies() {
  const names = ['_ga', '_gid', '_gat', '_gcl_au', '_fbp', '_fbc']
  for (const name of names) {
    document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax; Secure`
  }
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false)
  const [hasChoice, setHasChoice] = useState(false)

  useEffect(() => {
    const sync = () => {
      const chosen = document.cookie.includes(`${COOKIE_NAME}=`)
      setHasChoice(chosen)
      setVisible(!chosen)
    }
    sync()
    window.addEventListener('neotech-open-cookie-settings', () => setVisible(true))
    window.addEventListener('neotech-cookie-consent', sync)
    return () => {
      window.removeEventListener('neotech-cookie-consent', sync)
      window.removeEventListener('neotech-open-cookie-settings', () => setVisible(true))
    }
  }, [])

  function choose(value: 'all' | 'essential') {
    document.cookie = `${COOKIE_NAME}=${value}; Max-Age=${CONSENT_MAX_AGE_SECONDS}; Path=/; SameSite=Lax; Secure`
    if (value === 'essential') clearKnownAnalyticsCookies()
    window.dispatchEvent(new Event('neotech-cookie-consent'))
    setHasChoice(true)
    setVisible(false)
    if (value === 'essential') window.location.reload()
  }

  return (
    <>
      {visible ? (
        <aside className="cookie-banner" role="dialog" aria-modal="false" aria-label="Preferencias de cookies">
          <div>
            <p className="eyebrow">COOKIES Y PRIVACIDAD</p>
            <strong>Elige qué tecnologías permites.</strong>
            <p>Las cookies necesarias mantienen el sitio y recuerdan tu elección. Google Analytics y Meta Pixel solo se cargarán si aceptas analítica y marketing.</p>
            <a href="/legal#cookies">Leer política de cookies</a>
          </div>
          <div className="cookie-actions">
            <button className="button button-quiet" onClick={() => choose('essential')}>Rechazar opcionales</button>
            <button className="button button-primary" onClick={() => choose('all')}>Aceptar analítica y marketing</button>
          </div>
        </aside>
      ) : hasChoice ? (
        <button
          className="cookie-settings-trigger"
          type="button"
          onClick={() => setVisible(true)}
          aria-label="Abrir preferencias de cookies"
        >Preferencias de cookies</button>
      ) : null}
    </>
  )
}
