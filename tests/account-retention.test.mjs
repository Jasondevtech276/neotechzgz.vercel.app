import test from 'node:test'
import assert from 'node:assert/strict'
import { isAccountPurgeEnabled } from '../lib/account-retention.mjs'

test('account purge is disabled when the setting is missing', () => {
  assert.equal(isAccountPurgeEnabled(undefined), false)
})

test('account purge is disabled for false or malformed values', () => {
  assert.equal(isAccountPurgeEnabled('false'), false)
  assert.equal(isAccountPurgeEnabled('TRUE'), false)
  assert.equal(isAccountPurgeEnabled('1'), false)
  assert.equal(isAccountPurgeEnabled(''), false)
})

test('account purge requires the explicit string true', () => {
  assert.equal(isAccountPurgeEnabled('true'), true)
})
