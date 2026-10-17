import { cookies } from 'next/headers'
import { PasswordRecoveryForm } from '@/components/auth/password-recovery-form'
import { PASSWORD_RECOVERY_COOKIE } from '@/lib/auth-recovery.mjs'
import { createClient } from '@/lib/supabase/server'

type ResetPasswordPageProps = {
  searchParams: Promise<{ error?: string | string[] }>
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const query = await searchParams
  const hasInvalidLink = query.error === 'invalid-link'
  const cookieStore = await cookies()
  const hasRecoveryMarker = cookieStore.get(PASSWORD_RECOVERY_COOKIE)?.value === '1'
  let canResetPassword = false
  let verificationUnavailable = false

  if (hasRecoveryMarker && !hasInvalidLink) {
    try {
      const supabase = await createClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      canResetPassword = Boolean(user && !error)
      verificationUnavailable = Boolean(error)
      if (error) {
        console.error('[auth] Recovery session verification failed', { status: error.status, code: error.code })
      }
    } catch (error) {
      console.error('[auth] Recovery session verification failed', error instanceof Error ? error.name : 'Unknown error')
      verificationUnavailable = true
    }
  }

  return (
    <main className="admin-shell min-h-screen px-5 py-20 text-white">
      <div className="admin-card mx-auto max-w-md rounded-sm p-8">
        <p className="mono text-xs tracking-[.3em] text-cyan-300">NEOTECH / ACCESS</p>
        {canResetPassword ? (
          <>
            <h1 className="mt-3 text-3xl font-bold">Crear nueva contraseña</h1>
            <p className="mt-3 text-sm text-slate-400">
              Elige una contraseña nueva para tu cuenta.
            </p>
            <PasswordRecoveryForm />
          </>
        ) : (
          <>
            <h1 className="mt-3 text-3xl font-bold">
              {hasInvalidLink
                ? 'Enlace no válido'
                : verificationUnavailable
                  ? 'No se pudo verificar la sesión'
                  : 'Enlace caducado o no disponible'}
            </h1>
            <p role="alert" className="mt-3 text-sm text-slate-400">
              {verificationUnavailable
                ? 'No se pudo validar el enlace en este momento. Inténtalo de nuevo o solicita otro.'
                : 'El enlace no se puede utilizar. Solicita uno nuevo para continuar.'}
            </p>
            <a className="cta mt-8 block rounded-lg py-3 text-center font-semibold" href="/forgot-password">
              Solicitar otro enlace
            </a>
          </>
        )}
      </div>
    </main>
  )
}
