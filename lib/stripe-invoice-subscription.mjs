export function getInvoiceSubscriptionId(invoice) {
  if (!invoice || typeof invoice !== 'object') return null

  const parent = invoice.parent
  if (parent?.type === 'subscription_details') {
    const subscriptionId = expandableId(parent.subscription_details?.subscription)
    if (subscriptionId) return subscriptionId
  }

  // Events created with pre-Basil API versions still expose invoice.subscription.
  return expandableId(invoice.subscription)
}

function expandableId(value) {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object' && typeof value.id === 'string') return value.id
  return null
}
