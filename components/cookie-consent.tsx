'use client'

import { useEffect, useState } from 'react'

const COOKIE_NAME = 'neotech_cookie_consent'
const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 180

function clearCookies(names: string[]) {
  for (const name of names) {
    document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax; Secure`
  }
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false)
  const [hasChoice, setHasChoice] = useState(false)
  const [configuring, setConfiguring] = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const [marketing, setMarketing] = useState(false)

  useEffect(() => {
    const sync = () => {
      const chosen = document.cookie.split('; ').some((part) => part.startsWith(`${COOKIE_NAME}=`))
      setHasChoice(chosen)
      setVisible(!chosen)
    }
    const openSettings = () => {
      const current = document.cookie.split('; ').find((part) => part.startsWith(`${COOKIE_NAME}=`))?.split('=')[1]
      setAnalytics(current === 'all' || current === 'analytics')
      setMarketing(current === 'all' || current === 'marketing')
      setConfiguring(true)
      setVisible(true)
    }
    sync()
    window.addEventListener('neotech-open-cookie-settings', openSettings)
    window.addEventListener('neotech-cookie-consent', sync)
    return () => {
      window.removeEventListener('neotech-cookie-consent', sync)
      window.removeEventListener('neotech-open-cookie-settings', openSettings)
    }
  }, [])

  function choose(value: 'all' | 'essential' | 'analytics' | 'marketing') {
    document.cookie = `${COOKIE_NAME}=${value}; Max-Age=${CONSENT_MAX_AGE_SECONDS}; Path=/; SameSite=Lax; Secure`
    if (value !== 'all' && value !== 'analytics') clearCookies(['_ga', '_gid', '_gat', '_gcl_au'])
    if (value !== 'all' && value !== 'marketing') clearCookies(['_fbp', '_fbc'])
    window.dispatchEvent(new Event('neotech-cookie-consent'))
    setHasChoice(true)
    setVisible(false)
    setConfiguring(false)
    // Reload ensures scripts associated with a withdrawn category stop running on the next page lifecycle.
    if (value !== 'all') window.location.reload()
  }

  function saveCustom() {
    if (analytics && marketing) choose('all')
    else if (analytics) choose('analytics')
    else if (marketing) choose('marketing')
    else choose('essential')
  }

  return (
    <>
      {visible ? (
        <aside className="cookie-banner" role="dialog" aria-modal="false" aria-label="Preferencias de cookies">
          <div>
            <p className="eyebrow">COOKIES Y PRIVACIDAD</p>
            <strong>Elige qué tecnologías permites.</strong>
            <p>Las cookies necesarias están siempre activas. La analítica y la publicidad opcionales permanecen desactivadas hasta que las autorices.</p>
            <a href="/legal#cookies">Leer política de cookies</a>
            {configuring && (
              <div className="cookie-category-settings">
                <label><input type="checkbox" checked={analytics} onChange={(event) => setAnalytics(event.target.checked)} /> Analítica (Google Analytics)</label>
                <label><input type="checkbox" checked={marketing} onChange={(event) => setMarketing(event.target.checked)} /> Marketing (Meta Pixel)</label>
                <p>Tu elección se recuerda durante seis meses. Puedes cambiarla desde Preferencias de cookies.</p>
              </div>
            )}
          </div>
          <div className="cookie-actions">
            <button className="button button-primary" onClick={() => choose('essential')}>Rechazar opcionales</button>
            {configuring ? (
              <button className="button button-quiet" onClick={saveCustom}>Guardar selección</button>
            ) : (
              <button className="button button-quiet" onClick={() => {
                const current = document.cookie.split('; ').find((part) => part.startsWith(`${COOKIE_NAME}=`))?.split('=')[1]
                setAnalytics(current === 'all' || current === 'analytics')
                setMarketing(current === 'all' || current === 'marketing')
                setConfiguring(true)
              }}>Configurar</button>
            )}
            <button className="button button-primary" onClick={() => choose('all')}>Aceptar todas</button>
          </div>
        </aside>
      ) : hasChoice ? (
        <button
          className="cookie-settings-trigger"
          type="button"
          onClick={() => {
            const current = document.cookie.split('; ').find((part) => part.startsWith(`${COOKIE_NAME}=`))?.split('=')[1]
            setAnalytics(current === 'all' || current === 'analytics')
            setMarketing(current === 'all' || current === 'marketing')
            setConfiguring(true)
            setVisible(true)
          }}
          aria-label="Abrir preferencias de cookies"
        >Preferencias de cookies</button>
      ) : null}
    </>
  )
}
