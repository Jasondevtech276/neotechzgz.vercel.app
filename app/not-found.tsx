export default function NotFound() {
  return (
    <main className="site">
      <section className="hero" aria-labelledby="not-found-title">
        <div className="hero-copy">
          <p className="eyebrow">404 / RUTA NO DISPONIBLE</p>
          <h1 id="not-found-title">Esta página no está aquí.</h1>
          <p className="lede">Puede que el enlace haya cambiado o que la dirección esté escrita de forma incorrecta.</p>
          <div className="hero-actions">
            <a className="button button-primary" href="/">Volver al inicio ↗</a>
            <a className="button button-quiet" href="/#contacto">Contactar con NeoTech</a>
          </div>
        </div>
        <aside className="hero-panel">
          <p className="panel-label">¿Qué puedes hacer?</p>
          <div className="process-row"><span>01</span><p>Volver a la página principal</p></div>
          <div className="process-row"><span>02</span><p>Explorar servicios y proyectos</p></div>
          <div className="process-row"><span>03</span><p>Contactar si el enlace debería funcionar</p></div>
        </aside>
      </section>
    </main>
  )
}
