type RateLimitResult = {
  success: boolean
  reset: number
}

type CookieStore = {
  get(name: string): { value: string } | undefined
  delete(name: string): void
}

type AuthError = {
  status?: number
  code?: string
  message?: string
}

type AuthClient = {
  auth: {
    resetPasswordForEmail(email: string, options: { redirectTo: string }): Promise<{ error: AuthError | null }>
    getUser(): Promise<{ data: { user: unknown | null }; error: AuthError | null }>
    updateUser(attributes: { password: string }): Promise<{ error: AuthError | null }>
    signOut(options: { scope: 'local' }): Promise<{ error: AuthError | null }>
    signUp(credentials: { email: string; password: string; options: { emailRedirectTo: string; data: { display_name: string } } }): Promise<{ data: { session: unknown | null }; error: AuthError | null }>
    signInWithPassword(credentials: { email: string; password: string }): Promise<{ data: { session: unknown | null }; error: AuthError | null }>
  }
}

export function createAuthPostHandler(dependencies: {
  createClient: () => Promise<AuthClient>
  checkRateLimit: (key: string) => Promise<RateLimitResult>
  getCookies: () => Promise<CookieStore>
  siteUrl?: string
  logger?: Pick<Console, 'error'>
}): (request: Request) => Promise<Response>
