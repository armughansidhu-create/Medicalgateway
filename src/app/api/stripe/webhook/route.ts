import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig  = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createAdminClient()

  switch (event.type) {

    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId  = session.metadata?.user_id
      if (!userId) break

      await supabase.from('user_profiles').update({
        subscription_status:     'active',
        subscription_plan:       session.metadata?.plan,
        stripe_customer_id:      session.customer as string,
        stripe_subscription_id:  session.subscription as string,
        subscription_end:        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      }).eq('id', userId)

      await supabase.from('subscription_events').insert({
        user_id:        userId,
        event_type:     'created',
        plan:           session.metadata?.plan,
        amount_pkr:     (session.amount_total || 0) / 100,
        stripe_event_id: event.id,
      })
      break
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string

      const { data: profile } = await supabase
        .from('user_profiles').select('id').eq('stripe_customer_id', customerId).single()
      if (!profile) break

      await supabase.from('user_profiles').update({
        subscription_status: 'active',
        subscription_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      }).eq('id', profile.id)

      await supabase.from('subscription_events').insert({
        user_id:         profile.id,
        event_type:      'renewed',
        amount_pkr:      (invoice.amount_paid || 0) / 100,
        stripe_event_id: event.id,
      })
      break
    }

    case 'invoice.payment_failed': {
      const invoice    = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string

      const { data: profile } = await supabase
        .from('user_profiles').select('id').eq('stripe_customer_id', customerId).single()
      if (!profile) break

      await supabase.from('user_profiles').update({
        subscription_status: 'past_due',
      }).eq('id', profile.id)

      await supabase.from('subscription_events').insert({
        user_id:         profile.id,
        event_type:      'payment_failed',
        stripe_event_id: event.id,
      })
      break
    }

    case 'customer.subscription.deleted': {
      const sub        = event.data.object as Stripe.Subscription
      const customerId = sub.customer as string

      const { data: profile } = await supabase
        .from('user_profiles').select('id').eq('stripe_customer_id', customerId).single()
      if (!profile) break

      await supabase.from('user_profiles').update({
        subscription_status: 'canceled',
        subscription_end:    new Date().toISOString(),
      }).eq('id', profile.id)

      await supabase.from('subscription_events').insert({
        user_id:         profile.id,
        event_type:      'canceled',
        stripe_event_id: event.id,
      })
      break
    }
  }

  return NextResponse.json({ received: true })
}
