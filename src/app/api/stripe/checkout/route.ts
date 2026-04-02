import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { plan } = await req.json()
  const priceId = plan === 'annual_full'
    ? process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL_FULL!
    : process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL_DISCOUNTED!

  const { data: profile } = await supabase
    .from('user_profiles').select('stripe_customer_id, email, full_name').eq('id', user.id).single()

  const session = await stripe.checkout.sessions.create({
    mode:           'subscription',
    payment_method_types: ['card'],
    currency:       'pkr',
    customer:       profile?.stripe_customer_id || undefined,
    customer_email: profile?.stripe_customer_id ? undefined : user.email,
    line_items:     [{ price: priceId, quantity: 1 }],
    metadata:       { user_id: user.id, plan },
    success_url:    `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscribed=1`,
    cancel_url:     `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=1`,
    allow_promotion_codes: true,
  })

  return NextResponse.json({ url: session.url })
}
