# Fiscal and tax configuration design — NeoTech ZGZ
**Research date:** 2026-10-25  
**Status:** implementation blueprint; not tax advice or a registration filing.

## Known catalogue
- Remote IT support (hourly)
- On-site IT support (hourly)
- Web development
- IT consulting
- Systems analysis
- Monthly support subscriptions (Starter, Professional, Enterprise)

These are currently human-delivered professional/technical services. Remote delivery alone does not automatically make a service an electronically supplied service for VAT purposes. Each SKU must be classified before tax settings are enabled.

## Spain: initial model
- For ordinary IT support, consultancy, systems analysis and web development supplied in the Spanish VAT territory (Peninsula/Balearic Islands), the general VAT rate is 21% where the service is taxable at the general rate. Confirm exceptions and the service classification before production.
- Canary Islands, Ceuta and Melilla are outside the Spanish VAT territory and can involve IGIC/IPSI or import/customs rules. Do not label them as ordinary Spanish VAT.
- The seller generally accounts for VAT on domestic B2C services when the place-of-supply rules locate the service in Spain.
- Income tax (IRPF for an individual or corporate income tax for a company), social-security contributions and any applicable IAE obligations are seller-level obligations, not a universal additional percentage to add to each checkout line. Spanish professional invoices to eligible Spanish business customers may require IRPF withholding; this depends on the activity, recipient and circumstances and must be handled on the invoice, not as Stripe sales tax.
- Fiscal census registration and the seller's tax status are not configured by Stripe. Keep new sales disabled until the seller confirms the applicable registration and invoicing regime.

## EU cross-border
- General B2B services are commonly located where the business customer is established/receives the service; qualifying intra-community B2B supplies may use reverse charge, require a valid VAT ID and may require Modelo 349 reporting. Validate the VAT ID (for example through VIES), store the validation result/time, and never infer B2B status from an email domain alone.
- B2C services commonly follow the supplier-establishment rule, but exceptions exist. Qualifying electronically supplied services and certain distance sales can be taxed where the consumer is located; the EUR 10,000 EU threshold and Union OSS rules can apply in their specific scope. Human-delivered support/consultancy must not be automatically classified as an electronic service.
- OSS is an optional reporting regime where eligible, not a tax rate and not automatic registration.

## International
- There is no single international VAT/sales-tax percentage and no one treaty that makes every sale tax-free. Each target market can have VAT/GST/sales-tax, digital-service rules, registration thresholds, invoice requirements, withholding, sanctions/export controls and consumer-law obligations.
- Stripe Tax can calculate supported taxes only within its supported scope and configured registrations/product tax codes. It does not register NeoTech ZGZ with tax authorities, file returns, or determine legal obligations for the seller.
- Start with Spain and only explicitly approved EU/third-country markets. Add registrations after actual registration with the authority and professional review. Use a deny-by-default market list until tax treatment is configured.

## Stripe product configuration
1. Map each SKU to an accurate Stripe tax code; do not apply one code to all items without classification.
2. Decide inclusive vs exclusive pricing by market and consumer/B2B presentation. For Spanish consumer-facing prices, display the applicable total price before the order is placed. If tax-inclusive pricing is chosen, verify Stripe price `tax_behavior` and the resulting tax breakdown in test mode.
3. Require billing address and let Stripe Tax calculate the transaction-specific tax only after the applicable registration exists.
4. Enable Adaptive Pricing only after the Stripe account is eligible and tests prove the local-currency amount, tax presentation, refunds and recurring renewals. Local-currency presentation is not guaranteed merely by enabling Automatic Tax.
5. Store Stripe invoice IDs and each invoice separately; never treat a single `payments.invoice_id` field as the full invoice history.
6. Export and reconcile Stripe Tax transactions/invoices with accounting records; the seller remains responsible for declarations and payment.

## Release blockers observed on 2026-10-25
- The connected Stripe live account returns **zero tax registrations**.
- The connected live account returns **zero active prices** and zero inactive prices for the queried account; source-code price IDs could not be verified against this live context. Do not assume Checkout can complete against the currently connected account.
- Stripe test mode is not present in the connector context.
- Exact fiscal registration, product tax codes, tax behavior and invoice settings are not confirmed.
- Therefore the tax and Adaptive Pricing release flags must remain false.

## Official reference starting points
- AEAT, VAT on telecoms/electronic services and place of taxation: https://sede.agenciatributaria.gob.es/Sede/iva/iva-comercio-electronico/iva-telecomunicaciones-servicios-electronicos.html
- AEAT, general rules for services: https://sede.agenciatributaria.gob.es/Sede/iva/iva-operaciones-comercio-exterior/prestaciones-servicios.html
- AEAT, Union OSS: https://sede.agenciatributaria.gob.es/Sede/iva/iva-comercio-electronico/cuestiones-generales.html
- AEAT, VAT rates: https://sede.agenciatributaria.gob.es/Sede/iva/calculo-iva-repercutido-clientes/tipos-impositivos-iva.html
- Stripe Tax registrations: https://docs.stripe.com/tax/registrations
- Stripe Adaptive Pricing: https://docs.stripe.com/payments/checkout/localize-prices

## Release checklist
- [ ] Confirm legal form, tax registration, activity classification and invoice numbering requirements.
- [ ] Review each SKU's tax code and inclusive/exclusive price behavior.
- [ ] Register only in jurisdictions where legally required and actually registered.
- [ ] Verify Spanish B2C, Spanish B2B, valid intra-EU B2B VAT ID, intra-EU B2C, Canary Islands/Ceuta/Melilla, and selected non-EU cases in test mode.
- [ ] Verify local currency, tax, invoice and refund behavior.
- [ ] Reconcile Stripe Tax/invoices with the ledger and accounting process.
- [ ] Obtain qualified tax review before enabling live Checkout.
