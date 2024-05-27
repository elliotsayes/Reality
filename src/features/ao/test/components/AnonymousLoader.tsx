import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { createAnonymousWallet } from "../../lib/wallets/anonymous";
import { AoWallet } from "../../lib/aoWallet";

interface AnonymousProps {
  children: (wallet: AoWallet) => React.ReactNode
}

function AnonymousGenerator({ children }: AnonymousProps) {
  const wallet = useSuspenseQuery({
    queryKey: ["anonymous"],
    queryFn: async () => 
      createAnonymousWallet({
        permissions: [],
      }).then((wallet) => {
        if (!wallet.success) {
          throw wallet.error;
        }
        return wallet.result;
      })
  })

  return children(wallet.data)
}

export default function AnonymousLoader({children}: AnonymousProps) {
  return (
    <Suspense fallback={<div>Generating...</div>}>
      <AnonymousGenerator>
        {(wallet) => (
          children(wallet)
        )}
      </AnonymousGenerator>
    </Suspense>
  )
}
