import { Button } from "@/components/ui/button";
import { createAoContractClientForProcess } from "@/features/ao/lib/aoContractClient";
import { truncateAddress } from "@/features/arweave/lib/utils";
import { createChatClientForProcess } from "@/features/chat/contract/chatClient";
import { Login } from "@/features/login/components/Login";
import { createProfileClientForProcess } from "@/features/profile/contract/profileClient";
import { Renderer } from "@/features/render/components/Renderer";
import { createVerseClientForProcess } from "@/features/verse/contract/verseClient";
import { createLazyFileRoute, useParams } from "@tanstack/react-router";

const profileProcessId = import.meta.env.VITE_PROFILE_PROCESS_ID as string;

const versePathRegex = /^verse\/([a-zA-Z0-9_-]{43})$/;

export const Route = createLazyFileRoute("/app/$")({
  component: VerseId,
});

const addressWhitelist = [
  "0cQJ5Hd4oCaL57CWP-Pqe5_e0D4_ZDWuxKBgR9ke1SI",
  "0yTSTgkCdcgxZHshUDHobfo_sHzW7ZIbqse8eMy_wJY",
  "71jBJuC2FPubKtv687Q1kc8ee43l_a_8D9TZGIgShzg",
  "uf_FqRvLqjnFMc8ZzGkF4qWKuNmUIQcYP0tPlCGORQk",
  "v2XXwq_FvVqH2KR4p_x8H-SQ7rDwZBbykSv-59__Avc",
  "aC75VhWSsEOnp-SMg3l40o4lvs1OxBNMYXVZnt-7lhw",
  "5VPys2doO8c-eX2wKu07u9Fh2d_K7PtZ6pThV_K1I6s",
  "UPJHTNsaKcC6baqLFHMAMI7daWPIG3NDDfFQ2s2h8T0",
  "q-RR9fXWCubz3a5-KndWAjKblsG_qB-zXdcQibIL3lw",
  "MnYBURB3NcF6R2tfWkXWMtdzv0X1tchgXpWZPKpmjuA",
  "YvdNQ-5DFa67zDH6ANMBaf7n4hg5jTpDoz84JtqXmAo",
  "IWJPipyG_rq6Wq_UWJZbbUEek930Goo30MktSoiWtFk",
  "qqg_q69nWNQwEXUajdX-Zy3du9HMz-p0Wp-8tFQGDtU",
  "FZx2g_LPDIj09ksj8dksbMWqjnSxoXAyEqxPrQDc1MI",
  "YxFhHPuYgB1PvchIjcQ569bn9WMspuxrJgT71DFg4uo",
  "sM9nBtAlqIfxTLOXv4aYm9u3JsOyvKqG8XLb5UirT_I",
];

function VerseId() {
  const { _splat } = useParams({
    // Not sure why I have to do this but whatever
    select: (params) => ({
      _splat: Object.prototype.hasOwnProperty.call(params, "_splat")
        ? String((params as Record<"_splat", string>)._splat)
        : "",
    }),
    strict: false,
  });

  let verseId = undefined;
  if (_splat.startsWith("verse/")) {
    const match = versePathRegex.exec(_splat);
    if (match) {
      verseId = match[1];
    } else {
      return <div>Invalid verse ID</div>;
    }
  }

  return (
    // <div className="bg-gray-100 h-dvh overflow-clip">
    <Login>
      {(wallet, disconnect) => {
        if (addressWhitelist.includes(wallet.address))
          return (
            <div>
              <div className="flex flex-row gap-4 items-baseline fixed top-0 right-0 py-2 px-2">
                <p>
                  Wallet:{" "}
                  <span className="font-mono text-sm text-muted-foreground">
                    {truncateAddress(wallet.address)}
                  </span>
                </p>
                <Button onClick={disconnect} size={"sm"} variant={"secondary"}>
                  Log out
                </Button>
              </div>
              <div className="fixed top-14 right-0 left-0 bottom-0">
                <Renderer
                  userAddress={wallet.address}
                  aoContractClientForProcess={createAoContractClientForProcess(
                    wallet,
                  )}
                  profileClient={createProfileClientForProcess(wallet)(
                    profileProcessId,
                  )}
                  verseClientForProcess={createVerseClientForProcess(wallet)}
                  chatClientForProcess={createChatClientForProcess(wallet)}
                  verseId={verseId}
                />
              </div>
            </div>
          );

        return <div>Unauthorized</div>;
      }}
    </Login>
    // </div>
  );
}
