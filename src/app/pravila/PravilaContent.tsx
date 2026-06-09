'use client';

import { useRouter } from 'next/navigation';
import GameRules from '@/components/GameRules';

export default function PravilaContent({
  nextUrl,
  isOnboarding,
  hasUser,
}: {
  nextUrl: string;
  isOnboarding: boolean;
  hasUser: boolean;
}) {
  const router = useRouter();

  // V onboarding načinu CTA gumb skrijemo (prikazan je OnboardingCTA spodaj)
  // V normalnem načinu onStart navigira na /dashboard
  const handleStart = isOnboarding
    ? undefined
    : hasUser
      ? () => router.push('/dashboard')
      : undefined;

  return <GameRules onStart={handleStart} />;
}
