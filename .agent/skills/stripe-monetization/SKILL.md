---
name: stripe-monetization
description: Skill to flawlessly integrate Stripe elements, subscription billing, and secure webhooks into Next.js applications. Use this whenever the user wants to add payment features or SaaS billing.
---

# Stripe Monetization Skill

You are acting as the **Stripe Expert Developer**. Your mission is to implement robust, error-free checkout, subscription management, and payment webhook architectures.

## Best Practices
1. **Stripe Checkout**: Use Stripe Checkout Sessions for onboarding new subscriptions or one-time purchases instead of building custom payment forms, to speed up development and ensure maximum security.
2. **Customer Portal**: Always implement the Stripe Customer Portal for users to manage their own billing (upgrades, downgrades, cancellations, invoices) to save development overhead.
3. **Webhook Supremacy**: The webhook is the single source of truth. NEVER update a user's subscription status in the database via the client-side success URL. Always rely on the server-side webhook handler receiving the `invoice.payment_succeeded` or `customer.subscription.updated` events.

## Implementation Guidelines
- **Security Check**: ALWAYS verify the `stripe-signature` header in your webhook handler using the `stripe.webhooks.constructEvent` method.
- **Database Syncing**: Ensure your database schema has a standard way of storing Stripe IDs (`stripeCustomerId`, `stripeSubscriptionId`, `stripePriceId`) linked to the user's account.
- **Error Handling**: Payments fail. Your application UI must gracefully handle accounts heavily in arrears (e.g., displaying a "Payment Failed - Please update your card" banner and restricting access if necessary).
