import assert from 'node:assert/strict'
import test from 'node:test'
import { isAccountDeletionPending } from '../lib/account-status.mjs'

test('does not block an active profile with a null deletion marker', () => {
  assert.equal(isAccountDeletionPending({ deleted_at: null }), false)
})

test('does not block a profile without a deletion marker', () => {
  assert.equal(isAccountDeletionPending({ display_name: 'Test' }), false)
})

test('blocks a profile with a deletion timestamp', () => {
  assert.equal(isAccountDeletionPending({ deleted_at: '2026-10-19T10:00:00.000Z' }), true)
})

test('fails closed for a malformed but non-null deletion marker', () => {
  assert.equal(isAccountDeletionPending({ deleted_at: 'invalid' }), true)
  assert.equal(isAccountDeletionPending({ deleted_at: 0 }), true)
})
