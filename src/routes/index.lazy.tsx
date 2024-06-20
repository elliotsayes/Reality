import { AoWallet } from '@/features/ao/lib/aoWallet';
import { WaitlistScreen } from '@/features/waitlist/components/WaitlistScreen';
import { WaitlistSplash } from '@/features/waitlist/components/WaitlistSplash';
import { createLazyFileRoute, useNavigate } from '@tanstack/react-router'
import { ReactNode, useEffect } from 'react';

export const Route = createLazyFileRoute('/')({
  component: Index,
})

function Index() {
  return (
    <WaitlistSplash
      loginTitle='Sign in'
      temporaryWalletEnabled={false}
    >
      {(wallet, disconnect) => {
        return <WaitlistScreen
          wallet={wallet}
        />
      }}
    </WaitlistSplash>
  )
}
