type CallbackResponse = Response & {
  cookies: {
    set(name: string, value: string, options: {
      httpOnly: boolean
      sameSite: 'lax'
      secure: boolean
      path: string
      maxAge: number
    }): void
  }
}

type AuthError = {
  status?: number
  code?: string
}

type AuthClient = {
  auth: {
    exchangeCodeForSession(code: string): Promise<{
      data: { session: unknown | null; user: unknown | null }
      error: AuthError | null
    }>
  }
}

export function createAuthCallbackHandler(dependencies: {
  createClient: () => Promise<AuthClient>
  NextResponse: {
    redirect(url: URL): CallbackResponse
  }
  logger?: Pick<Console, 'error'>
}): (request: Request) => Promise<CallbackResponse>
