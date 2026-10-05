export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#080c14] px-6 text-center text-slate-200">
      <div>
        <p className="mono text-xs uppercase tracking-[.3em] text-cyan-300">404 / NOT FOUND</p>
        <h1 className="mt-4 text-4xl font-bold text-white">Página no encontrada</h1>
        <a href="/" className="mt-6 inline-block text-cyan-300 hover:underline">Volver al inicio</a>
      </div>
    </main>
  )
}
