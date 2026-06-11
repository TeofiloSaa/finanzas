import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSubscriptionStatus } from '@/app/actions/subscription'
import PricingClient from '@/components/pricing/PricingClient'

export const dynamic = 'force-dynamic'

export default async function PricingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { plan, planExpiresAt, subscriptionId } = await getSubscriptionStatus(user.id)

  return (
    <PricingClient
      plan={plan}
      planExpiresAt={planExpiresAt}
      subscriptionId={subscriptionId}
    />
  )
}
