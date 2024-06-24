import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { createGeneratedWallet } from "../../lib/wallets/generated";
import { AoWallet } from "../../lib/aoWallet";

interface AnonymousProps {
  children: (wallet: AoWallet) => React.ReactNode;
}

function AnonymousGenerator({ children }: AnonymousProps) {
  const wallet = useSuspenseQuery({
    queryKey: ["anonymous"],
    queryFn: async () =>
      createGeneratedWallet({
        permissionsRequested: [],
      }).then((wallet) => {
        if (!wallet.success) {
          throw wallet.error;
        }
        return wallet.result;
      }),
  });

  return children(wallet.data);
}

export default function AnonymousLoader({ children }: AnonymousProps) {
  return (
    <Suspense fallback={<div>Generating...</div>}>
      <AnonymousGenerator>{(wallet) => children(wallet)}</AnonymousGenerator>
    </Suspense>
  );
}
