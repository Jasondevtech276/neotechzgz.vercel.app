export const PASSWORD_RECOVERY_COOKIE = 'neotech-password-recovery'

export function getAuthCallbackDestination(url, succeeded) {
  const isPasswordRecovery = url.searchParams.get('next') === '/reset-password'
  const hasProviderError = url.searchParams.has('error')
    || url.searchParams.has('error_code')
    || url.searchParams.has('error_description')
  const hasCode = Boolean(url.searchParams.get('code'))

  if (isPasswordRecovery) {
    return hasCode && succeeded && !hasProviderError
      ? '/reset-password'
      : '/reset-password?error=invalid-link'
  }

  if (hasProviderError || (hasCode && !succeeded)) {
    return '/login?error=auth-link'
  }

  return '/'
}
