import assert from 'node:assert/strict'
import test from 'node:test'
import { getInvoiceSubscriptionId } from '../lib/stripe-invoice-subscription.mjs'

test('reads Basil subscription invoices from parent.subscription_details', () => {
  assert.equal(getInvoiceSubscriptionId({
    parent: { type: 'subscription_details', subscription_details: { subscription: 'sub_basil' } },
  }), 'sub_basil')
})

test('supports an expanded subscription object in Basil events', () => {
  assert.equal(getInvoiceSubscriptionId({
    parent: { type: 'subscription_details', subscription_details: { subscription: { id: 'sub_expanded' } } },
  }), 'sub_expanded')
})

test('ignores non-subscription invoice parents', () => {
  assert.equal(getInvoiceSubscriptionId({
    parent: { type: 'quote_details', subscription_details: { subscription: 'sub_wrong_parent' } },
  }), null)
})

test('keeps compatibility with pre-Basil string and expanded subscription fields', () => {
  assert.equal(getInvoiceSubscriptionId({ subscription: 'sub_legacy' }), 'sub_legacy')
  assert.equal(getInvoiceSubscriptionId({ subscription: { id: 'sub_legacy_expanded' } }), 'sub_legacy_expanded')
})

test('returns null for missing or malformed invoices', () => {
  assert.equal(getInvoiceSubscriptionId(null), null)
  assert.equal(getInvoiceSubscriptionId({ parent: { type: 'subscription_details' } }), null)
})
