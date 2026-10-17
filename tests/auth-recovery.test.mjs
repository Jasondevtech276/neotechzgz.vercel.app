import assert from 'node:assert/strict'
import test from 'node:test'
import { getAuthCallbackDestination } from '../lib/auth-recovery.mjs'

test('accepts a successfully exchanged password recovery link', () => {
  const url = new URL('https://example.test/auth/callback?code=valid&next=%2Freset-password')
  assert.equal(getAuthCallbackDestination(url, true), '/reset-password')
})

test('sends expired and failed recovery links to a generic safe error', () => {
  const expired = new URL('https://example.test/auth/callback?error_code=otp_expired&next=%2Freset-password')
  const failedExchange = new URL('https://example.test/auth/callback?code=invalid&next=%2Freset-password')

  assert.equal(getAuthCallbackDestination(expired, false), '/reset-password?error=invalid-link')
  assert.equal(getAuthCallbackDestination(failedExchange, false), '/reset-password?error=invalid-link')
})

test('does not expose provider errors in redirects', () => {
  const url = new URL('https://example.test/auth/callback?error=access_denied&error_description=private')
  assert.equal(getAuthCallbackDestination(url, false), '/login?error=auth-link')
})

test('handles provider errors that omit an error code', () => {
  const url = new URL('https://example.test/auth/callback?error_description=private')
  assert.equal(getAuthCallbackDestination(url, false), '/login?error=auth-link')
})

test('does not allow callback destinations outside the known routes', () => {
  const url = new URL('https://example.test/auth/callback?code=valid&next=%2F%2Fevil.test')
  assert.equal(getAuthCallbackDestination(url, true), '/')
})

test('retains the registration callback destination after code exchange', () => {
  const url = new URL('https://example.test/auth/callback?code=valid')
  assert.equal(getAuthCallbackDestination(url, true), '/')
})
